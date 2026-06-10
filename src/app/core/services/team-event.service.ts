import { Injectable, inject } from '@angular/core';
import {
    Firestore,
    addDoc,
    collection,
    collectionData,
    serverTimestamp
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { TeamEvent } from '../models/team-event.model';
import { getFantaTeamRule } from '../constants/fantateam-rules';

@Injectable({ providedIn: 'root' })
export class TeamEventService {
    private firestore = inject(Firestore);
    private auth = inject(Auth);

    getTeamEvents(): Observable<TeamEvent[]> {
        return collectionData(
            collection(this.firestore, 'teamEvents'),
            { idField: 'id' }
        ) as Observable<TeamEvent[]>;
    }

    async addTeamEvent(matchId: string, teamName: string, ruleId: string): Promise<void> {
        const user = this.auth.currentUser;

        if (!user) {
            throw new Error('Utente non autenticato.');
        }

        const rule = getFantaTeamRule(ruleId);

        if (!rule) {
            throw new Error('Bonus/malus non valido.');
        }

        await addDoc(collection(this.firestore, 'teamEvents'), {
            matchId,
            teamName,
            ruleId,
            points: rule.points,
            label: rule.label,
            description: rule.description,
            createdAt: serverTimestamp(),
            createdBy: user.uid
        });
    }
}