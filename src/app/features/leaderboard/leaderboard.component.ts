import { Component, inject, signal } from '@angular/core';
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
import { UserTeam } from '../../core/models/user-team.model';
import { TeamEvent } from '../../core/models/team-event.model';
import {
  calculatePredictionScore,
  getChampionWinnerPoints,
  isSameChampionPick
} from '../../core/utils/dynamic-scoring';
import { getFantaTeamPrice } from '../../core/constants/fantateam-prices';
import { TeamFlagPipe } from '../../shared/pipes/team-flag.pipe';

interface AppUserRow {
  uid: string;
  username: string;
  championPick: string;
}

interface WorldCupSettings {
  winner?: string;
}

interface TeamEventView extends TeamEvent {
  matchLabel: string;
  computedPoints: number;
}

interface TeamScoreView {
  teamName: string;
  price: number;
  isCaptain: boolean;
  basePoints: number;
  finalPoints: number;
  events: TeamEventView[];
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
  teamScores: TeamScoreView[];
}

@Component({
  standalone: true,
  imports: [AsyncPipe, TeamFlagPipe],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.scss'
})
export class LeaderboardComponent {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);

  user$ = this.auth.appUser$;

  selectedUserSquad = signal<LeaderboardRow | null>(null);

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

            const score = calculatePredictionScore(match, prediction);

            predictionPoints += score.points;

            if (score.exactResult) {
              exactResults += 1;
            } else if (score.correctOutcome) {
              correctOutcomes += 1;
            }
          }

          const userTeam = userTeams.find(team => team.uid === user.uid);

          const teamScores = this.buildTeamScores(
            userTeam,
            teamEvents,
            matchesMap
          );

          const squadPoints = teamScores.reduce(
            (total, team) => total + team.finalPoints,
            0
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
            championBonus,
            teamScores
          };
        })
        .sort((a, b) => b.points - a.points);
    })
  );

  openUserSquad(user: LeaderboardRow, currentUserUid: string | undefined): void {
    if (!currentUserUid) {
      return;
    }

    if (user.uid === currentUserUid || user.teamScores.length === 0) {
      return;
    }

    this.selectedUserSquad.set(user);
  }

  closeUserSquad(): void {
    this.selectedUserSquad.set(null);
  }

  hasSquad(user: LeaderboardRow): boolean {
    return user.teamScores.length > 0;
  }

  private buildTeamScores(
    userTeam: UserTeam | undefined,
    teamEvents: TeamEvent[],
    matchesMap: Map<string, Match>
  ): TeamScoreView[] {
    if (!userTeam) {
      return [];
    }

    return userTeam.teams.map(teamName => {
      const isCaptain = userTeam.captainTeam === teamName;

      const events = teamEvents
        .filter(event => event.teamName === teamName)
        .map(event => {
          const match = matchesMap.get(event.matchId);

          const matchLabel = match
            ? `${match.homeTeam} - ${match.awayTeam}`
            : 'Partita non trovata';

          const computedPoints = isCaptain
            ? event.points * 2
            : event.points;

          return {
            ...event,
            matchLabel,
            computedPoints
          };
        });

      const basePoints = events.reduce(
        (total, event) => total + event.points,
        0
      );

      const finalPoints = isCaptain
        ? basePoints * 2
        : basePoints;

      return {
        teamName,
        price: getFantaTeamPrice(teamName),
        isCaptain,
        basePoints,
        finalPoints,
        events
      };
    });
  }
}