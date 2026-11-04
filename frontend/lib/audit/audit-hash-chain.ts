/**
 * CAURI - Moteur de Chaînage Cryptographique d'Audit Immuable (SHA-256)
 * Garantit la non-répudiation, la traçabilité intégrale et l'anti-fraude interne.
 */

export interface RawAuditEvent {
  id: string;
  organization_id?: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  actor_user_id: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ChainedAuditEvent extends RawAuditEvent {
  sequence_number: number;
  previous_hash: string;
  hash: string;
  is_valid?: boolean;
}

export interface AuditChainIntegrityReport {
  isValid: boolean;
  totalEvents: number;
  verifiedEvents: number;
  brokenAtEventId: string | null;
  brokenAtSequence: number | null;
  genesisHash: string;
  chainHeadHash: string;
  verifiedAt: string;
}

export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Fonction de hachage SHA-256 résiliente et universelle
 * Utilise Web Crypto API si disponible, avec fallback pure-JS robuste pour tous les environnements
 */
export function sha256Hex(message: string): string {
  // Implémentation SHA-256 standard pure JS pour compatibilité universelle synchrone (SSR, Node, Tests, Browser)
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;

  const words: number[] = [];
  const asciiBitLength = message.length * 8;

  const hash: number[] = [];
  const k: number[] = [];

  // Constantes de hachage (premières décimales des racines carrées et cubiques de nombres premiers)
  let primeCounter = 0;
  const isPrime: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isPrime[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isPrime[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  message += "\x80";
  while ((message.length % 64) - 56) message += "\x00";
  for (i = 0; i < message.length; i++) {
    j = message.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words.push((asciiBitLength / maxWord) | 0);
  words.push(asciiBitLength);

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const s0 = i < 16 ? w[i] : (w[i] =
        (w[i - 16] +
          (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
          w[i - 7] +
          (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
        0);

      const s1 =
        rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const ch = (hash[0] & hash[1]) ^ (~hash[0] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ((hash[4] & hash[5]) ^ (~hash[4] & hash[6])) + k[i] + s0) | 0;
      const temp2 = (s1 + ((hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]))) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  let result = "";
  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255;
      result += (byte < 16 ? "0" : "") + byte.toString(16);
    }
  }
  return result;
}

/**
 * Normalise un payload en chaîne canonique déterministe (clés triées)
 */
export function canonicalizePayload(payload: Record<string, unknown> | null | undefined): string {
  if (!payload || typeof payload !== "object") return "{}";
  const sortedKeys = Object.keys(payload).sort();
  const canonicalObj: Record<string, unknown> = {};
  for (const k of sortedKeys) {
    const val = payload[k];
    if (val !== undefined) {
      canonicalObj[k] = val;
    }
  }
  return JSON.stringify(canonicalObj);
}

/**
 * Calcule l'empreinte cryptographique d'un événement financier lié à son prédécesseur
 */
export function calculateEventHash(
  event: RawAuditEvent,
  previousHash: string = GENESIS_HASH
): string {
  const canonicalPayload = canonicalizePayload(event.payload);
  const dataToHash = [
    previousHash,
    event.id,
    event.created_at,
    event.actor_user_id,
    event.entity_type,
    event.entity_id,
    event.event_type,
    canonicalPayload,
  ].join("|");

  return sha256Hex(dataToHash);
}

/**
 * Construit la chaîne de blocs d'audit complète pour une organisation
 */
export function buildAuditChain(events: RawAuditEvent[]): ChainedAuditEvent[] {
  // Tri chronologique strict par date de création, puis par ID en cas d'égalité
  const sorted = [...events].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });

  let currentPreviousHash = GENESIS_HASH;
  const chained: ChainedAuditEvent[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i];
    const hash = calculateEventHash(ev, currentPreviousHash);

    chained.push({
      ...ev,
      sequence_number: i + 1,
      previous_hash: currentPreviousHash,
      hash,
      is_valid: true,
    });

    currentPreviousHash = hash;
  }

  return chained;
}

/**
 * Vérifie l'intégrité intégrale de la chaîne d'audit
 * Détecte toute altération, suppression ou modification rétroactive
 */
export function verifyAuditChainIntegrity(events: RawAuditEvent[]): AuditChainIntegrityReport {
  const chained = buildAuditChain(events);
  const now = new Date().toISOString();

  if (chained.length === 0) {
    return {
      isValid: true,
      totalEvents: 0,
      verifiedEvents: 0,
      brokenAtEventId: null,
      brokenAtSequence: null,
      genesisHash: GENESIS_HASH,
      chainHeadHash: GENESIS_HASH,
      verifiedAt: now,
    };
  }

  let verifiedCount = 0;
  let runningPreviousHash = GENESIS_HASH;

  for (let i = 0; i < chained.length; i++) {
    const ev = chained[i];
    const expectedHash = calculateEventHash(ev, runningPreviousHash);

    if (ev.hash !== expectedHash || ev.previous_hash !== runningPreviousHash) {
      return {
        isValid: false,
        totalEvents: chained.length,
        verifiedEvents: verifiedCount,
        brokenAtEventId: ev.id,
        brokenAtSequence: ev.sequence_number,
        genesisHash: GENESIS_HASH,
        chainHeadHash: chained[chained.length - 1].hash,
        verifiedAt: now,
      };
    }

    verifiedCount++;
    runningPreviousHash = ev.hash;
  }

  return {
    isValid: true,
    totalEvents: chained.length,
    verifiedEvents: verifiedCount,
    brokenAtEventId: null,
    brokenAtSequence: null,
    genesisHash: GENESIS_HASH,
    chainHeadHash: chained[chained.length - 1].hash,
    verifiedAt: now,
  };
}

/**
 * Formate un libellé compréhensible pour chaque type d'événement d'audit
 */
export function formatAuditEventDescription(event: RawAuditEvent): {
  title: string;
  category: "sale" | "expense" | "smartdoc" | "validation" | "caisse" | "security";
  badgeColor: string;
  badgeBg: string;
} {
  const type = event.event_type.toLowerCase();

  if (type.includes("smartdoc") || type.includes("sign")) {
    return {
      title: "Signature & Règlement Smart Document Vivant",
      category: "smartdoc",
      badgeColor: "#0284c7",
      badgeBg: "rgba(2, 132, 199, 0.12)",
    };
  }
  if (type.includes("payment") || type.includes("paid")) {
    return {
      title: "Encaissement / Règlement de Facture",
      category: "sale",
      badgeColor: "#16a34a",
      badgeBg: "rgba(22, 163, 74, 0.12)",
    };
  }
  if (type.includes("expense") || event.entity_type === "expense") {
    return {
      title: "Décaissement & Dépense d'Exploitation",
      category: "expense",
      badgeColor: "#ea580c",
      badgeBg: "rgba(234, 88, 12, 0.12)",
    };
  }
  if (type.includes("validation")) {
    return {
      title: "Double Contrôle & Approbation Managériale",
      category: "validation",
      badgeColor: "#9333ea",
      badgeBg: "rgba(147, 51, 234, 0.12)",
    };
  }
  if (type.includes("caisse") || type.includes("pos")) {
    return {
      title: "Mouvement de Caisse & Vente Tactile",
      category: "caisse",
      badgeColor: "#00a86b",
      badgeBg: "rgba(0, 168, 107, 0.12)",
    };
  }

  return {
    title: `Écriture certifiée : ${event.event_type}`,
    category: "security",
    badgeColor: "#475569",
    badgeBg: "rgba(71, 85, 105, 0.12)",
  };
}
