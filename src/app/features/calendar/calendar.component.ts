
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  QueryList,
  signal,
  ViewChildren
} from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatchService } from '../../core/services/match.service';
import { PredictionService } from '../../core/services/prediction.service';
import { AuthService } from '../../core/services/auth.service';
import { Match } from '../../core/models/match.model';
import { isPredictionLocked } from '../../core/utils/scoring';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';
import {
  Firestore,
  collection,
  collectionData
} from '@angular/fire/firestore';
import { Prediction } from '../../core/models/prediction.model';
import {
  getMatchOutcomePoints,
  MatchOutcomePoints,
  calculatePotentialPredictionPoints,
  PotentialPredictionPoints
} from '../../core/utils/dynamic-scoring';
import { TeamFlagPipe } from '../../shared/pipes/team-flag.pipe';
import { ToastService } from '../../core/services/toast.service';

interface CalendarUser {
  uid: string;
  username: string;
}

interface MatchPredictionView {
  uid: string;
  username: string;
  predictedHomeGoals: number;
  predictedAwayGoals: number;
}

interface CalendarStats {
  finishedMatches: number;
  exactResults: number;
  correctOutcomes: number;
  exactResultsPercent: number;
  correctOutcomesPercent: number;
}

@Component({
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormsModule, TeamFlagPipe],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements AfterViewInit {
  @ViewChildren('matchCard') private matchCards!: QueryList<ElementRef<HTMLElement>>;

  private matchService = inject(MatchService);
  private predictionService = inject(PredictionService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private firestore = inject(Firestore);
  private toast = inject(ToastService);

  matches$ = this.matchService.getMatches();
  user$ = this.authService.appUser$;

  savingMatchId = signal<string | null>(null);
  successMessage = signal('');
  errorMessage = signal('');

  allPredictions: Prediction[] = [];
  usersMap: Record<string, string> = {};

  drafts: Record<string, { home: number; away: number }> = {};
  existingPredictionMatchIds: Record<string, boolean> = {};

  calendarStats = signal<CalendarStats>({
    finishedMatches: 0,
    exactResults: 0,
    correctOutcomes: 0,
    exactResultsPercent: 0,
    correctOutcomesPercent: 0
  });

  private currentUserPredictions: Prediction[] = [];
  private currentMatches: Match[] = [];
  private hasScrolledToNextMatch = false;

  constructor() {
    this.authService.firebaseUser$
      .pipe(
        switchMap(user => {
          if (!user) {
            return of([]);
          }

          return this.predictionService.getUserPredictions(user.uid);
        }),
        takeUntilDestroyed(this.destroyRef)
      )

      .subscribe(predictions => {
        const existing: Record<string, boolean> = {};
        this.currentUserPredictions = predictions;

        for (const prediction of predictions) {
          this.drafts[prediction.matchId] = {
            home: prediction.predictedHomeGoals,
            away: prediction.predictedAwayGoals
          };

          existing[prediction.matchId] = true;
        }

        this.recalculateCalendarStats();
        this.existingPredictionMatchIds = existing;
      });


    this.matches$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(matches => {
        this.currentMatches = matches;
        this.recalculateCalendarStats();
        this.scrollToNextUpcomingMatchOnce();
      });

    collectionData(collection(this.firestore, 'users'), { idField: 'uid' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(users => {
        const map: Record<string, string> = {};

        for (const user of users as CalendarUser[]) {
          map[user.uid] = user.username;
        }

        this.usersMap = map;
      });

    this.predictionService.getAllPredictions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(predictions => {
        this.allPredictions = predictions;
      });
  }

  public ngAfterViewInit(): void {
    this.matchCards.changes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.scrollToNextUpcomingMatchOnce();
      });

    setTimeout(() => {
      this.scrollToNextUpcomingMatchOnce();
    });
  }

  hasExistingPrediction(matchId: string): boolean {
    return Boolean(this.existingPredictionMatchIds[matchId]);
  }

  outcomePoints(match: Match): MatchOutcomePoints {
    return getMatchOutcomePoints(match);
  }

  potentialPredictionPoints(match: Match): PotentialPredictionPoints {
    const draft = this.draft(match.id);

    return calculatePotentialPredictionPoints(
      match,
      Number(draft.home),
      Number(draft.away)
    );
  }

  draft(matchId: string): { home: number; away: number } {
    if (!this.drafts[matchId]) this.drafts[matchId] = { home: 0, away: 0 };
    return this.drafts[matchId];
  }

  matchDate(match: Match): Date {
    const kickoffAt: any = match.kickoffAt;

    if (kickoffAt?.toDate) {
      return kickoffAt.toDate();
    }

    return new Date(kickoffAt);
  }

  locked(match: Match): boolean {
    return isPredictionLocked(this.matchDate(match)) || match.status !== 'scheduled';
  }

  matchPredictions(matchId: string): MatchPredictionView[] {
    return this.allPredictions
      .filter(prediction => prediction.matchId === matchId)
      .map(prediction => ({
        uid: prediction.uid,
        username: this.usersMap[prediction.uid] || 'Utente',
        predictedHomeGoals: prediction.predictedHomeGoals,
        predictedAwayGoals: prediction.predictedAwayGoals
      }))
      .sort((a, b) => a.username.localeCompare(b.username));
  }

  private recalculateCalendarStats(): void {
    const finishedMatches = this.currentMatches.filter(match =>
      match.status === 'finished' &&
      typeof match.officialHomeGoals === 'number' &&
      typeof match.officialAwayGoals === 'number'
    );

    const predictionsByMatchId = new Map<string, Prediction>();

    for (const prediction of this.currentUserPredictions) {
      predictionsByMatchId.set(prediction.matchId, prediction);
    }

    let exactResults = 0;
    let correctOutcomes = 0;

    for (const match of finishedMatches) {
      const prediction = predictionsByMatchId.get(match.id);

      if (!prediction) {
        continue;
      }

      const officialOutcome = this.matchService.getResultOutcome(
        match.officialHomeGoals!,
        match.officialAwayGoals!
      );

      const predictedOutcome = this.matchService.getResultOutcome(
        prediction.predictedHomeGoals,
        prediction.predictedAwayGoals
      );

      const exact =
        prediction.predictedHomeGoals === match.officialHomeGoals &&
        prediction.predictedAwayGoals === match.officialAwayGoals;

      if (predictedOutcome === officialOutcome) {
        correctOutcomes += 1;
      }

      if (exact) {
        exactResults += 1;
      }
    }

    const total = finishedMatches.length;

    this.calendarStats.set({
      finishedMatches: total,
      exactResults,
      correctOutcomes,
      exactResultsPercent: total > 0
        ? Math.round((exactResults / total) * 100)
        : 0,
      correctOutcomesPercent: total > 0
        ? Math.round((correctOutcomes / total) * 100)
        : 0
    });
  }

  async save(match: Match): Promise<void> {
    this.toast.show('');

    const draft = this.draft(match.id);
    const homeGoals = Number(draft.home);
    const awayGoals = Number(draft.away);

    if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals)) {
      this.toast.show('Inserisci un risultato valido.', 'error');
      return;
    }

    if (homeGoals < 0 || awayGoals < 0 || homeGoals > 10 || awayGoals > 10) {
      this.toast.show('Il risultato deve essere tra 0 e 10.', 'error');
      return;
    }

    if (this.locked(match)) {
      this.toast.show('Pronostico bloccato: mancano meno di 5 minuti o la partita non è più programmata.', 'error');
      return;
    }

    this.savingMatchId.set(match.id);

    try {
      await this.predictionService.savePrediction(match, homeGoals, awayGoals);
      this.existingPredictionMatchIds[match.id] = true;
      this.toast.show('Pronostico salvato correttamente');
    } catch (error) {
      console.error('Errore salvataggio pronostico:', error);
      this.toast.show('Errore nel salvataggio del pronostico', 'error');
    } finally {
      this.savingMatchId.set(null);
    }
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

  private scrollToNextUpcomingMatchOnce(): void {
    if (this.hasScrolledToNextMatch) {
      return;
    }

    if (!this.currentMatches.length || !this.matchCards?.length) {
      return;
    }

    const now = Date.now();

    const sortedMatches = [...this.currentMatches].sort(
      (a, b) => this.matchDate(a).getTime() - this.matchDate(b).getTime()
    );

    const nextMatch =
      sortedMatches.find(match => this.matchDate(match).getTime() >= now) ??
      sortedMatches[sortedMatches.length - 1];

    if (!nextMatch) {
      return;
    }

    const targetCard = this.matchCards.find(card =>
      card.nativeElement.dataset['matchId'] === nextMatch.id
    );

    if (!targetCard) {
      return;
    }

    this.hasScrolledToNextMatch = true;

    setTimeout(() => {
      targetCard.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 250);
  }

  selectInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input) return;

    // piccolo timeout per mobile (importantissimo)
    setTimeout(() => {
      input.select();
    });
  }

  predictionResultClass(
    match: Match,
    prediction: MatchPredictionView
  ): string {
    if (
      match.status !== 'finished' ||
      typeof match.officialHomeGoals !== 'number' ||
      typeof match.officialAwayGoals !== 'number'
    ) {
      return '';
    }

    const exact =
      prediction.predictedHomeGoals === match.officialHomeGoals &&
      prediction.predictedAwayGoals === match.officialAwayGoals;

    if (exact) {
      return 'prediction-exact';
    }

    const predictedOutcome = this.matchService.getResultOutcome(
      prediction.predictedHomeGoals,
      prediction.predictedAwayGoals
    );

    const officialOutcome = this.matchService.getResultOutcome(
      match.officialHomeGoals,
      match.officialAwayGoals
    );

    if (predictedOutcome === officialOutcome) {
      return 'prediction-outcome';
    }

    return 'prediction-wrong';
  }
}
