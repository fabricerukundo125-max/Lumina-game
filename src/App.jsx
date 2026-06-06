import { useState } from "react";
import { useSaveData } from "./hooks/useSaveData";
import BottomNav       from "./components/BottomNav";
import SkyScreen       from "./screens/SkyScreen";
import SettingsScreen  from "./screens/SettingsScreen";
import PuzzleScreen    from "./screens/PuzzleScreen";

// ─── App ──────────────────────────────────────────────────────────────────────
// Root component. Owns:
//   - active tab ("play" | "sky" | "settings")
//   - save data (via useSaveData hook)
//   - passes onPuzzleSolved callback to PuzzleScreen
//
// PuzzleScreen manages its own intro, puzzle selection, and win states internally.
// It calls onPuzzleSolved(puzzleId) when a puzzle is completed.

export default function App() {
  const [tab, setTab] = useState("play");

  const {
    stars,
    solvedPuzzleIds,
    totalSolved,
    totalPuzzles,
    pct,
    recordSolve,
    clearSave,
  } = useSaveData();

  return (
    <div style={{ position: "relative", minHeight: "100svh", background: "#020810" }}>

      {/* Screens — all mounted, visibility toggled so state is preserved */}
      <div style={{ display: tab === "play" ? "block" : "none" }}>
        <PuzzleScreen
          solvedPuzzleIds={solvedPuzzleIds}
          onPuzzleSolved={recordSolve}
        />
      </div>

      <div style={{ display: tab === "sky" ? "block" : "none" }}>
        <SkyScreen
          stars={stars}
          totalSolved={totalSolved}
          totalPuzzles={totalPuzzles}
          pct={pct}
        />
      </div>

      <div style={{ display: tab === "settings" ? "block" : "none" }}>
        <SettingsScreen
          totalSolved={totalSolved}
          totalPuzzles={totalPuzzles}
          clearSave={clearSave}
        />
      </div>

      {/* Bottom nav — always visible */}
      <BottomNav
        active={tab}
        onChange={setTab}
        starCount={totalSolved}
      />
    </div>
  );
}
