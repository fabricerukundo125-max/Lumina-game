import { useMemo } from "react";

// ─── Beauty Stages ────────────────────────────────────────────────────────────
// Each stage defines the visual world state at a given puzzle threshold.
// Values are interpolated between stages for smooth transitions.
//
// Rule: add new stages here only — never touch SkyScreen or PuzzleScreen
// to change visual behavior. All visual logic lives here.

const STAGES = [
  {
    solved: 0,
    name: "Void",
    // Sky background
    skyFrom:      "#020810",
    skyTo:        "#03050a",
    nebulaOpacity: 0,
    nebulaColor:  "#0a1628",
    // Ambient particles
    particles:    0,
    particleColor:"#4fc3f7",
    // Star field density multiplier
    bgStarOpacity: 0.12,
    // Constellation lines
    lineOpacity:   0,
    // Horizon glow (restoration preview)
    horizonOpacity:0,
    horizonColor: "#0a1628",
    // Message shown on sky screen
    worldMessage: "The sky holds its breath.",
  },
  {
    solved: 1,
    name: "Spark",
    skyFrom:      "#030c1a",
    skyTo:        "#020810",
    nebulaOpacity: 0.15,
    nebulaColor:  "#0a1e3d",
    particles:    0,
    particleColor:"#4fc3f7",
    bgStarOpacity: 0.18,
    lineOpacity:   0,
    horizonOpacity:0.05,
    horizonColor: "#0a1e3d",
    worldMessage: "A single light returns.",
  },
  {
    solved: 2,
    name: "Dawn",
    skyFrom:      "#040f22",
    skyTo:        "#020a14",
    nebulaOpacity: 0.28,
    nebulaColor:  "#0d2040",
    particles:    3,
    particleColor:"#4fc3f7",
    bgStarOpacity: 0.22,
    lineOpacity:   0.2,
    horizonOpacity:0.12,
    horizonColor: "#0d1e3a",
    worldMessage: "The world begins to remember.",
  },
  {
    solved: 3,
    name: "Memory",
    skyFrom:      "#05122a",
    skyTo:        "#030a18",
    nebulaOpacity: 0.38,
    nebulaColor:  "#102448",
    particles:    6,
    particleColor:"#6bcbff",
    bgStarOpacity: 0.26,
    lineOpacity:   0.35,
    horizonOpacity:0.22,
    horizonColor: "#102040",
    worldMessage: "Stars are finding each other.",
  },
  {
    solved: 5,
    name: "Constellation",
    skyFrom:      "#071628",
    skyTo:        "#040c1c",
    nebulaOpacity: 0.5,
    nebulaColor:  "#142a50",
    particles:    12,
    particleColor:"#6bcbff",
    bgStarOpacity: 0.3,
    lineOpacity:   0.55,
    horizonOpacity:0.35,
    horizonColor: "#142448",
    worldMessage: "The constellation awakens.",
  },
  {
    solved: 10,
    name: "Living",
    skyFrom:      "#0a1e3a",
    skyTo:        "#060f22",
    nebulaOpacity: 0.65,
    nebulaColor:  "#1a3060",
    particles:    22,
    particleColor:"#a8c8ff",
    bgStarOpacity: 0.35,
    lineOpacity:   0.7,
    horizonOpacity:0.55,
    horizonColor: "#1a2e58",
    worldMessage: "The world breathes again.",
  },
  {
    solved: 20,
    name: "Radiant",
    skyFrom:      "#0e2444",
    skyTo:        "#08142e",
    nebulaOpacity: 0.8,
    nebulaColor:  "#1e3870",
    particles:    36,
    particleColor:"#c8e0ff",
    bgStarOpacity: 0.42,
    lineOpacity:   0.85,
    horizonOpacity:0.7,
    horizonColor: "#203468",
    worldMessage: "Light remembers light.",
  },
  {
    solved: 50,
    name: "Complete",
    skyFrom:      "#142850",
    skyTo:        "#0c1c3c",
    nebulaOpacity: 1,
    nebulaColor:  "#243e80",
    particles:    50,
    particleColor:"#e8f4ff",
    bgStarOpacity: 0.5,
    lineOpacity:   1,
    horizonOpacity:0.9,
    horizonColor: "#243c78",
    worldMessage: "The world is whole.",
  },
];

// ─── Linear interpolation helper ─────────────────────────────────────────────
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Interpolate hex colors by parsing to RGB and lerping each channel
function lerpColor(hexA, hexB, t) {
  const parse = h => [
    parseInt(h.slice(1,3),16),
    parseInt(h.slice(3,5),16),
    parseInt(h.slice(5,7),16),
  ];
  const toHex = n => Math.round(n).toString(16).padStart(2,"0");
  const [ar,ag,ab] = parse(hexA);
  const [br,bg,bb] = parse(hexB);
  return `#${toHex(lerp(ar,br,t))}${toHex(lerp(ag,bg,t))}${toHex(lerp(ab,bb,t))}`;
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useBeautyEngine(solvedCount = 0) {
  return useMemo(() => {
    // Find the two stages we're between
    const lower = [...STAGES].reverse().find(s => solvedCount >= s.solved) || STAGES[0];
    const upperIdx = STAGES.indexOf(lower) + 1;
    const upper = STAGES[upperIdx] || lower;

    // How far between the two stages (0–1)
    const t = lower === upper ? 1
      : Math.min((solvedCount - lower.solved) / (upper.solved - lower.solved), 1);

    // Interpolate all numeric values
    const lerped = {
      name:          lower.name,
      worldMessage:  lower.worldMessage,

      skyFrom:       lerpColor(lower.skyFrom,       upper.skyFrom,       t),
      skyTo:         lerpColor(lower.skyTo,         upper.skyTo,         t),
      nebulaColor:   lerpColor(lower.nebulaColor,   upper.nebulaColor,   t),
      particleColor: lerpColor(lower.particleColor, upper.particleColor, t),
      horizonColor:  lerpColor(lower.horizonColor,  upper.horizonColor,  t),

      nebulaOpacity:  lerp(lower.nebulaOpacity,  upper.nebulaOpacity,  t),
      particles:      Math.round(lerp(lower.particles, upper.particles, t)),
      bgStarOpacity:  lerp(lower.bgStarOpacity,  upper.bgStarOpacity,  t),
      lineOpacity:    lerp(lower.lineOpacity,    upper.lineOpacity,    t),
      horizonOpacity: lerp(lower.horizonOpacity, upper.horizonOpacity, t),
    };

    // Derived values used by components
    lerped.skyGradient = `radial-gradient(ellipse at 40% 20%, ${lerped.skyFrom} 0%, ${lerped.skyTo} 100%)`;
    lerped.horizonGradient = `linear-gradient(to top, ${lerped.horizonColor} 0%, transparent 40%)`;

    return lerped;
  }, [solvedCount]);
}

// Export stage names for use in UI labels
export const STAGE_NAMES = STAGES.map(s => ({ solved: s.solved, name: s.name }));
      
