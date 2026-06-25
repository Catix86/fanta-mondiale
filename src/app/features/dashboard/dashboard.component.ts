
import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Match } from '../../core/models/match.model';
import { Router } from '@angular/router';
import { Observable, map, combineLatest } from 'rxjs';
import {
  Firestore,
  collection,
  collectionData
} from '@angular/fire/firestore';
import { Prediction } from '../../core/models/prediction.model';
import { TeamFlagPipe } from '../../shared/pipes/team-flag.pipe';
import { Stats } from '../../core/models/dashboard.model';
import { LeaderboardRow, TeamScoreView } from '../../core/models/leaderboard.model';
import { calculatePredictionScore, getChampionWinnerPoints } from '../../core/utils/dynamic-scoring';
import { TeamEvent } from '../../core/models/team-event.model';
import { UserTeam } from '../../core/models/user-team.model';
import { getFantaTeamPrice } from '../../core/constants/fantateam-prices';

@Component({
  standalone: true,
  imports: [AsyncPipe, FormsModule, TeamFlagPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  public errorMessage = signal('');
  public stats = signal<Stats[]>([]);

  private authService = inject(AuthService);
  private router = inject(Router);
  private firestore = inject(Firestore);

  public user$ = this.authService.appUser$;

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

  public ngOnInit(): void {
    this.getUserStat().subscribe(stat => {
      console.log('User stat:', stat);
      this.stats.set([
        {
          icon: 'leaderboard',
          title: 'Punti totali',
          value: stat.points.toString()
        },
        {
          icon: 'leaderboard',
          title: 'Punti squadra',
          value: stat.squadPoints.toString()
        },
        {
          icon: 'leaderboard',
          title: 'Punti predizioni',
          value: stat.predictionPoints.toString()
        },
        {
          icon: 'sports_soccer',
          title: 'Risultati esatti',
          value: stat.exactResults.toString()
        },
        {
          icon: 'scoreboard',
          title: 'Esiti corretti',
          value: stat.correctOutcomes.toString()
        },
        {
          icon: 'trophy',
          title: 'Vincente',
          value: ''
        }
      ]);
    });
  }

  private getUserStat(): Observable<LeaderboardRow> {
    return combineLatest([
      this.user$,
      this.matches$,
      this.predictions$,
      this.userTeams$,
      this.teamEvents$
    ]).pipe(
      map(([user, matches, predictions, userTeams, teamEvents]) => {
        const matchesMap = new Map<string, Match>();

        for (const match of matches) {
          matchesMap.set(match.id, match);
        }

        let predictionPoints = 0;
        let exactResults = 0;
        let correctOutcomes = 0;

        const userPredictions = predictions.filter((p: Prediction) => p.uid === user?.uid);

        for (const prediction of userPredictions) {
          const match = matchesMap.get(prediction.matchId);

          if (!match) {
            continue;
          }

          const score = calculatePredictionScore(match, prediction);

          predictionPoints += score.points;

          if (score.exactResult) {
            exactResults += 1;
          }

          if (score.correctOutcome) {
            correctOutcomes += 1;
          }
        }

        const userTeam = userTeams.find((team: UserTeam) => team.uid === user?.uid);

        const teamScores = this.buildTeamScores(
          userTeam,
          teamEvents,
          matchesMap
        );

        const squadPoints = teamScores.reduce(
          (total: number, team: TeamScoreView) => total + team.finalPoints,
          0
        );

        const uid = user?.uid ?? '';
        const username = user?.username ?? '';
        const championPick = user?.championPick ?? '';
        const championBonus = user?.championBonusAwarded ? true : false;
        const championWinnerPoints = championBonus ? getChampionWinnerPoints(championPick) : 0;

        const totalPoints =
          predictionPoints +
          squadPoints +
          championWinnerPoints;

        return {
          uid,
          username,
          championPick,
          points: totalPoints,
          predictionPoints,
          squadPoints,
          exactResults,
          correctOutcomes,
          championBonus,
          teamScores
        };
      })
    );
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      await this.router.navigateByUrl('/login');
    } catch (error) {
      console.error('Errore logout:', error);
      this.errorMessage.set('Logout non riuscito. Riprova.');
    }
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
