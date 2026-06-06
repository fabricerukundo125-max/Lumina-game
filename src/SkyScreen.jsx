import { useEffect, useRef, useState } from "react";

// ─── Constellation lines ──────────────────────────────────────────────────────
// Once 3+ stars exist, draw connecting lines in order of solve time.
// Lines are drawn between consecutive stars (sorted by solvedAt).
function ConstellationLines({ stars, opacity }) {
  if (stars.length < 2) return null;
  const sorted = [...stars].sort((a, b) => a.solvedAt - b.solvedAt);

  return (
    <>
      {sorted.slice(0, -1).map((star, i) => {
        const next = sorted[i + 1];
        return (
          <line
            key={`${star.puzzleId}-${next.puzzleId}`}
            x1={`${star.x * 100}%`}
            y1={`${star.y * 100}%`}
            x2={`${next.x * 100}%`}
            y2={`${next.y * 100}%`}
            stroke="#6bcbff"
            strokeWidth="0.5"
            strokeOpacity={opacity * 0.35}
            strokeDasharray="3 4"
          />
        );
      })}
    </>
  );
}

// ─── Single Star ─────────────────────────────────────────────────────────────
function Star({ star, index, isNew }) {
  const [visible, setVisible] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setVisible(true), index * 120 + 80);
      return () => clearTimeout(t);
    }
  }, [isNew, index]);

  const cx = `${star.x * 100}%`;
  const cy = `${star.y * 100}%`;
  const r  = star.size;
  const id = `sg${star.puzzleId}`;

  return (
    <g style={{
      opacity: visible ? 1 : 0,
      transition: "opacity 1.2s ease",
    }}>
      {/* Outer glow */}
      <circle cx={cx} cy={cy} r={r * 3.5}
        fill={star.color} opacity={0.08}/>
      {/* Mid glow */}
      <circle cx={cx} cy={cy} r={r * 1.8}
        fill={star.color} opacity={0.22}/>
      {/* Core */}
      <circle cx={cx} cy={cy} r={r}
        fill={star.color} opacity={0.95}/>
      {/* Twinkle cross */}
      <line
        x1={`calc(${star.x * 100}% - ${r * 2.2}px)`}
        y1={`${star.y * 100}%`}
        x2={`calc(${star.x * 100}% + ${r * 2.2}px)`}
        y2={`${star.y * 100}%`}
        stroke={star.color} strokeWidth="0.6" opacity="0.4"
      />
      <line
        x1={`${star.x * 100}%`}
        y1={`calc(${star.y * 100}% - ${r * 2.2}px)`}
        x2={`${star.x * 100}%`}
        y2={`calc(${star.y * 100}% + ${r * 2.2}px)`}
        stroke={star.color} strokeWidth="0.6" opacity="0.4"
      />
    </g>
  );
}

// ─── Background ambient stars (decorative, always present) ───────────────────
// These are faint, tiny, non-interactive background stars for atmosphere.
// Generated once deterministically — same every render.
const BG_STARS = Array.from({ length: 60 }, (_, i) => {
  const s = (n) => {
    const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5;
    return x - Math.floor(x);
  };
  return {
    x: s(1), y: s(2),
    r: 0.4 + s(3) * 0.9,
    opacity: 0.1 + s(4) * 0.25,
    delay: s(5) * 4,
  };
});

// ─── Sky nebula (atmospheric background gradient blobs) ──────────────────────
function Nebula({ starCount }) {
  // Nebula brightens slightly as more stars are restored
  const intensity = Math.min(starCount / 5, 1);
  return (
    <defs>
      <radialGradient id="neb1" cx="30%" cy="25%" r="45%">
        <stop offset="0%" stopColor="#0a1e3d" stopOpacity={0.6 + intensity * 0.3}/>
        <stop offset="100%" stopColor="#020810" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="neb2" cx="75%" cy="65%" r="40%">
        <stop offset="0%" stopColor="#0d1a2e" stopOpacity={0.5 + intensity * 0.25}/>
        <stop offset="100%" stopColor="#020810" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="neb3" cx="55%" cy="40%" r="35%">
        <stop offset="0%" stopColor="#06122a" stopOpacity={intensity * 0.4}/>
        <stop offset="100%" stopColor="#020810" stopOpacity="0"/>
      </radialGradient>
    </defs>
  );
}

// ─── Twinkle animation ────────────────────────────────────────────────────────
const TWINKLE_CSS = `
  @keyframes twinkle {
    0%,100% { opacity: .12; }
    50%      { opacity: .35; }
  }
  @keyframes twinkleSlow {
    0%,100% { opacity: .08; }
    50%      { opacity: .22; }
  }
  @keyframes fadeInSky {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseGlow {
    0%,100% { opacity: .7; }
    50%      { opacity: 1; }
  }
`;

// ─── Progress label ───────────────────────────────────────────────────────────
function ProgressLabel({ totalSolved, totalPuzzles, pct }) {
  const messages = [
    "The sky holds its breath.",
    "A single light returns.",
    "The world begins to remember.",
    "Stars are finding each other.",
    "The constellation awakens.",
  ];
  const msg = messages[Math.min(totalSolved, messages.length - 1)];

  return (
    <div style={{
      textAlign: "center",
      padding: "0 24px",
      animation: "fadeInSky .6s ease both",
    }}>
      <div style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: "clamp(1.1rem, 4vw, 1.4rem)",
        fontWeight: 700,
        color: "#e2e8f0",
        marginBottom: 6,
      }}>
        {totalSolved === 0 ? "The Sky" : `${totalSolved} of ${totalPuzzles} Restored`}
      </div>
      <div style={{
        fontSize: "0.82rem",
        color: "#6bcbff66",
        fontStyle: "italic",
        marginBottom: 20,
        lineHeight: 1.5,
      }}>
        {msg}
      </div>

      {/* Progress bar */}
      <div style={{
        width: "100%", maxWidth: 280, margin: "0 auto",
        height: 3, background: "#ffffff0a", borderRadius: 2,
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 2,
          width: `${pct}%`,
          background: pct === 100
            ? "linear-gradient(90deg,#a8ff6b,#6bcbff)"
            : "linear-gradient(90deg,#1a4a7a,#6bcbff)",
          transition: "width 1s ease",
          boxShadow: pct > 0 ? "0 0 6px #6bcbff88" : "none",
        }}/>
      </div>
      <div style={{
        fontSize: "0.72rem", color: "#ffffff22",
        marginTop: 8, letterSpacing: "0.08em",
      }}>
        {pct}% ILLUMINATED
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      position: "absolute",
      top: "50%", left: "50%",
      transform: "translate(-50%, -50%)",
      textAlign: "center",
      pointerEvents: "none",
      animation: "fadeInSky 1s ease both",
    }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>✦</div>
      <div style={{
        fontSize: "0.82rem",
        color: "#ffffff1a",
        lineHeight: 1.7,
        maxWidth: 200,
      }}>
        Solve puzzles to restore stars to this sky.
      </div>
    </div>
  );
}

// ─── SkyScreen ────────────────────────────────────────────────────────────────
export default function SkyScreen({ stars, totalSolved, totalPuzzles, pct }) {
  const prevCountRef = useRef(stars.length);
  const [newStarIds, setNewStarIds] = useState(new Set());

  // Detect newly added stars to trigger entrance animation
  useEffect(() => {
    const prev = prevCountRef.current;
    if (stars.length > prev) {
      const newest = stars
        .slice()
        .sort((a, b) => b.solvedAt - a.solvedAt)
        .slice(0, stars.length - prev)
        .map(s => s.puzzleId);
      setNewStarIds(new Set(newest));
      // Clear "new" flag after animation completes
      const t = setTimeout(() => setNewStarIds(new Set()), 2000);
      prevCountRef.current = stars.length;
      return () => clearTimeout(t);
    }
    prevCountRef.current = stars.length;
  }, [stars.length]);

  // Constellation line opacity: grows as more stars are added
  const lineOpacity = Math.min(totalSolved / 3, 1);

  return (
    <div style={{
      minHeight: "100svh",
      background: "radial-gradient(ellipse at 40% 20%, #0a1628 0%, #020810 60%)",
      display: "flex",
      flexDirection: "column",
      paddingBottom: 80, // nav bar clearance
    }}>
      <style>{TWINKLE_CSS}</style>

      {/* Sky canvas — fills most of the screen */}
      <div style={{
        flex: 1,
        position: "relative",
        minHeight: 0,
        overflow: "hidden",
      }}>
        <svg
          width="100%"
          height="100%"
          style={{
            position: "absolute", inset: 0,
            display: "block",
          }}
          preserveAspectRatio="xMidYMid slice"
        >
          <Nebula starCount={totalSolved} />

          {/* Nebula blobs */}
          <rect width="100%" height="100%" fill="url(#neb1)"/>
          <rect width="100%" height="100%" fill="url(#neb2)"/>
          <rect width="100%" height="100%" fill="url(#neb3)"/>

          {/* Background ambient stars */}
          {BG_STARS.map((s, i) => (
            <circle
              key={i}
              cx={`${s.x * 100}%`}
              cy={`${s.y * 100}%`}
              r={s.r}
              fill="white"
              style={{
                animation: `${i % 3 === 0 ? "twinkle" : "twinkleSlow"} ${2.5 + s.delay}s ${s.delay}s ease-in-out infinite`,
              }}
            />
          ))}

          {/* Constellation lines */}
          {totalSolved >= 2 && (
            <ConstellationLines stars={stars} opacity={lineOpacity} />
          )}

          {/* Restored stars */}
          {stars.map((star, i) => (
            <Star
              key={star.puzzleId}
              star={star}
              index={i}
              isNew={newStarIds.has(star.puzzleId)}
            />
          ))}
        </svg>

        {/* Empty state overlay */}
        {totalSolved === 0 && <EmptyState />}
      </div>

      {/* Progress info */}
      <div style={{
        padding: "20px 24px 16px",
        background: "linear-gradient(to top, #020810 60%, transparent)",
      }}>
        <ProgressLabel
          totalSolved={totalSolved}
          totalPuzzles={totalPuzzles}
          pct={pct}
        />
      </div>
    </div>
  );
}
