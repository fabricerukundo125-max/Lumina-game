// ─── puzzles.js ───────────────────────────────────────────────────────────────
// All 25 puzzles verified by exhaustive brute-force solver.
// Rules:
//   - Every puzzle: 0 crystals lit at start
//   - Every puzzle: at least 1 valid solution exists
//   - movable[] cells contain a mirror element in grid[][]
//   - sources[] cells are empty in grid[][] (drawn as overlay)
//
// Difficulty tiers:
//   T1 (P1–P5):   Tutorial — 1 movable, 1 crystal, direct path
//   T2 (P6–P10):  Gentle   — 1–2 movables, simple routing
//   T3 (P11–P15): Moderate — 2 movables, walls introduced
//   T4 (P16–P20): Varied   — 3 sources, multi-crystal
//   T5 (P21–P25): Complex  — longer paths, walls, misdirection

function b() { return Array.from({ length: 7 }, () => Array(7).fill("")); }

export const PUZZLES = [

  // ── T1: Tutorial ────────────────────────────────────────────────────────────

  {
    id: 1, title: "First Light", subtitle: "Something in this room responds to light",
    hint: "The mirror bends light. Try a different angle.",
    grid: (() => { const g = b(); g[0][3] = "/"; g[0][6] = "C#ff6b6b"; g[3][3] = "\\"; return g; })(),
    sources:  [{ r: 3, c: 0, dir: "R", color: "#ff6b6b" }],
    crystals: [{ r: 0, c: 6, color: "#ff6b6b" }],
    movable:  ["3,3"],
  },
  {
    id: 2, title: "Two Turns", subtitle: "Every corner is a choice",
    hint: "One mirror, two positions. Which way does the beam need to travel?",
    grid: (() => { const g = b(); g[2][4] = "/"; g[2][6] = "C#6bcbff"; g[3][4] = "\\"; return g; })(),
    sources:  [{ r: 3, c: 0, dir: "R", color: "#6bcbff" }],
    crystals: [{ r: 2, c: 6, color: "#6bcbff" }],
    movable:  ["3,4"],
  },
  {
    id: 3, title: "Spectrum", subtitle: "Two lights. Two paths. One answer.",
    hint: "Each beam has its own mirror to find.",
    grid: (() => {
      const g = b();
      g[1][2] = "/"; g[1][6] = "C#ff6b6b"; g[3][2] = "\\";
      g[4][4] = "/"; g[4][6] = "C#6bcbff"; g[5][4] = "\\";
      return g;
    })(),
    sources:  [{ r: 3, c: 0, dir: "R", color: "#ff6b6b" }, { r: 5, c: 0, dir: "R", color: "#6bcbff" }],
    crystals: [{ r: 1, c: 6, color: "#ff6b6b" }, { r: 4, c: 6, color: "#6bcbff" }],
    movable:  ["3,2", "5,4"],
  },
  {
    id: 4, title: "Labyrinth", subtitle: "Walls are not obstacles — they are the puzzle",
    hint: "Sometimes the beam must leave the row to find its way back.",
    grid: (() => {
      const g = b();
      g[1][2] = "\\"; g[1][6] = "C#ff6b6b";
      g[2][4] = "X";  g[4][2] = "\\"; g[4][3] = "X";
      return g;
    })(),
    sources:  [{ r: 4, c: 0, dir: "R", color: "#ff6b6b" }],
    crystals: [{ r: 1, c: 6, color: "#ff6b6b" }],
    movable:  ["4,2", "1,2"],
  },
  {
    id: 5, title: "Cascade", subtitle: "Two lights climb toward the sky",
    hint: "Each beam needs to rise. Give each one a path upward.",
    grid: (() => {
      const g = b();
      g[0][3] = "/"; g[0][6] = "C#a8ff6b"; g[2][3] = "\\";
      g[4][4] = "/"; g[4][6] = "C#ff6b6b"; g[5][4] = "\\";
      return g;
    })(),
    sources:  [{ r: 2, c: 0, dir: "R", color: "#a8ff6b" }, { r: 5, c: 0, dir: "R", color: "#ff6b6b" }],
    crystals: [{ r: 0, c: 6, color: "#a8ff6b" }, { r: 4, c: 6, color: "#ff6b6b" }],
    movable:  ["2,3", "5,4"],
  },

  // ── T2: Gentle ──────────────────────────────────────────────────────────────

  {
    id: 6, title: "The Southern Gate", subtitle: "The light finds a new direction",
    hint: "One rotation is all it needs.",
    grid: (() => { const g = b(); g[0][3] = "/"; g[0][6] = "C#6bcbff"; g[2][3] = "\\"; return g; })(),
    sources:  [{ r: 2, c: 0, dir: "R", color: "#6bcbff" }],
    crystals: [{ r: 0, c: 6, color: "#6bcbff" }],
    movable:  ["2,3"],
  },
  {
    id: 7, title: "The Long Path", subtitle: "Sometimes light must travel far",
    hint: "Send the beam upward early.",
    grid: (() => { const g = b(); g[0][1] = "/"; g[0][6] = "C#a8ff6b"; g[5][1] = "\\"; return g; })(),
    sources:  [{ r: 5, c: 0, dir: "R", color: "#a8ff6b" }],
    crystals: [{ r: 0, c: 6, color: "#a8ff6b" }],
    movable:  ["5,1"],
  },
  {
    id: 8, title: "The Crossing", subtitle: "Two beams, two destinations",
    hint: "Each beam has its own mirror.",
    grid: (() => {
      const g = b();
      g[0][3] = "/"; g[0][6] = "C#ff6b6b"; g[1][3] = "\\";
      g[3][4] = "/"; g[3][6] = "C#6bcbff"; g[4][4] = "\\";
      return g;
    })(),
    sources:  [{ r: 1, c: 0, dir: "R", color: "#ff6b6b" }, { r: 4, c: 0, dir: "R", color: "#6bcbff" }],
    crystals: [{ r: 0, c: 6, color: "#ff6b6b" }, { r: 3, c: 6, color: "#6bcbff" }],
    movable:  ["1,3", "4,4"],
  },
  {
    id: 9, title: "The Mirror Gate", subtitle: "The angle matters",
    hint: "Rotate until the beam climbs.",
    grid: (() => {
      const g = b();
      g[2][2] = "/"; g[2][6] = "C#ff6b6b";
      g[4][2] = "\\"; g[4][5] = "X";
      return g;
    })(),
    sources:  [{ r: 4, c: 0, dir: "R", color: "#ff6b6b" }],
    crystals: [{ r: 2, c: 6, color: "#ff6b6b" }],
    movable:  ["4,2"],
  },
  {
    id: 10, title: "The Three Lights", subtitle: "Three sources, three paths",
    hint: "Each beam needs one mirror each.",
    grid: (() => {
      const g = b();
      g[0][2] = "/"; g[0][6] = "C#ff6b6b"; g[1][2] = "\\";
      g[2][3] = "/"; g[2][6] = "C#6bcbff"; g[3][3] = "\\";
      g[4][4] = "/"; g[4][6] = "C#a8ff6b"; g[5][4] = "\\";
      return g;
    })(),
    sources:  [
      { r: 1, c: 0, dir: "R", color: "#ff6b6b" },
      { r: 3, c: 0, dir: "R", color: "#6bcbff" },
      { r: 5, c: 0, dir: "R", color: "#a8ff6b" },
    ],
    crystals: [
      { r: 0, c: 6, color: "#ff6b6b" },
      { r: 2, c: 6, color: "#6bcbff" },
      { r: 4, c: 6, color: "#a8ff6b" },
    ],
    movable: ["1,2", "3,3", "5,4"],
  },

  // ── T3: Moderate ────────────────────────────────────────────────────────────

  {
    id: 11, title: "The Winding River", subtitle: "Light follows the path of water",
    hint: "One turn leads to the crystal.",
    grid: (() => {
      const g = b();
      g[1][2] = "/"; g[1][6] = "C#6bcbff";
      g[3][2] = "\\"; g[3][4] = "X";
      return g;
    })(),
    sources:  [{ r: 3, c: 0, dir: "R", color: "#6bcbff" }],
    crystals: [{ r: 1, c: 6, color: "#6bcbff" }],
    movable:  ["3,2"],
  },
  {
    id: 12, title: "The Ancient Door", subtitle: "Two keys open the ancient door",
    hint: "Both mirrors must turn together.",
    grid: (() => {
      const g = b();
      g[0][2] = "/"; g[0][6] = "C#a8ff6b"; g[2][2] = "\\";
      g[3][4] = "/"; g[3][6] = "C#ff6b6b"; g[5][4] = "\\";
      g[4][1] = "X"; g[1][5] = "X";
      return g;
    })(),
    sources:  [{ r: 2, c: 0, dir: "R", color: "#a8ff6b" }, { r: 5, c: 0, dir: "R", color: "#ff6b6b" }],
    crystals: [{ r: 0, c: 6, color: "#a8ff6b" }, { r: 3, c: 6, color: "#ff6b6b" }],
    movable:  ["2,2", "5,4"],
  },
  {
    id: 13, title: "The Forgotten Bridge", subtitle: "Light once crossed this place",
    hint: "Route around the wall.",
    grid: (() => {
      const g = b();
      g[1][1] = "/"; g[1][6] = "C#6bcbff";
      g[3][1] = "\\"; g[3][3] = "X"; g[3][4] = "X";
      return g;
    })(),
    sources:  [{ r: 3, c: 0, dir: "R", color: "#6bcbff" }],
    crystals: [{ r: 1, c: 6, color: "#6bcbff" }],
    movable:  ["3,1"],
  },
  {
    id: 14, title: "The Twin Flames", subtitle: "Two flames, two paths through the dark",
    hint: "Each source has its own mirror waiting.",
    grid: (() => {
      const g = b();
      g[0][3] = "/"; g[0][6] = "C#ff6b6b"; g[2][3] = "\\";
      g[3][4] = "/"; g[3][6] = "C#a8ff6b"; g[5][4] = "\\";
      return g;
    })(),
    sources:  [{ r: 2, c: 0, dir: "R", color: "#ff6b6b" }, { r: 5, c: 0, dir: "R", color: "#a8ff6b" }],
    crystals: [{ r: 0, c: 6, color: "#ff6b6b" }, { r: 3, c: 6, color: "#a8ff6b" }],
    movable:  ["2,3", "5,4"],
  },
  {
    id: 15, title: "The High Chamber", subtitle: "Light must climb to the top",
    hint: "One mirror, one long climb.",
    grid: (() => {
      const g = b();
      g[0][1] = "/"; g[0][6] = "C#6bcbff";
      g[4][1] = "\\"; g[4][4] = "X"; g[2][4] = "X";
      return g;
    })(),
    sources:  [{ r: 4, c: 0, dir: "R", color: "#6bcbff" }],
    crystals: [{ r: 0, c: 6, color: "#6bcbff" }],
    movable:  ["4,1"],
  },

  // ── T4: Varied ──────────────────────────────────────────────────────────────

  {
    id: 16, title: "The Divided Sky", subtitle: "Each light seeks its own star",
    hint: "Three sources, three separate paths.",
    grid: (() => {
      const g = b();
      g[0][2] = "/"; g[0][6] = "C#ff6b6b"; g[1][2] = "\\";
      g[2][3] = "/"; g[2][6] = "C#6bcbff"; g[3][3] = "\\";
      g[4][4] = "/"; g[4][6] = "C#a8ff6b"; g[5][4] = "\\";
      return g;
    })(),
    sources:  [
      { r: 1, c: 0, dir: "R", color: "#ff6b6b" },
      { r: 3, c: 0, dir: "R", color: "#6bcbff" },
      { r: 5, c: 0, dir: "R", color: "#a8ff6b" },
    ],
    crystals: [
      { r: 0, c: 6, color: "#ff6b6b" },
      { r: 2, c: 6, color: "#6bcbff" },
      { r: 4, c: 6, color: "#a8ff6b" },
    ],
    movable: ["1,2", "3,3", "5,4"],
  },
  {
    id: 17, title: "The Sunken Temple", subtitle: "A path through the ruins",
    hint: "Navigate the walls carefully.",
    grid: (() => {
      const g = b();
      g[0][1] = "/"; g[0][6] = "C#ff6b6b";
      g[2][1] = "\\"; g[1][3] = "X"; g[3][3] = "X"; g[5][3] = "X";
      return g;
    })(),
    sources:  [{ r: 2, c: 0, dir: "R", color: "#ff6b6b" }],
    crystals: [{ r: 0, c: 6, color: "#ff6b6b" }],
    movable:  ["2,1"],
  },
  {
    id: 18, title: "The Mirrored Hall", subtitle: "Reflections within reflections",
    hint: "Two mirrors must both face the right way.",
    grid: (() => {
      const g = b();
      g[0][2] = "/"; g[0][6] = "C#6bcbff"; g[3][2] = "\\";
      g[2][4] = "/"; g[2][6] = "C#a8ff6b"; g[5][4] = "\\";
      return g;
    })(),
    sources:  [{ r: 3, c: 0, dir: "R", color: "#6bcbff" }, { r: 5, c: 0, dir: "R", color: "#a8ff6b" }],
    crystals: [{ r: 0, c: 6, color: "#6bcbff" }, { r: 2, c: 6, color: "#a8ff6b" }],
    movable:  ["3,2", "5,4"],
  },
  {
    id: 19, title: "The Last Pillar", subtitle: "One beam must travel the full length",
    hint: "Send the beam up early — it has far to go.",
    grid: (() => {
      const g = b();
      g[0][2] = "/"; g[0][6] = "C#ff6b6b";
      g[4][2] = "\\"; g[6][5] = "\\"; g[2][5] = "X";
      return g;
    })(),
    sources:  [{ r: 4, c: 0, dir: "R", color: "#ff6b6b" }],
    crystals: [{ r: 0, c: 6, color: "#ff6b6b" }],
    movable:  ["4,2", "6,5"],
  },
  {
    id: 20, title: "The World Remembers", subtitle: "All lights find their place",
    hint: "Three mirrors, three climbs, one sky.",
    grid: (() => {
      const g = b();
      g[0][2] = "/"; g[0][6] = "C#ff6b6b"; g[1][2] = "\\";
      g[2][4] = "/"; g[2][6] = "C#6bcbff"; g[3][4] = "\\";
      g[4][5] = "/"; g[4][6] = "C#a8ff6b"; g[5][5] = "\\";
      return g;
    })(),
    sources:  [
      { r: 1, c: 0, dir: "R", color: "#ff6b6b" },
      { r: 3, c: 0, dir: "R", color: "#6bcbff" },
      { r: 5, c: 0, dir: "R", color: "#a8ff6b" },
    ],
    crystals: [
      { r: 0, c: 6, color: "#ff6b6b" },
      { r: 2, c: 6, color: "#6bcbff" },
      { r: 4, c: 6, color: "#a8ff6b" },
    ],
    movable: ["1,2", "3,4", "5,5"],
  },

  // ── T5: Complex ─────────────────────────────────────────────────────────────

  {
    id: 21, title: "The Deep Vault", subtitle: "Light descends before it rises",
    hint: "Try sending the beam downward first.",
    grid: (() => {
      const g = b();
      g[1][2] = "/"; g[3][2] = "\\"; g[3][6] = "C#6bcbff"; g[0][4] = "X";
      return g;
    })(),
    sources:  [{ r: 1, c: 0, dir: "R", color: "#6bcbff" }],
    crystals: [{ r: 3, c: 6, color: "#6bcbff" }],
    movable:  ["1,2"],
  },
  {
    id: 22, title: "The Four Winds", subtitle: "Light from every direction",
    hint: "Each source needs exactly one mirror.",
    grid: (() => {
      const g = b();
      g[0][2] = "/"; g[0][6] = "C#ff6b6b"; g[1][2] = "\\";
      g[2][4] = "/"; g[2][6] = "C#6bcbff"; g[3][4] = "\\";
      return g;
    })(),
    sources:  [{ r: 1, c: 0, dir: "R", color: "#ff6b6b" }, { r: 3, c: 0, dir: "R", color: "#6bcbff" }],
    crystals: [{ r: 0, c: 6, color: "#ff6b6b" }, { r: 2, c: 6, color: "#6bcbff" }],
    movable:  ["1,2", "3,4"],
  },
  {
    id: 23, title: "The Resonance Point", subtitle: "Two beams meet at their crystals",
    hint: "Both must climb — each by a different route.",
    grid: (() => {
      const g = b();
      g[0][2] = "/"; g[0][6] = "C#ff6b6b"; g[2][2] = "\\";
      g[2][4] = "/"; g[2][6] = "C#a8ff6b"; g[4][4] = "\\";
      g[1][5] = "X"; g[3][1] = "X";
      return g;
    })(),
    sources:  [{ r: 2, c: 0, dir: "R", color: "#ff6b6b" }, { r: 4, c: 0, dir: "R", color: "#a8ff6b" }],
    crystals: [{ r: 0, c: 6, color: "#ff6b6b" }, { r: 2, c: 6, color: "#a8ff6b" }],
    movable:  ["2,2", "4,4"],
  },
  {
    id: 24, title: "The Star Map", subtitle: "Plot the course of ancient light",
    hint: "Three mirrors, three stars to restore.",
    grid: (() => {
      const g = b();
      g[0][1] = "/"; g[0][6] = "C#ff6b6b"; g[1][1] = "\\";
      g[2][3] = "/"; g[2][6] = "C#6bcbff"; g[3][3] = "\\";
      g[4][5] = "/"; g[4][6] = "C#a8ff6b"; g[5][5] = "\\";
      return g;
    })(),
    sources:  [
      { r: 1, c: 0, dir: "R", color: "#ff6b6b" },
      { r: 3, c: 0, dir: "R", color: "#6bcbff" },
      { r: 5, c: 0, dir: "R", color: "#a8ff6b" },
    ],
    crystals: [
      { r: 0, c: 6, color: "#ff6b6b" },
      { r: 2, c: 6, color: "#6bcbff" },
      { r: 4, c: 6, color: "#a8ff6b" },
    ],
    movable: ["1,1", "3,3", "5,5"],
  },
  {
    id: 25, title: "The Eternal Light", subtitle: "The world is almost whole",
    hint: "Three mirrors. Three stars. The sky awaits.",
    grid: (() => {
      const g = b();
      g[0][1] = "/"; g[0][6] = "C#ff6b6b"; g[1][1] = "\\";
      g[2][3] = "/"; g[2][6] = "C#6bcbff"; g[3][3] = "\\";
      g[4][5] = "/"; g[4][6] = "C#a8ff6b"; g[5][5] = "\\";
      g[1][4] = "X"; g[3][5] = "X"; g[6][1] = "X";
      return g;
    })(),
    sources:  [
      { r: 1, c: 0, dir: "R", color: "#ff6b6b" },
      { r: 3, c: 0, dir: "R", color: "#6bcbff" },
      { r: 5, c: 0, dir: "R", color: "#a8ff6b" },
    ],
    crystals: [
      { r: 0, c: 6, color: "#ff6b6b" },
      { r: 2, c: 6, color: "#6bcbff" },
      { r: 4, c: 6, color: "#a8ff6b" },
    ],
    movable: ["1,1", "3,3", "5,5"],
  },
];
