import type { LeaderboardEntry } from './components/Leaderboard';

/**
 * SAMPLE / DEMO DATA ONLY.
 *
 * The leaderboard / gamification features do not have a backend data source
 * yet. These static entries are shown for demo purposes so the dashboard
 * matches the target design. Replace with a real API when available.
 */
export const SAMPLE_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Anh Tran', level: 8, xp: 2450 },
  { rank: 2, name: 'Minh Le', level: 7, xp: 2120 },
  { rank: 3, name: 'Hoa Pham', level: 6, xp: 1890 },
];

/** Default learning-path step names for the suggested path when no roadmap exists. */
export const SAMPLE_PATH_STEPS = ['HTML/CSS', 'JavaScript', 'React', 'TypeScript', 'Node.js', 'System Design'];
