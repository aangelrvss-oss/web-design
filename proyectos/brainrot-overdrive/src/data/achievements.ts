import type { RunStats } from '../logic/runStats';

export interface AchievementDef {
  id: string;
  name: string;
  text: string;
  /** Evaluated at the end of every run (and live for some, via `liveCheck`). */
  check: (s: RunStats, totals: { totalKills: number; runs: number }) => boolean;
  reward?: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'firstrun', name: 'Hello World', text: 'Finish your first run.', check: (_s, t) => t.runs >= 1 },
  { id: 'survive3', name: 'Still Online', text: 'Survive 3:00.', check: (s) => s.time >= 180, reward: 'Unlocks Gym Bro' },
  { id: 'level15', name: 'Main Character Energy', text: 'Reach level 15.', check: (s) => s.level >= 15 },
  { id: 'doomkill', name: 'Scrolled Past', text: 'Defeat The Doomscroller.', check: (s) => s.bossesKilled.includes('doomscroller'), reward: 'Unlocks The Gremlin' },
  { id: 'synergy3', name: 'Galaxy Brain', text: 'Have 3 synergies active in one run.', check: (s) => s.synergies.length >= 3, reward: 'Unlocks Spill Queen' },
  { id: 'combo100', name: 'Genuinely Concerning', text: 'Reach a 100 kill combo.', check: (s) => s.maxCombo >= 100 },
  { id: 'overdrive3', name: 'Locked In', text: 'Trigger Overdrive 3 times in one run.', check: (s) => s.overdrives >= 3 },
  { id: 'hitless2', name: 'Untouchable', text: 'Take no damage for the first 2:00.', check: (s) => s.hitlessUntil >= 120 },
  { id: 'kills5000', name: 'Content Moderator', text: 'Defeat 5,000 enemies in total.', check: (_s, t) => t.totalKills >= 5000 },
  { id: 'victory', name: 'Logged Off', text: 'Defeat The Algorithm.', check: (s) => s.victory },
  { id: 'daily', name: 'Daily Grind', text: 'Finish a daily challenge run.', check: (s) => s.daily },
];
