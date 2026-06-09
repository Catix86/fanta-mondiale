import { Component, inject, signal, DestroyRef } from '@angular/core';
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


@Component({
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormsModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent {
  private matches = inject(MatchService);
  private predictions = inject(PredictionService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  matches$ = this.matches.getMatches();
  user$ = this.auth.appUser$;

  savingMatchId = signal<string | null>(null);
  successMessage = signal('');
  errorMessage = signal('');

  drafts: Record<string, { home: number; away: number }> = {};

  constructor() {
    this.auth.firebaseUser$
      .pipe(
        switchMap(user => {
          if (!user) {
            return of([]);
          }

          return this.predictions.getUserPredictions(user.uid);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(predictions => {
        for (const prediction of predictions) {
          this.drafts[prediction.matchId] = {
            home: prediction.predictedHomeGoals,
            away: prediction.predictedAwayGoals
          };
        }
      });
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

  async save(match: Match): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');

    const draft = this.draft(match.id);
    const homeGoals = Number(draft.home);
    const awayGoals = Number(draft.away);

    if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals)) {
      this.errorMessage.set('Inserisci un risultato valido.');
      return;
    }

    if (homeGoals < 0 || awayGoals < 0 || homeGoals > 30 || awayGoals > 30) {
      this.errorMessage.set('Il risultato deve essere tra 0 e 30.');
      return;
    }

    if (this.locked(match)) {
      this.errorMessage.set('Pronostico bloccato: mancano meno di 5 minuti o la partita non è più programmata.');
      return;
    }

    this.savingMatchId.set(match.id);

    try {
      await this.predictions.savePrediction(match, homeGoals, awayGoals);
      this.successMessage.set('Pronostico salvato correttamente.');
    } catch (error) {
      console.error('Errore salvataggio pronostico:', error);
      this.errorMessage.set('Pronostico non salvato. Controlla le regole Firestore o il blocco partita.');
    } finally {
      this.savingMatchId.set(null);
    }
  }


  async logout(): Promise<void> {
    try {
      await this.auth.logout();
      await this.router.navigateByUrl('/login');
    } catch (error) {
      console.error('Errore logout:', error);
      this.errorMessage.set('Logout non riuscito. Riprova.');
    }
  }

}
