import express from "express";
import cors from "cors";
import pino from "pino";
import QRCode from "qrcode";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  downloadMediaMessage,
  Browsers,
} from "@whiskeysockets/baileys";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const PORT = process.env.PORT || 8097;
const SESSIONS_DIR = process.env.SESSIONS_DIR || path.join(__dirname, "../sessions");
const BACKEND_URL = process.env.BACKEND_URL || "http://prod_koryxa_services_ia_api:8080";
const AUDIO_ENGINE_URL = process.env.AUDIO_ENGINE_URL || "http://koryxa-audio-engine:8099";
const SERVICE_IA_PROXY_SECRET = (process.env.SERVICE_IA_PROXY_SECRET || "").trim();

if (!SERVICE_IA_PROXY_SECRET && process.env.NODE_ENV === "production") {
  logger.fatal("SERVICE_IA_PROXY_SECRET obligatoire en production");
  process.exit(1);
}

if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Validation UUIDv4 stricte pour empêcher tout path traversal
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateOrgId(orgId) {
  if (!orgId || typeof orgId !== "string" || !UUID_REGEX.test(orgId.trim())) {
    return null;
  }
  return orgId.trim();
}

// Middleware d'authentification interne
function requireAuth(req, res, next) {
  const secretHeader = req.headers["x-koryxa-proxy-secret"];
  if (process.env.NODE_ENV === "production" && (!secretHeader || secretHeader !== SERVICE_IA_PROXY_SECRET)) {
    return res.status(401).json({ error: "Unauthorized: Invalid or missing X-Koryxa-Proxy-Secret" });
  }
  next();
}

// Registre des sessions multi-tenant en mémoire
const orgSessions = new Map();

function getOrCreateSessionState(orgId) {
  if (!orgSessions.has(orgId)) {
    orgSessions.set(orgId, {
      status: "disconnected",
      qrDataUrl: null,
      connectedUser: null,
      socket: null,
      starting: false,
    });
  }
  return orgSessions.get(orgId);
}

export async function startSessionForOrg(orgId) {
  const validOrgId = validateOrgId(orgId);
  if (!validOrgId) {
    logger.warn({ orgId }, "Tentative de démarrage de session avec un org_id invalide");
    return null;
  }

  const sess = getOrCreateSessionState(validOrgId);
  if (sess.starting || (sess.socket && sess.status === "connected")) {
    return sess.socket;
  }

  sess.starting = true;
  sess.status = "connecting";

  const sessionPath = path.join(SESSIONS_DIR, validOrgId);
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307], isLatest: true }));

  logger.info({ orgId: validOrgId, version, isLatest }, `Démarrage session WhatsApp pour org`);

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
    },
    browser: Browsers.ubuntu("Chrome"),
    generateHighQualityLinkPreview: true,
  });

  sess.socket = sock;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        sess.qrDataUrl = await QRCode.toDataURL(qr, {
          width: 320,
          margin: 2,
          color: { dark: "#065f46", light: "#ffffff" },
        });
        sess.status = "scanning";
        sess.starting = false;
        logger.info({ orgId: validOrgId }, "Nouveau QR Code généré pour org");
      } catch (err) {
        logger.error({ err: err.message, orgId: validOrgId }, "Erreur génération QR Code");
      }
    }

    if (connection === "open") {
      sess.status = "connected";
      sess.qrDataUrl = null;
      sess.connectedUser = sock.user;
      sess.starting = false;
      const phone = sock.user?.id ? sock.user.id.split(":")[0] : "Inconnu";
      logger.info({ orgId: validOrgId, phone, name: sock.user?.name }, "WhatsApp connecté avec succès pour org !");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn({ orgId: validOrgId, statusCode, shouldReconnect }, "Connexion WhatsApp fermée.");

      sess.starting = false;
      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        logger.warn({ orgId: validOrgId, statusCode, shouldReconnect }, "Connexion WhatsApp fermée");

        // Notification d'alerte au backend KORYXA
        try {
          axios.post(
            `${BACKEND_URL}/api/v1/integrations/whatsapp/session-alert`,
            {
              organization_id: validOrgId,
              event: shouldReconnect ? "whatsapp_session_reconnecting" : "whatsapp_session_logged_out",
              details: { statusCode, reason: lastDisconnect?.error?.message || "connection_closed" },
            },
            {
              timeout: 5000,
              headers: { "X-Koryxa-Proxy-Secret": SERVICE_IA_PROXY_SECRET },
            }
          ).catch(() => {});
        } catch (_) {}

        sess.starting = false;
        if (shouldReconnect) {
          sess.status = "connecting";
          setTimeout(() => startSessionForOrg(validOrgId), 3000);
        } else {
          sess.status = "disconnected";
          sess.qrDataUrl = null;
          sess.connectedUser = null;
          sess.socket = null;
          try {
            fs.rmSync(sessionPath, { recursive: true, force: true });
          } catch (_) {}
        }
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;
        const remoteJid = msg.key.remoteJid;
        if (!remoteJid || remoteJid.includes("@broadcast") || remoteJid.includes("@newsletter")) continue;

        let senderPhone = "";
        let senderLid = null;
        let senderJid = remoteJid;

        // Gestion rigoureuse des identifiants @lid vs @s.whatsapp.net (E.164)
        if (remoteJid.endsWith("@lid")) {
          senderLid = remoteJid.replace("@lid", "");
          if (msg.key.participant && msg.key.participant.endsWith("@s.whatsapp.net")) {
            senderPhone = "+" + msg.key.participant.replace("@s.whatsapp.net", "").replace(/[^0-9]/g, "");
            senderJid = msg.key.participant;
          }
        } else if (remoteJid.endsWith("@s.whatsapp.net") || remoteJid.endsWith("@c.us")) {
          senderPhone = "+" + remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "").replace(/[^0-9]/g, "");
          if (msg.key.participant && msg.key.participant.endsWith("@lid")) {
            senderLid = msg.key.participant.replace("@lid", "");
          }
        }

        let textContent = "";

        // 1. Message Texte
        if (msg.message.conversation) {
          textContent = msg.message.conversation.trim();
        } else if (msg.message.extendedTextMessage?.text) {
          textContent = msg.message.extendedTextMessage.text.trim();
        }

        // 2. Message Vocal -> Transcription via Whisper
        const isAudio = Boolean(
          msg.message.audioMessage ||
          (msg.message.documentMessage && (msg.message.documentMessage.mimetype || "").includes("audio"))
        );
        if (isAudio) {
          try {
            logger.info({ orgId: validOrgId, senderPhone, senderLid }, "Téléchargement buffer audio vocal...");
            const audioBuffer = await downloadMediaMessage(msg, "buffer", {});
            
            if (audioBuffer && audioBuffer.length > 0) {
              const form = new FormData();
              form.append("file", audioBuffer, { filename: "voice.ogg", contentType: "audio/ogg" });
              form.append("language", "fr");

              const transcribeRes = await axios.post(`${AUDIO_ENGINE_URL}/transcribe`, form, {
                headers: form.getHeaders(),
                timeout: 25000,
              });

              if (transcribeRes.data && transcribeRes.data.text) {
                textContent = transcribeRes.data.text.trim();
                logger.info({ orgId: validOrgId, senderPhone, senderLid }, "Vocal transcrit avec succès");
              }
            }
          } catch (err) {
            logger.error({ err: err.message, orgId: validOrgId }, "Erreur transcription audio WhatsApp");
          }
        }

        if (!textContent) continue;

        logger.info({ orgId: validOrgId, senderPhone, senderLid }, "Transmission message WhatsApp au backend KORYXA");

        // 3. Appel Webhook Backend KORYXA avec X-Koryxa-Proxy-Secret
        try {
          const payload = {
            text: textContent,
            from: senderPhone || (senderLid ? `${senderLid}@lid` : remoteJid),
            sender_jid: senderJid,
            sender_lid: senderLid,
            push_name: msg.pushName || null,
            message_id: msg.key.id || `wa_${Date.now()}`,
            organization_id: validOrgId,
          };

          const backendRes = await axios.post(
            `${BACKEND_URL}/api/v1/integrations/whatsapp/webhook`,
            payload,
            {
              timeout: 15000,
              headers: { "X-Koryxa-Proxy-Secret": SERVICE_IA_PROXY_SECRET },
            }
          );

          const replyMsg = backendRes.data?.reply_message || backendRes.data?.reply;
          if (replyMsg && typeof replyMsg === "string" && replyMsg.trim()) {
            await sock.sendMessage(remoteJid, { text: replyMsg.trim() }, { quoted: msg });
            logger.info({ orgId: validOrgId, remoteJid }, "Réponse WhatsApp envoyée");
          }
        } catch (backendErr) {
          logger.error({ err: backendErr.message, orgId: validOrgId }, "Erreur communication backend KORYXA");
        }
      }
    });

  return sock;
}

// Restauration automatique de toutes les sessions sauvegardées au démarrage
function autoRestoreSessions() {
  try {
    const orgDirs = fs.readdirSync(SESSIONS_DIR);
    for (const dir of orgDirs) {
      if (!validateOrgId(dir)) continue;
      const fullPath = path.join(SESSIONS_DIR, dir);
      if (fs.statSync(fullPath).isDirectory()) {
        logger.info({ orgId: dir }, "Restauration session WhatsApp existante");
        void startSessionForOrg(dir);
      }
    }
  } catch (err) {
    logger.warn({ err: err.message }, "Erreur scan répertoire sessions");
  }
}

// -------------------------------------------------------------
// ENDPOINTS REST API
// -------------------------------------------------------------

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "koryxa-whatsapp-bridge",
    active_sessions: orgSessions.size,
    timestamp: new Date().toISOString(),
  });
});

app.get("/v1/session/qr", requireAuth, async (req, res) => {
  const orgId = validateOrgId(req.query.org_id);
  if (!orgId) {
    return res.status(400).json({ error: "org_id UUID requis" });
  }

  const sess = getOrCreateSessionState(orgId);

  if (!sess.socket || sess.status === "disconnected") {
    void startSessionForOrg(orgId);
  }

  res.json({
    org_id: orgId,
    status: sess.status,
    qr: sess.qrDataUrl,
    phone: sess.connectedUser?.id ? "+" + sess.connectedUser.id.split(":")[0] : null,
    user_name: sess.connectedUser?.name || null,
  });
});

app.get("/v1/session/status", requireAuth, (req, res) => {
  const orgId = validateOrgId(req.query.org_id);
  if (!orgId) {
    return res.status(400).json({ error: "org_id UUID requis" });
  }

  const sess = getOrCreateSessionState(orgId);

  res.json({
    org_id: orgId,
    status: sess.status,
    is_connected: sess.status === "connected",
    phone: sess.connectedUser?.id ? "+" + sess.connectedUser.id.split(":")[0] : null,
    user_name: sess.connectedUser?.name || null,
  });
});

app.post("/v1/session/disconnect", requireAuth, async (req, res) => {
  const orgId = validateOrgId(req.query.org_id || req.body?.org_id);
  if (!orgId) {
    return res.status(400).json({ error: "org_id UUID requis" });
  }

  const sess = getOrCreateSessionState(orgId);

  try {
    if (sess.socket) {
      await sess.socket.logout();
    }
  } catch (_) {}

  sess.status = "disconnected";
  sess.qrDataUrl = null;
  sess.connectedUser = null;
  sess.socket = null;
  sess.starting = false;

  const sessionPath = path.join(SESSIONS_DIR, orgId);
  try {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  } catch (_) {}

  res.json({ ok: true, org_id: orgId, status: "disconnected" });
});

app.post("/v1/session/reset", requireAuth, async (req, res) => {
  const orgId = validateOrgId(req.query.org_id || req.body?.org_id);
  if (!orgId) {
    return res.status(400).json({ error: "org_id UUID requis" });
  }

  const sess = getOrCreateSessionState(orgId);

  try {
    if (sess.socket) {
      sess.socket.end(new Error("Session reset requested"));
    }
  } catch (_) {}

  sess.status = "connecting";
  sess.qrDataUrl = null;
  sess.connectedUser = null;
  sess.socket = null;
  sess.starting = false;

  const sessionPath = path.join(SESSIONS_DIR, orgId);
  try {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  } catch (_) {}

  setTimeout(() => {
    void startSessionForOrg(orgId);
  }, 1000);

  res.json({ ok: true, org_id: orgId, status: "scanning" });
});

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`koryxa-whatsapp-bridge Multi-Tenant sécurisé démarré sur http://0.0.0.0:${PORT}`);
  autoRestoreSessions();
});
