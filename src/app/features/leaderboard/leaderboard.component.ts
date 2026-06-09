import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Firestore, collection, collectionData, doc, docData } from '@angular/fire/firestore';
import { combineLatest, map, Observable, of, catchError } from 'rxjs';
import { SCORING_RULES, outcome } from '../../core/utils/scoring';
import { AuthService } from '../../core/services/auth.service';

interface AppUserRow {
  uid: string;
  username: string;
  championPick: string;
}

interface MatchRow {
  id: string;
  status: 'scheduled' | 'live' | 'finished';
  officialHomeGoals?: number;
  officialAwayGoals?: number;
}

interface PredictionRow {
  uid: string;
  matchId: string;
  predictedHomeGoals: number;
  predictedAwayGoals: number;
}

interface WorldCupSettings {
  winner?: string;
}

interface LeaderboardRow {
  uid: string;
  username: string;
  championPick: string;
  points: number;
  exactResults: number;
  correctOutcomes: number;
  championBonus: boolean;
}

@Component({
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss'
})
export class LeaderboardComponent {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);
  
  user$ = this.auth.appUser$;

  private users$ = collectionData(collection(this.firestore, 'users')) as Observable<AppUserRow[]>;
  private matches$ = collectionData(collection(this.firestore, 'matches'), { idField: 'id' }) as Observable<MatchRow[]>;
  private predictions$ = collectionData(collection(this.firestore, 'predictions')) as Observable<PredictionRow[]>;
  private settings$ = (docData(doc(this.firestore, 'settings/worldCup')) as Observable<WorldCupSettings>).pipe(
    catchError(() => of({} as WorldCupSettings))
  );

  leaderboard$: Observable<LeaderboardRow[]> = combineLatest([
    this.users$,
    this.matches$,
    this.predictions$,
    this.settings$
  ]).pipe(
    map(([users, matches, predictions, settings]) => {
      const finishedMatches = new Map<string, MatchRow>();

      for (const match of matches) {
        if (match.status === 'finished' && typeof match.officialHomeGoals === 'number' && typeof match.officialAwayGoals === 'number') {
          finishedMatches.set(match.id, match);
        }
      }

      return users.map(user => {
        let points = 0;
        let exactResults = 0;
        let correctOutcomes = 0;
        const userPredictions = predictions.filter(p => p.uid === user.uid);

        for (const prediction of userPredictions) {
          const match = finishedMatches.get(prediction.matchId);
          if (!match) continue;

          const exact = prediction.predictedHomeGoals === match.officialHomeGoals && prediction.predictedAwayGoals === match.officialAwayGoals;
          if (exact) {
            points += SCORING_RULES.EXACT_RESULT;
            exactResults += 1;
            continue;
          }

          const predictedOutcome = outcome(prediction.predictedHomeGoals, prediction.predictedAwayGoals);
          const officialOutcome = outcome(match.officialHomeGoals!, match.officialAwayGoals!);
          if (predictedOutcome === officialOutcome) {
            points += SCORING_RULES.CORRECT_OUTCOME;
            correctOutcomes += 1;
          }
        }

        const championBonus = Boolean(settings?.winner) && settings.winner === user.championPick;
        if (championBonus) points += SCORING_RULES.CHAMPION_WINNER;

        return {
          uid: user.uid,
          username: user.username,
          championPick: user.championPick,
          points,
          exactResults,
          correctOutcomes,
          championBonus
        };
      }).sort((a, b) => b.points - a.points);
    })
  );
}
