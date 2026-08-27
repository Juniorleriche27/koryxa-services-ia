import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "KORYXA — Mémoire Opérationnelle & Service IA";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "60px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "28px",
              fontWeight: 900,
            }}
          >
            K
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", letterSpacing: "1px" }}>
              KORYXA
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#a7f3d0", letterSpacing: "2px", textTransform: "uppercase" }}>
              Service IA & Mémoire Opérationnelle
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "900px" }}>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Le Cockpit Dirigeant & IA pour piloter vos Ventes, Caisse, Stocks & Équipes.
          </h1>
          <p
            style={{
              fontSize: "22px",
              fontWeight: 500,
              color: "#d1fae5",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Dictée vocale intelligente · Passerelle WhatsApp native · Pointage QR dynamique · Radar Sentinelle IA
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              padding: "10px 20px",
              borderRadius: "30px",
              background: "rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            🎙️ Dictée Vocale
          </div>
          <div
            style={{
              padding: "10px 20px",
              borderRadius: "30px",
              background: "rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            📱 WhatsApp Métier
          </div>
          <div
            style={{
              padding: "10px 20px",
              borderRadius: "30px",
              background: "rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            🟢 Pointage QR & GPS
          </div>
          <div
            style={{
              padding: "10px 20px",
              borderRadius: "30px",
              background: "rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            🌍 Multi-Devises
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
