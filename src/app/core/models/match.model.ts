import { Timestamp } from '@angular/fire/firestore';

export type MatchStatus = 'scheduled' | 'live' | 'finished';
export type MatchStage = 'group' | 'round16' | 'quarter' | 'semi' | 'third_place' | 'final';

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  group?: string;
  stage: MatchStage;
  kickoffAt: Timestamp;
  status: MatchStatus;
  officialHomeGoals?: number;
  officialAwayGoals?: number;
}
