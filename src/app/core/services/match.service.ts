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
  updateDoc,
  writeBatch
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Match, MatchStage, MatchStatus } from '../models/match.model';
import { WORLD_CUP_2026_GROUP_STAGE_MATCHES } from '../data/world-cup-2026-group-stage.seed';

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
      stage: payload.stage,
      kickoffAt: Timestamp.fromDate(payload.kickoffAt),
      status: 'scheduled' as MatchStatus
    };

    const group = payload.group?.trim();

    if (group) {
      matchToCreate.group = group;
    }

    await addDoc(ref, matchToCreate);
  }

  /**
   * Import idempotente dei 72 match della fase a gironi WC 2026.
   * Usa ID deterministici wc2026-gs-001..072, quindi se lo lanci due volte NON crea duplicati:
   * aggiorna gli stessi documenti.
   */
  async importWorldCup2026GroupStageMatches(): Promise<number> {
    const batch = writeBatch(this.firestore);

    for (const match of WORLD_CUP_2026_GROUP_STAGE_MATCHES) {
      const matchRef = doc(this.firestore, `matches/${match.id}`);
      batch.set(matchRef, {
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        group: match.group,
        stage: match.stage,
        kickoffAt: Timestamp.fromDate(new Date(match.kickoffAtIso)),
        status: match.status
      });
    }

    await batch.commit();
    return WORLD_CUP_2026_GROUP_STAGE_MATCHES.length;
  }

  setOfficialResult(matchId: string, home: number, away: number): Promise<void> {
    return updateDoc(doc(this.firestore, `matches/${matchId}`), {
      officialHomeGoals: home,
      officialAwayGoals: away,
      status: 'finished'
    });
  }

  getResultOutcome(homeGoals: number, awayGoals: number): '1' | 'X' | '2' {
    if (homeGoals > awayGoals) {
      return '1';
    }

    if (homeGoals < awayGoals) {
      return '2';
    }

    return 'X';
  }
}
