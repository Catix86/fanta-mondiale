import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  collection,
  collectionData,
  doc,
  query,
  serverTimestamp,
  setDoc,
  where
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Match } from '../models/match.model';
import { Prediction } from '../models/prediction.model';

@Injectable({ providedIn: 'root' })
export class PredictionService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  getUserPredictions(uid: string): Observable<Prediction[]> {
    const ref = collection(this.firestore, 'predictions');

    const q = query(
      ref,
      where('uid', '==', uid)
    );

    return collectionData(q, { idField: 'id' }) as Observable<Prediction[]>;
  }

  getAllPredictions(): Observable<Prediction[]> {
    const ref = collection(this.firestore, 'predictions');

    return collectionData(ref, { idField: 'id' }) as Observable<Prediction[]>;
  }

  async savePrediction(
    match: Match,
    homeGoals: number,
    awayGoals: number
  ): Promise<void> {
    const user = this.auth.currentUser;

    if (!user) {
      throw new Error('Utente non autenticato.');
    }

    if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals)) {
      throw new Error('Risultato non valido.');
    }

    if (homeGoals < 0 || awayGoals < 0 || homeGoals > 30 || awayGoals > 30) {
      throw new Error('Risultato fuori range.');
    }

    const kickoffDate = this.toDate(match.kickoffAt);
    const lockDate = new Date(kickoffDate.getTime() - 5 * 60 * 1000);

    const predictionId = `${user.uid}_${match.id}`;

    await setDoc(
      doc(this.firestore, `predictions/${predictionId}`),
      {
        id: predictionId,
        uid: user.uid,
        matchId: match.id,
        predictedHomeGoals: homeGoals,
        predictedAwayGoals: awayGoals,
        points: 0,
        exactResult: false,
        correctOutcome: false,
        lockedAt: Timestamp.fromDate(lockDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  private toDate(value: any): Date {
    if (value?.toDate) {
      return value.toDate();
    }

    return new Date(value);
  }
}