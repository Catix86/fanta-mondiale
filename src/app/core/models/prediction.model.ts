import { Timestamp } from '@angular/fire/firestore';

export interface Prediction {
  id: string;
  uid: string;
  matchId: string;
  predictedHomeGoals: number;
  predictedAwayGoals: number;
  points: number;
  exactResult: boolean;
  correctOutcome: boolean;
  lockedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
