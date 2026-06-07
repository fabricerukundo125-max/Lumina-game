import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { PUZZLES } from "../data/puzzles";

// ─── Constants ───────────────────────────────────────────────────────────────
const GRID = 7;
const DIR = { R: [0,1], L: [0,-1], U: [-1,0], D: [1,0] };

// ─── Beam Engine ─────────────────────────────────────────────────────────────
function reflect(dr, dc, mirror) {
  if (mirror === "/")  return [-dc, -dr];
  if (mirror === "\\") return [dc,   dr];
  return [dr, dc];
}

function getEffectiveMirror(base, rot) {
  // Even rotations keep same type, odd rotations flip / <-> \
  return rot % 2 === 0 ? base : (base === "/" ? "\\" : "/");
}

function traceBeams(puzzle, rotations, sequenceLit = []) {
  const segments    = [];
  const litCrystals = new Set();
  const visited     = new Set();
  // Color mixing: track which colors pass through each cell
  const cellColors  = {};   // key -> Set of colors

  function addCellColor(r, c, color) {
    const k = `${r},${c}`;
    if (!cellColors[k]) cellColors[k] = new Set();
    cellColors[k].add(color);
  }

  function mixColor(colors) {
    const has = c => colors.has(c);
    if (has("#ff6b6b") && has("#6bcbff") && has("#a8ff6b")) return "white";
    if (has("#ff6b6b") && has("#6bcbff"))  return "#cc44cc"; // magenta
    if (has("#ff6b6b") && has("#a8ff6b"))  return "#cccc00"; // yellow
    if (has("#6bcbff") && has("#a8ff6b"))  return "#00cccc"; // cyan
    return [...colors][0]; // single color — no mix
  }

  function trace(r, c, dr, dc, color, depth = 0) {
    if (depth > 300) return;
    let pr = r, pc = c;

    for (let steps = 0; steps < 200; steps++) {
      const nr = pr + dr;
      const nc = pc + dc;

      if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) {
        segments.push({ r1: pr, c1: pc, r2: pr + dr * 0.5, c2: pc + dc * 0.5, color });
        return;
      }

      const vKey = `${nr},${nc},${dr},${dc},${color}`;
      if (visited.has(vKey)) return;
      visited.add(vKey);

      const cell = puzzle.grid[nr][nc];
      segments.push({ r1: pr, c1: pc, r2: nr, c2: nc, color });
      addCellColor(nr, nc, color);

      if (cell === "/" || cell === "\\") {
        const rot = rotations[`${nr},${nc}`] || 0;
        const effective = getEffectiveMirror(cell, rot);
        [dr, dc] = reflect(dr, dc, effective);
        pr = nr; pc = nc;

      } else if (cell === "P") {
        if (color === "white") {
          trace(nr, nc, dr, dc, "#ff6b6b", depth + 1);
          trace(nr, nc, dr, dc, "#6bcbff", depth + 1);
          trace(nr, nc, dr, dc, "#a8ff6b", depth + 1);
          return;
        }
        pr = nr; pc = nc;

      } else if (cell && cell.startsWith("C")) {
        const needed = cell.slice(1);
        // Sequence mode: crystal only lights if its predecessors are lit
        if (puzzle.sequence) {
          const idx = puzzle.sequence.indexOf(`${nr},${nc}`);
          if (idx === 0 || (idx > 0 && sequenceLit.includes(puzzle.sequence[idx - 1]))) {
            if (needed === "any" || needed === color) litCrystals.add(`${nr},${nc}`);
          }
          pr = nr; pc = nc; // pass through — beam continues past crystal
        } else {
          if (needed === "any" || needed === color) litCrystals.add(`${nr},${nc}`);
          return; // standard mode — beam absorbed
        }

      } else if (cell && cell.startsWith("M")) {
        // Mix crystal: needs a specific mixed color
        // Will be resolved after all beams traced (see below)
        pr = nr; pc = nc; // beams pass through mix points

      } else if (cell === "X") {
        return;

      } else {
        pr = nr; pc = nc;
      }
    }
  }

  puzzle.sources.forEach(s => {
    const [dr, dc] = DIR[s.dir];
    trace(s.r, s.c, dr, dc, s.color || "white");
  });

  // Resolve mix crystals after all beams traced
  puzzle.grid.forEach((row, r) => row.forEach((cell, c) => {
    if (cell && cell.startsWith("M")) {
      const needed = cell.slice(1);
      const colors = cellColors[`${r},${c}`];
      if (colors && colors.size >= 2) {
        const mixed = mixColor(colors);
        if (mixed === needed || needed === "any") litCrystals.add(`${r},${c}`);
      }
    }
  }));

  return { segments, litCrystals };
}

// ─── Audio Engine ────────────────────────────────────────────────────────────
// Web Audio API: crystal tones + ambient hum. No external files needed.
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

const CRYSTAL_NOTES = {
  "#ff6b6b": 523.25,  // C5
  "#6bcbff": 659.25,  // E5
  "#a8ff6b": 783.99,  // G5
  "white":   880.00,  // A5
  "any":     698.46,  // F5
};

function playCrystalTone(color) {
  try {
    const ctx = getAudio();
    const freq = CRYSTAL_NOTES[color] || 523.25;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const reverb = ctx.createConvolver ? null : null; // skip reverb for simplicity

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Soft attack, long decay (bell-like)
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2.5);
  } catch(e) { /* audio blocked — silent fail */ }
}

function playMirrorClick() {
  try {
    const ctx = getAudio();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch(e) {}
}

function playWinChord(crystalColors) {
  try {
    const ctx = getAudio();
    crystalColors.forEach((color, i) => {
      const freq = CRYSTAL_NOTES[color] || 523.25;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      const delay = i * 0.18;
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 3.5);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 3.5);
    });
  } catch(e) {}
}

// ─── Responsive cell size ─────────────────────────────────────────────────────
// Vertical budget: header 56 + title 52 + progress 20 + controls 60 + legend 48 + padding 48 ≈ 284px
function getCellSize() {
  const vw     = window.innerWidth;
  const vh     = window.innerHeight;
  const byW    = Math.floor((Math.min(vw, 520) - 32) / GRID);  // fit width
  const byH    = Math.floor((vh - 284) / GRID);                 // fit height
  return Math.min(Math.max(Math.min(byW, byH), 42), 76);        // clamp 42–76px
}

// ─── Beam colors ─────────────────────────────────────────────────────────────
const BEAM_STYLE = {
  "white":   { glow: "#c8e8ff", core: "#ffffff" },
  "#ff6b6b": { glow: "#ff2222", core: "#ffaaaa" },
  "#6bcbff": { glow: "#0088ff", core: "#aaddff" },
  "#a8ff6b": { glow: "#33cc00", core: "#ccffaa" },
};
function beamStyle(c) { return BEAM_STYLE[c] || BEAM_STYLE["white"]; }

// ─── Beam Canvas ─────────────────────────────────────────────────────────────
function BeamCanvas({ segments, cell }) {
  const size = GRID * cell;
  const ref  = useRef();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size, size);

    segments.forEach(({ r1, c1, r2, c2, color }) => {
      const bs = beamStyle(color);
      const x1 = c1 * cell + cell / 2;
      const y1 = r1 * cell + cell / 2;
      const x2 = c2 * cell + cell / 2;
      const y2 = r2 * cell + cell / 2;

      // Wide outer glow
      ctx.save();
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
      ctx.strokeStyle = bs.glow;
      ctx.lineWidth = cell * 0.18;
      ctx.globalAlpha = 0.12;
      ctx.shadowBlur = 16; ctx.shadowColor = bs.glow;
      ctx.stroke();
      // Mid
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
      ctx.strokeStyle = bs.core;
      ctx.lineWidth = cell * 0.07;
      ctx.globalAlpha = 0.55;
      ctx.shadowBlur = 8;
      ctx.stroke();
      // Core
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = cell * 0.025;
      ctx.globalAlpha = 0.92;
      ctx.shadowBlur = 3;
      ctx.stroke();
      ctx.restore();
    });
  }, [segments, size, cell]);

  return (
    <canvas
      ref={ref} width={size} height={size}
      style={{ position:"absolute", top:0, left:0, pointerEvents:"none" }}
    />
  );
}

// ─── Shapes ───────────────────────────────────────────────────────────────────
function MirrorShape({ type, rotation, cell }) {
  const angle = (type === "/" ? -45 : 45) + rotation * 90;
  const s = cell * 0.55;
  return (
    <svg width={s} height={s} viewBox="0 0 44 44"
      style={{ transform:`rotate(${angle}deg)`, transition:"transform 0.3s cubic-bezier(.34,1.56,.64,1)", display:"block" }}>
      <defs>
        <linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#a0c4ff" stopOpacity="0.2"/>
          <stop offset="50%"  stopColor="#ffffff" stopOpacity="0.95"/>
          <stop offset="100%" stopColor="#a0c4ff" stopOpacity="0.2"/>
        </linearGradient>
      </defs>
      <rect x="5" y="19" width="34" height="5" rx="2.5" fill="url(#mg)"/>
      <rect x="9" y="20.5" width="26" height="2" rx="1" fill="white" opacity="0.4"/>
    </svg>
  );
}

function CrystalShape({ color, lit, cell }) {
  const c = color === "any" ? "#ccddff" : color;
  const s = cell * 0.46;
  const id = `cg${c.replace("#","")}`;
  return (
    <svg width={s} height={s} viewBox="0 0 36 36" style={{ display:"block", overflow:"visible" }}>
      <defs>
        <radialGradient id={id} cx="50%" cy="35%">
          <stop offset="0%"   stopColor={c} stopOpacity={lit ? 1   : 0.25}/>
          <stop offset="100%" stopColor={c} stopOpacity={lit ? 0.5 : 0.04}/>
        </radialGradient>
      </defs>
      <polygon
        points="18,1 29,9 29,27 18,35 7,27 7,9"
        fill={`url(#${id})`}
        stroke={lit ? c : "#ffffff22"}
        strokeWidth={lit ? 1.5 : 0.7}
        style={{ transition:"all 0.5s ease", filter: lit ? `drop-shadow(0 0 ${s*0.3}px ${c})` : "none" }}
      />
      {lit && (
        <polygon points="18,7 24,12 24,24 18,29 12,24 12,12"
          fill="white" opacity="0.25"/>
      )}
    </svg>
  );
}

function PrismShape({ cell }) {
  const s = cell * 0.5;
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" style={{ display:"block" }}>
      <defs>
        <linearGradient id="prismG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#ff6b6b" stopOpacity="0.85"/>
          <stop offset="33%"  stopColor="#a8ff6b" stopOpacity="0.85"/>
          <stop offset="66%"  stopColor="#6bcbff" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#cc88ff" stopOpacity="0.85"/>
        </linearGradient>
      </defs>
      <polygon points="20,3 37,33 3,33" fill="url(#prismG)" stroke="#ffffff33" strokeWidth="1"/>
      <polygon points="20,9 31,29 9,29"  fill="white" opacity="0.12"/>
    </svg>
  );
}

function SourceShape({ color, dir, cell }) {
  const angle = { R:0, L:180, D:90, U:-90 }[dir] || 0;
  const c = color === "white" ? "#ddeeff" : color;
  const s = cell * 0.5;
  return (
    <svg width={s} height={s} viewBox="0 0 40 40"
      style={{ transform:`rotate(${angle}deg)`, display:"block" }}>
      <defs>
        <radialGradient id={`sg${c.replace("#","")}`}>
          <stop offset="0%"   stopColor={c} stopOpacity="1"/>
          <stop offset="100%" stopColor={c} stopOpacity="0.25"/>
        </radialGradient>
      </defs>
      <circle cx="15" cy="20" r="10" fill={`url(#sg${c.replace("#","")})`}/>
      <polygon points="25,20 37,13 37,27" fill={c} opacity="0.9"/>
    </svg>
  );
}

function WallShape({ cell: sz }) {
  const s = sz - 12;
  return (
    <div style={{
      width:s, height:s,
      background:"linear-gradient(135deg,#1c1c2e,#0d0d1a)",
      border:"1px solid #ffffff10",
      borderRadius:6,
    }}/>
  );
}

// ─── Win Toast (non-blocking) ─────────────────────────────────────────────────

// Floating star that rises from the solved crystal position
function RisingStar({ color, originX, originY }) {
  return (
    <div style={{
      position: "absolute",
      left: originX,
      top:  originY,
      pointerEvents: "none",
      zIndex: 60,
      animation: "starRise 1.8s cubic-bezier(.2,.8,.4,1) forwards",
    }}>
      <svg width={28} height={28} viewBox="0 0 28 28">
        <defs>
          <radialGradient id="rsg">
            <stop offset="0%"   stopColor="white"  stopOpacity="1"/>
            <stop offset="40%"  stopColor={color}  stopOpacity="0.9"/>
            <stop offset="100%" stopColor={color}  stopOpacity="0"/>
          </radialGradient>
        </defs>
        {/* Glow */}
        <circle cx="14" cy="14" r="12" fill={color} opacity="0.18"/>
        {/* Star body */}
        <circle cx="14" cy="14" r="4.5" fill="url(#rsg)"/>
        {/* Cross sparkle */}
        <line x1="14" y1="5"  x2="14" y2="23" stroke={color} strokeWidth="1" opacity="0.5"/>
        <line x1="5"  y1="14" x2="23" y2="14" stroke={color} strokeWidth="1" opacity="0.5"/>
        <line x1="8"  y1="8"  x2="20" y2="20" stroke={color} strokeWidth="0.6" opacity="0.3"/>
        <line x1="20" y1="8"  x2="8"  y2="20" stroke={color} strokeWidth="0.6" opacity="0.3"/>
      </svg>
    </div>
  );
}

// Small toast bar below the grid — never blocks puzzle view
function WinToast({ onNext, isLast }) {
  return (
    <div style={{
      animation: "toastSlideUp 0.4s cubic-bezier(.34,1.4,.64,1) forwards",
      marginTop: 14,
      width: "100%",
      maxWidth: 500,
      background: "linear-gradient(135deg, #0a1e3a, #061224)",
      border: "1px solid #6bcbff22",
      borderRadius: 14,
      padding: "14px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      boxShadow: "0 0 24px #6bcbff18",
    }}>
      <div>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "#e2e8f0",
          marginBottom: 2,
        }}>
          ✨ Star Restored
        </div>
        <div style={{
          fontSize: "0.78rem",
          color: "#6bcbff66",
          fontStyle: "italic",
        }}>
          {isLast ? "All light returned." : "The world remembers."}
        </div>
      </div>
      <button
        onClick={onNext}
        style={{
          animation: "continueFadeIn 0.5s 2s ease both", // appears after 2s delay
          background: "linear-gradient(135deg,#1a4a7a,#0d2a4a)",
          color: "#6bcbff",
          border: "1px solid #6bcbff44",
          borderRadius: 10,
          padding: "10px 18px",
          fontSize: "0.85rem",
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
          letterSpacing: "0.04em",
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
          minHeight: 44,
          opacity: 0, // starts invisible, continueFadeIn brings it in
        }}>
        {isLast ? "Again →" : "Continue →"}
      </button>
    </div>
  );
}

// ─── Main Game ────────────────────────────────────────────────────────────────
export default function PuzzleScreen({ solvedPuzzleIds = new Set(), onPuzzleSolved = () => {} }) {
  const [cell, setCell]     = useState(getCellSize);
  const [screen, setScreen] = useState("intro"); // "intro" | "game"
  const [puzzleIdx, setPuzzleIdx]   = useState(0);
  const [rotations, setRotations]   = useState({});
  const [won, setWon]               = useState(false);
  // Use prop for persistent completions; local session set for immediate UI feedback
  // They are unioned so a puzzle marked completed this session shows ✓ immediately.
  const [sessionCompleted, setSessionCompleted] = useState(() => new Set());
  const completed = new Set([...solvedPuzzleIds, ...sessionCompleted]);
  const [prevLit, setPrevLit]       = useState(new Set());

  // Responsive resize
  useEffect(() => {
    const onResize = () => setCell(getCellSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const puzzle = PUZZLES[puzzleIdx];
  const size   = GRID * cell;

  const [sequenceLit, setSequenceLit] = useState([]);
  const [sceneActive, setSceneActive] = useState(false);

  const { segments, litCrystals } = useMemo(
    () => traceBeams(puzzle, rotations, sequenceLit),
    [puzzle, rotations, sequenceLit]
  );

  const totalCrystals = puzzle.crystals.length;
  const litCount      = litCrystals.size;

  // Update sequence tracking when crystals light up
  useEffect(() => {
    if (!puzzle.sequence) return;
    const newlyLit = [...litCrystals].filter(k => !prevLit.has(k));
    if (newlyLit.length > 0) {
      setSequenceLit(prev => {
        const next = [...prev];
        newlyLit.forEach(k => { if (!next.includes(k)) next.push(k); });
        return next;
      });
    }
    // If a crystal went dark (rotation changed), reset sequence
    const wentDark = [...prevLit].filter(k => !litCrystals.has(k));
    if (wentDark.length > 0) setSequenceLit([]);
  }, [litCrystals, puzzle.sequence]);

  // Play tone when a new crystal lights up
  useEffect(() => {
    litCrystals.forEach(key => {
      if (!prevLit.has(key)) {
        const [r,c] = key.split(",").map(Number);
        const cell_val = puzzle.grid[r][c];
        const color = cell_val?.startsWith("C") ? cell_val.slice(1) : "any";
        playCrystalTone(color);
      }
    });
    setPrevLit(new Set(litCrystals));
  }, [litCrystals]);

  // Trigger win
  useEffect(() => {
    if (litCount === totalCrystals && totalCrystals > 0 && !won) {
      const colors = puzzle.crystals.map(c => c.color);
      onPuzzleSolved(puzzle.id);
      if (puzzle.sceneAfter) setSceneActive(true);
      setTimeout(() => { playWinChord(colors); setWon(true); }, 250);
    }
  }, [litCount, totalCrystals, won]);

  const handleCellTap = useCallback((r, c) => {
    const key = `${r},${c}`;
    if (!puzzle.movable.includes(key)) return;
    playMirrorClick();
    setRotations(prev => ({ ...prev, [key]: ((prev[key] || 0) + 1) % 4 }));
  }, [puzzle.movable]);

  const [showHint, setShowHint] = useState(false);

  const goNext = () => {
    // Pin id FIRST before any state changes — prevents stale closure
    const solvedId = puzzle.id;
    onPuzzleSolved(solvedId);
    setSessionCompleted(prev => new Set([...prev, puzzleIdx]));
    setWon(false); setRotations({});
    setPrevLit(new Set()); setShowHint(false);
    setPuzzleIdx(i => i < PUZZLES.length - 1 ? i + 1 : 0);
  };

  const reset = () => {
    setRotations({}); setWon(false); setPrevLit(new Set());
    setShowHint(false); setSequenceLit([]); setSceneActive(false);
  };

  const selectPuzzle = (i) => {
    setPuzzleIdx(i); setRotations({});
    setWon(false); setPrevLit(new Set());
    setShowHint(false); setSequenceLit([]); setSceneActive(false);
  };

  // ── Intro screen ─────────────────────────────────────────────
  if (screen === "intro") return (
    <div style={{
      minHeight:"100svh",
      backgr
