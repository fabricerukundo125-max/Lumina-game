import { useState, useEffect, useRef, useMemo, useCallback } from "react";

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

function traceBeams(puzzle, rotations) {
  const segments   = [];
  const litCrystals = new Set();
  const visited    = new Set();

  function trace(r, c, dr, dc, color, depth = 0) {
    if (depth > 300) return; // infinite-loop guard
    let pr = r, pc = c;

    for (let steps = 0; steps < 200; steps++) {
      const nr = pr + dr;
      const nc = pc + dc;

      // Beam exits grid
      if (nr < 0 || nr >= GRID || nc < 0 || nc >= GRID) {
        // Draw partial segment to edge
        segments.push({ r1: pr, c1: pc, r2: pr + dr * 0.5, c2: pc + dc * 0.5, color });
        return;
      }

      const vKey = `${nr},${nc},${dr},${dc},${color}`;
      if (visited.has(vKey)) return; // loop prevention
      visited.add(vKey);

      const cell = puzzle.grid[nr][nc];
      segments.push({ r1: pr, c1: pc, r2: nr, c2: nc, color });

      if (cell === "/" || cell === "\\") {
        const rot = rotations[`${nr},${nc}`] || 0;
        const effective = getEffectiveMirror(cell, rot);
        [dr, dc] = reflect(dr, dc, effective);
        pr = nr; pc = nc;

      } else if (cell === "P") {
        // Prism: white splits into RGB, colors pass through
        if (color === "white") {
          trace(nr, nc, dr, dc, "#ff6b6b", depth + 1);
          trace(nr, nc, dr, dc, "#6bcbff", depth + 1);
          trace(nr, nc, dr, dc, "#a8ff6b", depth + 1);
          return;
        }
        pr = nr; pc = nc;

      } else if (cell && cell.startsWith("C")) {
        const needed = cell.slice(1);
        if (needed === "any" || needed === color) {
          litCrystals.add(`${nr},${nc}`);
        }
        return; // beam absorbed by crystal

      } else if (cell === "X") {
        return; // wall blocks beam

      } else {
        pr = nr; pc = nc;
      }
    }
  }

  puzzle.sources.forEach(s => {
    const [dr, dc] = DIR[s.dir];
    trace(s.r, s.c, dr, dc, s.color || "white");
  });

  return { segments, litCrystals };
}

// ─── Puzzles ──────────────────────────────────────────────────────────────────
// Design rules:
//   - sources[] cells stay empty in grid[][] (source is drawn as overlay)
//   - movable[] cells MUST contain a mirror element in grid[][]
//   - crystals start unlit; beam engine determines lit state
//   - All 5 puzzles verified by exhaustive brute-force: solvable, unsolved at start

const PUZZLES = [
  // ── Puzzle 1: First Light ───────────────────────────────────────────────────
  // Source R[3,0] → movable \[3,3] → rotate to / → UP col3 → fixed /[0,3] → RIGHT → C[0,6]
  // Verified: 0/1 lit at start. 1 unique solution (rot 1 or 3, both yield /).
  {
    id: 1,
    title: "First Light",
    subtitle: "Something in this room responds to light",
    hint: "The mirror bends light. Try a different angle.",
    grid: [
      ["", "", "", "/", "", "", "C#ff6b6b"],
      ["", "", "", "",  "", "", ""],
      ["", "", "", "",  "", "", ""],
      ["", "", "", "\\", "", "", ""],
      ["", "", "", "",  "", "", ""],
      ["", "", "", "",  "", "", ""],
      ["", "", "", "",  "", "", ""],
    ],
    sources:  [{ r:3, c:0, dir:"R", color:"#ff6b6b" }],
    crystals: [{ r:0, c:6, color:"#ff6b6b" }],
    movable:  ["3,3"],
  },

  // ── Puzzle 2: Two Turns ─────────────────────────────────────────────────────
  // Source R[3,0] → movable \[3,4] → rotate to / → UP col4 → fixed /[2,4] → RIGHT → C[2,6]
  // Verified: 0/1 lit at start. 1 unique solution.
  {
    id: 2,
    title: "Two Turns",
    subtitle: "Every corner is a choice",
    hint: "One mirror, two positions. Which way does the beam need to travel?",
    grid: [
      ["", "", "", "", "",  "", ""],
      ["", "", "", "", "",  "", ""],
      ["", "", "", "", "/", "", "C#6bcbff"],
      ["", "", "", "", "\\", "", ""],
      ["", "", "", "", "",  "", ""],
      ["", "", "", "", "",  "", ""],
      ["", "", "", "", "",  "", ""],
    ],
    sources:  [{ r:3, c:0, dir:"R", color:"#6bcbff" }],
    crystals: [{ r:2, c:6, color:"#6bcbff" }],
    movable:  ["3,4"],
  },

  // ── Puzzle 3: Spectrum ──────────────────────────────────────────────────────
  // Two sources. Red R[3,0] → movable \[3,2] → / → UP → fixed /[1,2] → RIGHT → C[1,6] red
  // Blue R[5,0] → movable \[5,4] → / → UP → fixed /[4,4] → RIGHT → C[4,6] blue
  // Verified: 0/2 lit at start. Exactly 1 solution pairing (rot1 on both movables).
  {
    id: 3,
    title: "Spectrum",
    subtitle: "Two lights. Two paths. One answer.",
    hint: "Each beam has its own mirror to find.",
    grid: [
      ["", "", "",  "", "",  "", ""],
      ["", "", "/", "", "",  "", "C#ff6b6b"],
      ["", "", "",  "", "",  "", ""],
      ["", "", "\\", "", "", "", ""],
      ["", "", "",  "", "/", "", "C#6bcbff"],
      ["", "", "",  "", "\\", "", ""],
      ["", "", "",  "", "",  "", ""],
    ],
    sources:  [
      { r:3, c:0, dir:"R", color:"#ff6b6b" },
      { r:5, c:0, dir:"R", color:"#6bcbff" },
    ],
    crystals: [
      { r:1, c:6, color:"#ff6b6b" },
      { r:4, c:6, color:"#6bcbff" },
    ],
    movable: ["3,2", "5,4"],
  },

  // ── Puzzle 4: Labyrinth ─────────────────────────────────────────────────────
  // Source R[4,0] → movable \[4,2] → / → UP col2 → movable \[1,2] → / → RIGHT → C[1,6]
  // Walls at [4,3] and [2,4] block direct paths and add maze atmosphere.
  // Verified: 0/1 lit at start. Exactly 1 solution (both movables to /).
  {
    id: 4,
    title: "Labyrinth",
    subtitle: "Walls are not obstacles — they are the puzzle",
    hint: "Sometimes the beam must leave the row to find its way back.",
    grid: [
      ["", "", "",  "",  "", "", ""],
      ["", "", "\\", "", "", "", "C#ff6b6b"],
      ["", "", "",  "",  "X", "", ""],
      ["", "", "",  "",  "", "", ""],
      ["", "", "\\", "X", "", "", ""],
      ["", "", "",  "",  "", "", ""],
      ["", "", "",  "",  "", "", ""],
    ],
    sources:  [{ r:4, c:0, dir:"R", color:"#ff6b6b" }],
    crystals: [{ r:1, c:6, color:"#ff6b6b" }],
    movable:  ["4,2", "1,2"],
  },

  // ── Puzzle 5: Cascade ───────────────────────────────────────────────────────
  // Two sources (green + red). Each routes UP via its own movable mirror.
  // Green R[2,0] → \[2,3] → / → UP → fixed /[0,3] → RIGHT → C[0,6] green
  // Red   R[5,0] → \[5,4] → / → UP → fixed /[4,4] → RIGHT → C[4,6] red
  // Verified: 0/2 lit at start. Exactly 1 solution pairing (rot1 on both).
  {
    id: 5,
    title: "Cascade",
    subtitle: "Two lights climb toward the sky",
    hint: "Each beam needs to rise. Give each one a path upward.",
    grid: [
      ["", "", "", "/",  "",  "", "C#a8ff6b"],
      ["", "", "", "",   "",  "", ""],
      ["", "", "", "\\",  "", "", ""],
      ["", "", "", "",   "",  "", ""],
      ["", "", "", "",   "/", "", "C#ff6b6b"],
      ["", "", "", "",   "\\", "", ""],
      ["", "", "", "",   "",  "", ""],
    ],
    sources:  [
      { r:2, c:0, dir:"R", color:"#a8ff6b" },
      { r:5, c:0, dir:"R", color:"#ff6b6b" },
    ],
    crystals: [
      { r:0, c:6, color:"#a8ff6b" },
      { r:4, c:6, color:"#ff6b6b" },
    ],
    movable: ["2,3", "5,4"],
  },
];

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

  const { segments, litCrystals } = useMemo(
    () => traceBeams(puzzle, rotations),
    [puzzle, rotations]
  );

  const totalCrystals = puzzle.crystals.length;
  const litCount      = litCrystals.size;

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
      // Save star immediately at win moment — don't wait for "Continue" tap
      onPuzzleSolved(puzzle.id);
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
    setRotations({}); setWon(false); setPrevLit(new Set()); setShowHint(false);
  };

  const selectPuzzle = (i) => {
    setPuzzleIdx(i); setRotations({});
    setWon(false); setPrevLit(new Set()); setShowHint(false);
  };

  // ── Intro screen ─────────────────────────────────────────────
  if (screen === "intro") return (
    <div style={{
      minHeight:"100svh",
      background:"radial-gradient(ellipse at 30% 20%,#0a1e3d,#04080f 65%)",
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", fontFamily:"'Segoe UI',sans-serif",
      padding:"40px 28px 96px", textAlign:"center",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        @keyframes floatAnim { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes glowPulse { 0%,100%{opacity:.65} 50%{opacity:1} }
        @keyframes starDrift { 0%{transform:translateY(0);opacity:.7} 100%{transform:translateY(-18px);opacity:.1} }
      `}</style>
      {/* Stars */}
      {Array.from({length:14},(_,i)=>(
        <div key={i} style={{
          position:"fixed",
          left:`${4+(i*7)}%`, top:`${8+Math.sin(i*1.3)*38}%`,
          width:2.5, height:2.5, borderRadius:"50%",
          background:["#6bcbff","#ff6b6b","#a8ff6b","#cc88ff"][i%4],
          animation:`starDrift ${2.8+i*0.35}s ${i*0.25}s ease-in-out infinite alternate`,
          opacity:.4, pointerEvents:"none",
        }}/>
      ))}
      <div style={{ fontSize:80, animation:"floatAnim 3s ease-in-out infinite", marginBottom:20 }}>✨</div>
      <h1 style={{
        fontFamily:"'Playfair Display',serif",
        fontSize:"clamp(2.8rem,10vw,4.2rem)", fontWeight:900,
        color:"#e8f4ff", margin:"0 0 10px", animation:"glowPulse 2.5s ease infinite",
      }}>Lumina</h1>
      <p style={{ color:"#6bcbff88", fontSize:"1rem", maxWidth:300, lineHeight:1.65, marginBottom:40 }}>
        Guide beams of light.<br/>Illuminate a forgotten world.
      </p>
      <div style={{ display:"flex", gap:28, marginBottom:44, justifyContent:"center" }}>
        {[["Tap mirrors","to rotate"],["Guide beams","to crystals"],["No timers","no pressure"]].map(([a,b],i)=>(
          <div key={i} style={{ textAlign:"center" }}>
            <div style={{ color:"#6bcbff", fontWeight:600, fontSize:"0.8rem", marginBottom:3 }}>{a}</div>
            <div style={{ color:"#ffffff44", fontSize:"0.75rem" }}>{b}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => setScreen("game")}
        style={{
          background:"linear-gradient(135deg,#1a4a7a,#0d2a4a)",
          color:"#6bcbff", border:"1px solid #6bcbff55",
          borderRadius:14, padding:"15px 44px",
          fontSize:"1.05rem", fontWeight:700, cursor:"pointer",
          letterSpacing:"0.07em", boxShadow:"0 0 28px #6bcbff2a",
        }}>
        Begin →
      </button>
    </div>
  );

  // ── Game screen ───────────────────────────────────────────────
  return (
    <div style={{
      minHeight:"100svh",
      background:"radial-gradient(ellipse at 20% 8%,#0a1e3d,#03070d 55%)",
      display:"flex", flexDirection:"column", alignItems:"center",
      fontFamily:"'Segoe UI',sans-serif", padding:"16px 16px 96px",
      userSelect:"none", touchAction:"manipulation",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
        @keyframes crystalPulse { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.5)} }
        @keyframes gridGlow { 0%,100%{box-shadow:0 0 40px #0a1e3d88} 50%{box-shadow:0 0 55px #0a1e3daa} }
        @keyframes starRise {
          0%   { transform: translateY(0) scale(0.4); opacity: 0; }
          15%  { opacity: 1; }
          80%  { opacity: 0.9; }
          100% { transform: translateY(-220px) scale(1.1); opacity: 0; }
        }
        @keyframes toastSlideUp {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes continueFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes beamBrighten {
          0%,100% { filter: brightness(1); }
          50%     { filter: brightness(1.7) drop-shadow(0 0 6px #6bcbff); }
        }
        @keyframes crystalWin {
          0%,100% { filter: brightness(1.2) drop-shadow(0 0 6px currentColor); }
          50%     { filter: brightness(2.4) drop-shadow(0 0 18px currentColor); }
        }
        .tap-cell { -webkit-tap-highlight-color: transparent; }
        .tap-cell:active { transform: scale(0.93) !important; }
      `}</style>

      {/* Header */}
      <div style={{
        width:"100%", maxWidth:500,
        display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:14,
      }}>
        <h1 style={{
          fontFamily:"'Playfair Display',serif",
          fontSize:"1.45rem", fontWeight:900, color:"#e8f4ff", margin:0,
        }}>✨ Lumina</h1>
        <div style={{ display:"flex", gap:6 }}>
          {PUZZLES.map((_,i)=>(
            <button key={i} onClick={()=>selectPuzzle(i)}
              style={{
                width:36, height:36, borderRadius:8,
                background: i===puzzleIdx ? "#1a4a7a"
                  : completed.has(i) ? "#0d2e1a" : "#0d1724",
                border:`1.5px solid ${i===puzzleIdx ? "#6bcbff"
                  : completed.has(i) ? "#a8ff6b55" : "#ffffff12"}`,
                color: i===puzzleIdx ? "#6bcbff"
                  : completed.has(i) ? "#a8ff6b" : "#ffffff33",
                fontSize:"0.72rem", fontWeight:700, cursor:"pointer",
                transition:"all .2s", touchAction:"manipulation",
                WebkitTapHighlightColor:"transparent",
              }}>
              {completed.has(i) ? "✓" : i+1}
            </button>
          ))}
        </div>
      </div>

      {/* Puzzle title */}
      <div style={{ textAlign:"center", marginBottom:12, width:"100%", maxWidth:500 }}>
        <div style={{
          fontFamily:"'Playfair Display',serif",
          fontSize:"1.1rem", fontWeight:700, color:"#ddeeff", marginBottom:3,
        }}>{puzzle.title}</div>
        <div style={{ color:"#6bcbff55", fontSize:"0.8rem" }}>{puzzle.subtitle}</div>
      </div>

      {/* Crystal progress */}
      <div style={{ width:"100%", maxWidth:500, marginBottom:12 }}>
        <div style={{
          height:3, background:"#0d1a2e", borderRadius:2, overflow:"hidden",
        }}>
          <div style={{
            height:"100%", borderRadius:2,
            background: litCount===totalCrystals
              ? "linear-gradient(90deg,#a8ff6b,#6bcbff)"
              : "linear-gradient(90deg,#1a4a7a,#4488cc)",
            width:`${(litCount/totalCrystals)*100}%`,
            transition:"width 0.4s ease",
            boxShadow: litCount===totalCrystals ? "0 0 6px #a8ff6b" : "none",
          }}/>
        </div>
      </div>

      {/* Grid */}
      <div style={{
        position:"relative", width:size, height:size,
        borderRadius:14, overflow:"hidden",
        border:"1px solid #ffffff0c",
        boxShadow:"0 0 50px #020810, inset 0 0 30px #000000bb",
        background:"radial-gradient(ellipse at 50% 50%,#091526,#020810)",
        animation:"gridGlow 4s ease infinite",
      }}>
        {/* Grid lines */}
        <svg style={{ position:"absolute", inset:0, opacity:0.055, pointerEvents:"none" }}
          width={size} height={size}>
          {Array.from({length:GRID+1},(_,i)=>(
            <g key={i}>
              <line x1={i*cell} y1={0} x2={i*cell} y2={size} stroke="#6bcbff" strokeWidth="0.5"/>
              <line x1={0} y1={i*cell} x2={size} y2={i*cell} stroke="#6bcbff" strokeWidth="0.5"/>
            </g>
          ))}
        </svg>

        {/* Beams */}
        <BeamCanvas segments={segments} cell={cell}/>

        {/* Source overlays */}
        {puzzle.sources.map((s,i) => (
          <div key={i} style={{
            position:"absolute", left:s.c*cell, top:s.r*cell,
            width:cell, height:cell,
            display:"flex", alignItems:"center", justifyContent:"center",
            pointerEvents:"none",
          }}>
            <SourceShape color={s.color} dir={s.dir} cell={cell}/>
          </div>
        ))}

        {/* Cell elements */}
        {puzzle.grid.map((row,r) => row.map((cv,c) => {
          if (!cv) return null;
          const key   = `${r},${c}`;
          const isMovable = puzzle.movable.includes(key);
          const rot   = rotations[key] || 0;
          const isCrystalLit = litCrystals.has(key);
          const isMirror = cv==="/" || cv==="\\";
          const isCrystal = cv.startsWith("C");

          return (
            <div key={key}
              className={isMovable ? "tap-cell" : ""}
              onClick={() => isMovable && handleCellTap(r,c)}
              style={{
                position:"absolute", left:c*cell, top:r*cell,
                width:cell, height:cell,
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor: isMovable ? "pointer" : "default",
                transition:"transform .1s",
              }}>
              {isMirror && (
                <div style={{ position:"relative" }}>
                  <MirrorShape type={cv} rotation={rot} cell={cell}/>
                  {isMovable && (
                    <div style={{
                      position:"absolute", bottom:-5, right:-5,
                      width:12, height:12, borderRadius:"50%",
                      background:"#6bcbff1a", border:"1px solid #6bcbff33",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:7, color:"#6bcbff66", pointerEvents:"none",
                    }}>↻</div>
                  )}
                </div>
              )}
              {cv==="P" && <PrismShape cell={cell}/>}
              {cv==="X" && <WallShape cell={cell}/>}
              {isCrystal && (
                <div style={{
                  animation: won && isCrystalLit
                    ? "crystalWin 1.2s ease infinite"
                    : isCrystalLit
                      ? "crystalPulse 2s ease infinite"
                      : "none",
                  transition: "filter .4s ease",
                }}>
                  <CrystalShape color={cv.slice(1)} lit={isCrystalLit} cell={cell}/>
                  {/* Rising star emerges from each lit crystal on win */}
                  {won && isCrystalLit && (
                    <RisingStar
                      color={cv.slice(1) === "any" ? "#6bcbff" : cv.slice(1)}
                      originX={cell * 0.5 - 14}
                      originY={-cell * 0.5}
                    />
                  )}
                </div>
              )}
            </div>
          );
        }))}

        {/* Beam brightens on win */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none", zIndex:5,
          animation: won ? "beamBrighten 1.5s ease infinite" : "none",
        }}/>
      </div>

      {/* Controls — hidden while win toast is showing */}
      {!won && (
        <div style={{ display:"flex", gap:10, marginTop:16 }}>
          <button onClick={reset} style={{
            background:"#0c1828", color:"#6677aa",
            border:"1px solid #ffffff0e", borderRadius:10,
            padding:"11px 22px", fontSize:"0.83rem", fontWeight:600, cursor:"pointer",
            touchAction:"manipulation", WebkitTapHighlightColor:"transparent",
            minHeight:44,
          }}>↺ Reset</button>
          <button onClick={() => setShowHint(h => !h)} style={{
            background: showHint ? "#0d2010" : "#0c1828",
            color: showHint ? "#a8ff6b" : "#6677aa",
            border:`1px solid ${showHint ? "#a8ff6b33" : "#ffffff0e"}`,
            borderRadius:10, padding:"11px 22px",
            fontSize:"0.83rem", fontWeight:600, cursor:"pointer",
            touchAction:"manipulation", WebkitTapHighlightColor:"transparent",
            minHeight:44, transition:"all .2s",
          }}>💡 Hint</button>
        </div>
      )}

      {/* Hint text */}
      {showHint && !won && (
        <div style={{
          marginTop:12, maxWidth:320, width:"100%",
          background:"#071a0a", border:"1px solid #a8ff6b1a",
          borderRadius:10, padding:"11px 16px",
          color:"#a8ff6b88", fontSize:"0.82rem",
          lineHeight:1.6, textAlign:"center",
        }}>
          {puzzle.hint}
        </div>
      )}

      {/* Win toast — slides up below grid, never blocks puzzle */}
      {won && (
        <WinToast
          onNext={goNext}
          isLast={puzzleIdx === PUZZLES.length - 1}
        />
      )}

      {/* Legend — hidden while won to keep UI clean */}
      {!won && (
        <div style={{
          marginTop:18, display:"flex", gap:16,
          flexWrap:"wrap", justifyContent:"center",
        }}>
          {[
            { sym:"▬", label:"Mirror — tap to rotate", color:"#a0c4ff" },
            { sym:"△", label:"Prism — splits light", color:"#cc88ff" },
            { sym:"⬡", label:"Crystal — needs light", color:"#6bcbff" },
          ].map(l=>(
            <div key={l.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ color:l.color, fontSize:13 }}>{l.sym}</span>
              <span style={{ color:"#ffffff2a", fontSize:"0.75rem" }}>{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
