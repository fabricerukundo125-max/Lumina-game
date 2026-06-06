import { useState } from "react";
import { formatRelativeTime } from "../hooks/useJournal";

const JOURNAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@400;500;600&display=swap');
  @keyframes entryFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes iconPulse {
    0%,100% { opacity: .7; }
    50%      { opacity: 1; }
  }
`;

const TYPE_COLORS = {
  restore:   "#4fc3f7",
  stage:     "#fbbf24",
  discovery: "#a78bfa",
};

const TYPE_LABELS = {
  restore:   "RESTORED",
  stage:     "MILESTONE",
  discovery: "DISCOVERED",
};

// ─── Single journal entry ─────────────────────────────────────────────────────
function JournalEntry({ entry, index }) {
  const color = TYPE_COLORS[entry.type] || "#4fc3f7";
  const label = TYPE_LABELS[entry.type] || "EVENT";

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
      padding: "16px 0",
      borderBottom: "1px solid #ffffff06",
      animation: `entryFadeIn .4s ${Math.min(index * 0.06, 0.5)}s ease both`,
    }}>
      {/* Icon */}
      <div style={{
        width: 36, height: 36,
        borderRadius: "50%",
        background: color + "12",
        border: `1px solid ${color}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        fontSize: 14,
        color,
        animation: "iconPulse 3s ease infinite",
      }}>
        {entry.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "1.0rem",
          fontStyle: "italic",
          fontWeight: 400,
          color: "#d4e4f4",
          lineHeight: 1.5,
          marginBottom: 5,
        }}>
          {entry.title}
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: color + "99",
            background: color + "10",
            border: `1px solid ${color}20`,
            borderRadius: 4,
            padding: "2px 7px",
          }}>
            {label}
          </span>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            color: "#ffffff22",
          }}>
            {formatRelativeTime(entry.ts)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyJournal() {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 32px",
      textAlign: "center",
    }}>
      <div style={{
        fontSize: 36,
        color: "#ffffff0a",
        marginBottom: 20,
        fontFamily: "'Cormorant Garamond', serif",
      }}>
        ◈
      </div>
      <div style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: "1.05rem",
        fontStyle: "italic",
        color: "#ffffff14",
        lineHeight: 1.7,
        maxWidth: 220,
      }}>
        The journal is silent.<br/>
        Solve a puzzle to write the first entry.
      </div>
    </div>
  );
}

// ─── JournalScreen ────────────────────────────────────────────────────────────
export default function JournalScreen({ entries, totalSolved }) {
  return (
    <div style={{
      minHeight: "100svh",
      background: "radial-gradient(ellipse at 25% 15%, #080f1e 0%, #020810 70%)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif",
      paddingBottom: 80,
    }}>
      <style>{JOURNAL_CSS}</style>

      {/* Header */}
      <div style={{
        padding: "52px 24px 20px",
        borderBottom: "1px solid #ffffff06",
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "clamp(1.6rem, 5vw, 2rem)",
          fontWeight: 600,
          color: "#e2e8f0",
          marginBottom: 4,
        }}>
          Light Journal
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "0.9rem",
          fontStyle: "italic",
          color: "#4fc3f766",
        }}>
          {totalSolved === 0
            ? "Nothing recorded yet."
            : `${entries.length} moment${entries.length !== 1 ? "s" : ""} preserved.`}
        </div>
      </div>

      {/* Entry list */}
      <div style={{
        flex: 1,
        padding: "8px 24px 0",
        overflowY: "auto",
      }}>
        {entries.length === 0
          ? <EmptyJournal />
          : entries.map((entry, i) => (
              <JournalEntry key={entry.id} entry={entry} index={i} />
            ))
        }
      </div>

      {/* Footer — subtle total count */}
      {entries.length > 0 && (
        <div style={{
          padding: "16px 24px",
          textAlign: "center",
          fontSize: 11,
          color: "#ffffff10",
          letterSpacing: "0.1em",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {totalSolved} PUZZLE{totalSolved !== 1 ? "S" : ""} SOLVED
        </div>
      )}
    </div>
  );
}
