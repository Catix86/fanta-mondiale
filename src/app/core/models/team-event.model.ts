import { Timestamp } from '@angular/fire/firestore';

export interface TeamEvent {
    id: string;
    matchId: string;
    teamName: string;
    ruleId: string;
    points: number;
    label: string;
    description: string;
    createdAt: Timestamp;
    createdBy: string;
}