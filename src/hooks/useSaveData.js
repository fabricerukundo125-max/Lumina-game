import { useState, useCallback, useMemo } from "react";

// ─── Schema ───────────────────────────────────────────────────────────────────
// {
//   version: 1,
//   stars: [
//     { puzzleId: 1, solvedAt: 1718000000000, x: 0.34, y: 0.21, color: "#6bcbff", size: 2.4 }
//   ]
// }

const STORAGE_KEY = "lumina_save_v1";
const TOTAL_PUZZLES = 28; // update when more puzzles are added

// Deterministic star position from puzzleId — same puzzle always maps to same
// position so the constellation is stable across sessions.
function starFromPuzzle(puzzleId, solvedAt) {
  // Simple seeded pseudo-random using puzzleId
  const seed = (n) => {
    const x = Math.sin(puzzleId * 9301 + n * 49297 + 233) * 13751;
    return x - Math.floor(x);
  };
  // Keep stars away from edges (10–90% range) for visual clarity
  const x = 0.10 + seed(1) * 0.80;
  const y = 0.08 + seed(2) * 0.72;
  const size = 1.6 + seed(3) * 2.2;  // 1.6 – 3.8px radius
  const colors = ["#6bcbff", "#a8ff6b", "#ff6b6b", "#cc88ff", "#ffcc44"];
  const color = colors[puzzleId % colors.length];
  return { puzzleId, solvedAt, x, y, size, color };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, stars: [] };
    const parsed = JSON.parse(raw);
    // Basic schema validation
    if (!Array.isArray(parsed.stars)) return { version: 1, stars: [] };
    return parsed;
  } catch {
    return { version: 1, stars: [] };
  }
}

function writeSave(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked — fail silently, game still works
  }
}

export function useSaveData() {
  const [saveData, setSaveData] = useState(loadSave);

  // Mark a puzzle as solved and create its star.
  // Idempotent — calling twice for same puzzleId is safe.
  const recordSolve = useCallback((puzzleId) => {
    setSaveData(prev => {
      const alreadySaved = prev.stars.some(s => s.puzzleId === puzzleId);
      if (alreadySaved) return prev; // no duplicate stars
      const star = starFromPuzzle(puzzleId, Date.now());
      const next = { ...prev, stars: [...prev.stars, star] };
      writeSave(next);
      return next;
    });
  }, []);

  // Clear all progress (for settings screen reset button)
  const clearSave = useCallback(() => {
    const fresh = { version: 1, stars: [] };
    writeSave(fresh);
    setSaveData(fresh);
  }, []);

  const solvedPuzzleIds = useMemo(
    () => new Set(saveData.stars.map(s => s.puzzleId)),
    [saveData.stars]
  );
  const totalSolved = saveData.stars.length;
  const pct         = Math.round((totalSolved / TOTAL_PUZZLES) * 100);

  return {
    stars: saveData.stars,
    solvedPuzzleIds,
    totalSolved,
    totalPuzzles: TOTAL_PUZZLES,
    pct,
    recordSolve,
    clearSave,
  };
}
