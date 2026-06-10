import { Injectable, inject } from '@angular/core';
import {
    Firestore,
    doc,
    docData,
    serverTimestamp,
    setDoc
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { UserTeam } from '../models/user-team.model';
import {
    FANTATEAM_BUDGET,
    FANTATEAM_TEAM_SIZE,
    calculateFantaTeamBudget
} from '../constants/fantateam-prices';

@Injectable({ providedIn: 'root' })
export class UserTeamService {
    private firestore = inject(Firestore);
    private auth = inject(Auth);

    getMyTeam(uid: string): Observable<UserTeam | undefined> {
        return docData(doc(this.firestore, `userTeams/${uid}`)) as Observable<UserTeam | undefined>;
    }

    async saveMyTeam(teams: string[], captainTeam: string): Promise<void> {
        const user = this.auth.currentUser;

        if (!user) {
            throw new Error('Utente non autenticato.');
        }

        const uniqueTeams = Array.from(new Set(teams));

        if (uniqueTeams.length !== FANTATEAM_TEAM_SIZE) {
            throw new Error(`Devi scegliere esattamente ${FANTATEAM_TEAM_SIZE} squadre.`);
        }

        if (!uniqueTeams.includes(captainTeam)) {
            throw new Error('Il capitano deve essere una delle 6 squadre.');
        }

        const budgetUsed = calculateFantaTeamBudget(uniqueTeams);

        if (budgetUsed > FANTATEAM_BUDGET) {
            throw new Error('Budget superato.');
        }

        await setDoc(doc(this.firestore, `userTeams/${user.uid}`), {
            uid: user.uid,
            teams: uniqueTeams,
            captainTeam,
            budgetUsed,
            locked: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }
}