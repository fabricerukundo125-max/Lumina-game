import { useState, useCallback, useMemo } from "react";

// ─── Journal Schema ───────────────────────────────────────────────────────────
// Stored inside the main lumina_save_v1 key to keep everything in one place.
// Entries are append-only — never edited or deleted.
//
// entry = {
//   id:      string   — unique, ts-based
//   type:    "restore" | "stage" | "first"
//   ts:      number   — unix ms
//   puzzleId?: number
//   title:   string   — one line, present tense
//   icon:    string   — single unicode character
// }

const STORAGE_KEY = "lumina_save_v1";

// Stage milestone entries — written when a restoration stage is first reached
const STAGE_MILESTONES = [
  { solved: 1,  title: "A single light returned to the sky",     icon: "✦" },
  { solved: 2,  title: "Two stars. The sky begins to remember",  icon: "✦" },
  { solved: 3,  title: "A constellation outline emerges",        icon: "◈" },
  { solved: 5,  title: "The first constellation is complete",    icon: "◉" },
  { solved: 10, title: "The world breathes. Ten lights restored", icon: "∿" },
  { solved: 20, title: "Twenty stars. The sky is radiant",       icon: "◎" },
  { solved: 50, title: "The world is whole. All light returned", icon: "✺" },
];

// Per-puzzle restore entries
const PUZZLE_TITLES = [
  "Light entered the first chamber",
  "A forgotten path was illuminated",
  "Two colors found each other",
  "The beam navigated the labyrinth",
  "Two lights climbed toward the sky",
  "The sixth chamber remembers",
  "Ancient walls glow faintly",
  "The river of light flows again",
  "A hidden arch catches the beam",
  "The crystal forest stirs",
];

function getPuzzleTitle(puzzleId) {
  return PUZZLE_TITLES[(puzzleId - 1) % PUZZLE_TITLES.length];
}

function loadJournal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.journal) ? parsed.journal : [];
  } catch { return []; }
}

function saveJournal(entries) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : { version: 1, stars: [] };
    parsed.journal = entries;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {}
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
}

export function useJournal(totalSolved) {
  const [entries, setEntries] = useState(loadJournal);

  // Add a restore entry when a puzzle is solved
  const addRestoreEntry = useCallback((puzzleId) => {
    setEntries(prev => {
      // Idempotent — don't add duplicate for same puzzle
      if (prev.some(e => e.type === "restore" && e.puzzleId === puzzleId)) {
        return prev;
      }
      const entry = {
        id:       makeId(),
        type:     "restore",
        ts:       Date.now(),
        puzzleId,
        title:    getPuzzleTitle(puzzleId),
        icon:     "◈",
      };
      const next = [entry, ...prev];
      saveJournal(next);
      return next;
    });
  }, []);

  // Check if any stage milestones should be written based on current totalSolved
  const addStageMilestone = useCallback((solved) => {
    const milestone = STAGE_MILESTONES.find(m => m.solved === solved);
    if (!milestone) return;
    setEntries(prev => {
      if (prev.some(e => e.type === "stage" && e.title === milestone.title)) {
        return prev;
      }
      const entry = {
        id:    makeId(),
        type:  "stage",
        ts:    Date.now(),
        title: milestone.title,
        icon:  milestone.icon,
      };
      const next = [entry, ...prev];
      saveJournal(next);
      return next;
    });
  }, []);

  // Called by App whenever a puzzle is solved
  const onPuzzleSolved = useCallback((puzzleId, newTotal) => {
    addRestoreEntry(puzzleId);
    addStageMilestone(newTotal);
  }, [addRestoreEntry, addStageMilestone]);

  // Sorted newest first, capped at 50 entries for performance
  const sorted = useMemo(() =>
    [...entries].sort((a, b) => b.ts - a.ts).slice(0, 50),
    [entries]
  );

  return { entries: sorted, onPuzzleSolved };
}

// ─── Time formatting ──────────────────────────────────────────────────────────
export function formatRelativeTime(ts) {
  const diff = Date.now() - ts;
  const min  = Math.floor(diff / 60000);
  const hr   = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (min < 1)   return "just now";
  if (min < 60)  return `${min}m ago`;
  if (hr  < 24)  return `${hr}h ago`;
  if (day < 7)   return `${day}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month:"short", day:"numeric" });
}
