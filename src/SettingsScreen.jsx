import { useState } from "react";

const S = {
  bg:      "#020810",
  card:    "#0c1828",
  border:  "#1e293b",
  text:    "#e2e8f0",
  muted:   "#64748b",
  accent:  "#6bcbff",
  red:     "#f87171",
  green:   "#34d399",
};

function Row({ children }) {
  return (
    <div style={{
      background: S.card,
      border: `1px solid ${S.border}`,
      borderRadius: 12,
      padding: "16px 20px",
      marginBottom: 10,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}>
      {children}
    </div>
  );
}

export default function SettingsScreen({ totalSolved, totalPuzzles, clearSave }) {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      // Auto-cancel confirmation after 4 seconds
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    clearSave();
    setConfirmReset(false);
  };

  return (
    <div style={{
      minHeight: "100svh",
      background: `radial-gradient(ellipse at 20% 10%, #0a1628, ${S.bg} 60%)`,
      padding: "52px 20px 100px",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>

      <h1 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: "1.6rem",
        fontWeight: 700,
        color: S.text,
        margin: "0 0 28px 0",
      }}>
        Settings
      </h1>

      {/* Progress summary */}
      <div style={{
        fontSize: "0.72rem",
        color: S.muted,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: 10,
        marginLeft: 4,
      }}>
        Progress
      </div>
      <Row>
        <span style={{ color: S.muted, fontSize: "0.9rem" }}>Puzzles solved</span>
        <span style={{ color: S.accent, fontWeight: 700 }}>
          {totalSolved} / {totalPuzzles}
        </span>
      </Row>

      <div style={{ height: 20 }}/>

      {/* About */}
      <div style={{
        fontSize: "0.72rem",
        color: S.muted,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: 10,
        marginLeft: 4,
      }}>
        About
      </div>
      <Row>
        <span style={{ color: S.muted, fontSize: "0.9rem" }}>Version</span>
        <span style={{ color: S.muted, fontSize: "0.9rem" }}>1.0.0</span>
      </Row>
      <div style={{
        background: S.card,
        border: `1px solid ${S.border}`,
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 10,
      }}>
        <p style={{ color: S.muted, fontSize: "0.88rem", lineHeight: 1.7, margin: 0 }}>
          Lumina is a relaxing light puzzle game. No ads. No timers. No accounts.
          Just light, mirrors, and a world that's slowly remembering itself.
        </p>
      </div>

      <div style={{ height: 20 }}/>

      {/* Reset */}
      <div style={{
        fontSize: "0.72rem",
        color: S.muted,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: 10,
        marginLeft: 4,
      }}>
        Data
      </div>
      <button
        onClick={handleReset}
        style={{
          width: "100%",
          padding: "15px 20px",
          background: confirmReset ? "#1f0a0a" : S.card,
          border: `1px solid ${confirmReset ? S.red + "55" : S.border}`,
          borderRadius: 12,
          color: confirmReset ? S.red : S.muted,
          fontSize: "0.9rem",
          fontWeight: confirmReset ? 700 : 500,
          cursor: "pointer",
          textAlign: "left",
          transition: "all .2s",
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
      >
        {confirmReset
          ? "⚠ Tap again to confirm — this cannot be undone"
          : "Reset all progress"}
      </button>
      <p style={{
        fontSize: "0.75rem",
        color: S.muted,
        margin: "8px 4px 0",
        opacity: 0.6,
      }}>
        Removes all saved stars and puzzle completions.
      </p>

    </div>
  );
}
