import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData
} from '@angular/fire/firestore';
import { combineLatest, map, Observable, of, catchError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { Match } from '../../core/models/match.model';
import { Prediction } from '../../core/models/prediction.model';
import {
  calculatePredictionScore,
  getChampionWinnerPoints,
  isSameChampionPick
} from '../../core/utils/dynamic-scoring';
import { UserTeam } from '../../core/models/user-team.model';
import { TeamEvent } from '../../core/models/team-event.model';


interface AppUserRow {
  uid: string;
  username: string;
  championPick: string;
}

interface WorldCupSettings {
  winner?: string;
}


interface LeaderboardRow {
  uid: string;
  username: string;
  championPick: string;
  points: number;
  predictionPoints: number;
  squadPoints: number;
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

  private users$ = collectionData(
    collection(this.firestore, 'users')
  ) as Observable<AppUserRow[]>;

  private matches$ = collectionData(
    collection(this.firestore, 'matches'),
    { idField: 'id' }
  ) as Observable<Match[]>;

  private predictions$ = collectionData(
    collection(this.firestore, 'predictions')
  ) as Observable<Prediction[]>;


  private userTeams$ = collectionData(
    collection(this.firestore, 'userTeams')
  ) as Observable<UserTeam[]>;

  private teamEvents$ = collectionData(
    collection(this.firestore, 'teamEvents'),
    { idField: 'id' }
  ) as Observable<TeamEvent[]>;

  private settings$ = (
    docData(doc(this.firestore, 'settings/worldCup')) as Observable<WorldCupSettings>
  ).pipe(
    catchError(() => of({} as WorldCupSettings))
  );

  leaderboard$: Observable<LeaderboardRow[]> = combineLatest([
    this.users$,
    this.matches$,
    this.predictions$,
    this.userTeams$,
    this.teamEvents$,
    this.settings$
  ]).pipe(
    map(([users, matches, predictions, userTeams, teamEvents, settings]) => {
      const matchesMap = new Map<string, Match>();

      for (const match of matches) {
        matchesMap.set(match.id, match);
      }

      return users
        .map(user => {
          let predictionPoints = 0;
          let exactResults = 0;
          let correctOutcomes = 0;

          const userPredictions = predictions.filter(p => p.uid === user.uid);

          for (const prediction of userPredictions) {
            const match = matchesMap.get(prediction.matchId);

            if (!match) {
              continue;
            }

            const score = calculatePredictionScore(
              match,
              prediction
            );

            predictionPoints += score.points;

            if (score.exactResult) {
              exactResults += 1;
            } else if (score.correctOutcome) {
              correctOutcomes += 1;
            }
          }

          const userTeam = userTeams.find(team => team.uid === user.uid);

          const squadPoints = this.calculateSquadPoints(
            userTeam,
            teamEvents
          );

          const championBonus = isSameChampionPick(
            settings?.winner,
            user.championPick
          );

          const championWinnerPoints = championBonus
            ? getChampionWinnerPoints(user.championPick)
            : 0;

          const totalPoints =
            predictionPoints +
            squadPoints +
            championWinnerPoints;

          return {
            uid: user.uid,
            username: user.username,
            championPick: user.championPick,
            points: totalPoints,
            predictionPoints,
            squadPoints,
            exactResults,
            correctOutcomes,
            championBonus
          };
        })
        .sort((a, b) => b.points - a.points);
    })
  );

  private calculateSquadPoints(
    userTeam: UserTeam | undefined,
    teamEvents: TeamEvent[]
  ): number {
    if (!userTeam) {
      return 0;
    }

    let total = 0;

    for (const event of teamEvents) {
      if (!userTeam.teams.includes(event.teamName)) {
        continue;
      }

      const multiplier = event.teamName === userTeam.captainTeam ? 2 : 1;

      total += event.points * multiplier;
    }

    return total;
  }
}