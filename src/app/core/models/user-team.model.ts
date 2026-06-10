import { Timestamp } from '@angular/fire/firestore';

export interface UserTeam {
    uid: string;
    teams: string[];
    captainTeam: string;
    budgetUsed: number;
    locked: true;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}