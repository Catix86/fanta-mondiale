import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  addDoc,
  collection,
  collectionData,
  doc,
  orderBy,
  query,
  updateDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Match, MatchStage, MatchStatus } from '../models/match.model';

export interface CreateMatchPayload {
  homeTeam: string;
  awayTeam: string;
  group?: string;
  stage: MatchStage;
  kickoffAt: Date;
}

@Injectable({ providedIn: 'root' })
export class MatchService {
  private firestore = inject(Firestore);

  getMatches(): Observable<Match[]> {
    const ref = collection(this.firestore, 'matches');
    return collectionData(query(ref, orderBy('kickoffAt', 'asc')), { idField: 'id' }) as Observable<Match[]>;
  }

  async createMatch(payload: CreateMatchPayload): Promise<void> {
    const ref = collection(this.firestore, 'matches');
    const matchToCreate: Omit<Match, 'id'> = {
      homeTeam: payload.homeTeam.trim(),
      awayTeam: payload.awayTeam.trim(),
      group: payload.group?.trim() || undefined,
      stage: payload.stage,
      kickoffAt: Timestamp.fromDate(payload.kickoffAt),
      status: 'scheduled' as MatchStatus
    };
    await addDoc(ref, matchToCreate);
  }

  setOfficialResult(matchId: string, home: number, away: number): Promise<void> {
    return updateDoc(doc(this.firestore, `matches/${matchId}`), {
      officialHomeGoals: home,
      officialAwayGoals: away,
      status: 'finished'
    });
  }
}
