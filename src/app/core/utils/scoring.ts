export const SCORING_RULES = {
  EXACT_RESULT: 10,
  CORRECT_OUTCOME: 3,
  CHAMPION_WINNER: 150
} as const;

export function outcome(home: number, away: number): '1' | 'X' | '2' {
  if (home > away) return '1';
  if (home < away) return '2';
  return 'X';
}

export function isPredictionLocked(kickoff: Date): boolean {
  return Date.now() >= kickoff.getTime() - 5 * 60 * 1000;
}
