import { useState } from "react";
import { useSaveData }     from "./hooks/useSaveData";
import { useJournal }      from "./hooks/useJournal";
import BottomNav           from "./components/BottomNav";
import SkyScreen           from "./screens/SkyScreen";
import SettingsScreen      from "./screens/SettingsScreen";
import PuzzleScreen        from "./screens/PuzzleScreen";
import JournalScreen       from "./screens/JournalScreen";

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

  const { entries, onPuzzleSolved: journalOnSolve } = useJournal(totalSolved);

  // Called when a puzzle is won — updates both save system and journal
  const handlePuzzleSolved = (puzzleId) => {
    recordSolve(puzzleId);
    // Pass new total after solve for milestone detection
    journalOnSolve(puzzleId, totalSolved + 1);
  };

  return (
    <div style={{ position: "relative", minHeight: "100svh", background: "#020810" }}>

      <div style={{ display: tab === "play"     ? "block" : "none" }}>
        <PuzzleScreen
          solvedPuzzleIds={solvedPuzzleIds}
          onPuzzleSolved={handlePuzzleSolved}
        />
      </div>

      <div style={{ display: tab === "sky"      ? "block" : "none" }}>
        <SkyScreen
          stars={stars}
          totalSolved={totalSolved}
          totalPuzzles={totalPuzzles}
          pct={pct}
        />
      </div>

      <div style={{ display: tab === "journal"  ? "block" : "none" }}>
        <JournalScreen
          entries={entries}
          totalSolved={totalSolved}
        />
      </div>

      <div style={{ display: tab === "settings" ? "block" : "none" }}>
        <SettingsScreen
          totalSolved={totalSolved}
          totalPuzzles={totalPuzzles}
          clearSave={clearSave}
        />
      </div>

      <BottomNav
        active={tab}
        onChange={setTab}
        starCount={totalSolved}
        journalCount={entries.length}
      />
    </div>
  );
}
