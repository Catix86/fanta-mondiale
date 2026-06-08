import { Timestamp } from '@angular/fire/firestore';

export type UserRole = 'player' | 'admin';

export interface AppUser {
  uid: string;
  username: string;
  role: UserRole;
  championPick: string;
  championPickLocked: true;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  points: number;
  exactResults: number;
  correctOutcomes: number;
  championBonusAwarded: boolean;
}
