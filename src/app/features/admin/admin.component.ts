import { Component, inject, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatchService } from '../../core/services/match.service';
import { Match, MatchStage } from '../../core/models/match.model';
import { WORLD_CUP_TEAMS } from '../../core/constants/teams';
import { TeamEventService } from '../../core/services/team-event.service';
import { FANTATEAM_RULES } from '../../core/constants/fantateam-rules';

@Component({
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormsModule, NgClass, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  private matches = inject(MatchService);
  private fb = inject(FormBuilder);

  teams = WORLD_CUP_TEAMS;
  matches$ = this.matches.getMatches();

  matchTeams$: Observable<string[]> = this.matches$.pipe(
    map(matches => {
      const teams = matches.flatMap(match => [
        match.homeTeam,
        match.awayTeam
      ]);

      return Array.from(new Set(teams))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'it'));
    })
  );


  savingMatchId = signal<string | null>(null);
  creatingMatch = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  private teamEvents = inject(TeamEventService);

  rules = FANTATEAM_RULES;

  teamEventForm = this.fb.nonNullable.group({
    matchId: ['', Validators.required],
    teamName: ['', Validators.required],
    ruleId: ['', Validators.required]
  });

  stages: { label: string; value: MatchStage }[] = [
    { label: 'Girone', value: 'group' },
    { label: 'Ottavi', value: 'round16' },
    { label: 'Quarti', value: 'quarter' },
    { label: 'Semifinale', value: 'semi' },
    { label: 'Finale 3° posto', value: 'third_place' },
    { label: 'Finale', value: 'final' }
  ];

  createMatchForm = this.fb.nonNullable.group({
    homeTeam: ['', [Validators.required, Validators.minLength(2)]],
    awayTeam: ['', [Validators.required, Validators.minLength(2)]],
    group: [''],
    stage: ['group' as MatchStage, Validators.required],
    kickoffAt: ['', Validators.required]
  });

  drafts: Record<string, { home: number; away: number }> = {};

  draft(matchId: string): { home: number; away: number } {
    if (!this.drafts[matchId]) this.drafts[matchId] = { home: 0, away: 0 };
    return this.drafts[matchId];
  }

  matchDate(match: Match): Date {
    const kickoffAt: any = match.kickoffAt;
    if (kickoffAt?.toDate) return kickoffAt.toDate();
    return new Date(kickoffAt);
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'scheduled': return 'Programmato';
      case 'live': return 'In corso';
      case 'finished': return 'Terminato';
      default: return status;
    }
  }

  async createMatch(): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (this.createMatchForm.invalid) {
      this.createMatchForm.markAllAsTouched();
      this.errorMessage.set('Compila squadre, fase e data/ora.');
      return;
    }

    const value = this.createMatchForm.getRawValue();

    if (!value.homeTeam || !value.awayTeam) {
      this.errorMessage.set('Seleziona entrambe le squadre.');
      return;
    }

    if (value.homeTeam.trim().toLowerCase() === value.awayTeam.trim().toLowerCase()) {
      this.errorMessage.set('Le due squadre devono essere diverse.');
      return;
    }

    const kickoffAt = new Date(value.kickoffAt);
    if (Number.isNaN(kickoffAt.getTime())) {
      this.errorMessage.set('Data e ora non valide.');
      return;
    }

    this.creatingMatch.set(true);

    try {
      await this.matches.createMatch({
        homeTeam: value.homeTeam,
        awayTeam: value.awayTeam,
        group: value.group,
        stage: value.stage,
        kickoffAt
      });

      this.successMessage.set('Match creato correttamente.');
      this.createMatchForm.reset({ homeTeam: '', awayTeam: '', group: '', stage: 'group', kickoffAt: '' });
    } catch (error) {
      console.error('Errore creazione match:', error);
      this.errorMessage.set('Match non creato. Verifica ruolo admin e regole Firestore.');
    } finally {
      this.creatingMatch.set(false);
    }
  }

  async saveResult(match: Match): Promise<void> {
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

    this.savingMatchId.set(match.id);

    try {
      await this.matches.setOfficialResult(match.id, homeGoals, awayGoals);
      this.successMessage.set('Risultato ufficiale salvato correttamente.');
    } catch (error) {
      console.error('Errore salvataggio risultato:', error);
      this.errorMessage.set('Risultato non salvato. Verifica di avere ruolo admin e rules corrette.');
    } finally {
      this.savingMatchId.set(null);
    }
  }

  async importGroupStage2026(): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');
    this.creatingMatch.set(true);

    try {
      const count = await this.matches.importWorldCup2026GroupStageMatches();
      this.successMessage.set(`Import completato: ${count} partite della fase a gironi create/aggiornate.`);
    } catch (error) {
      console.error('Errore import calendario:', error);
      this.errorMessage.set('Import non riuscito. Verifica ruolo admin e Firestore Rules.');
    } finally {
      this.creatingMatch.set(false);
    }
  }

  async addTeamEvent(): Promise<void> {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (this.teamEventForm.invalid) {
      this.teamEventForm.markAllAsTouched();
      this.errorMessage.set('Seleziona partita, squadra e bonus/malus.');
      return;
    }

    const value = this.teamEventForm.getRawValue();

    try {
      await this.teamEvents.addTeamEvent(
        value.matchId,
        value.teamName,
        value.ruleId
      );

      this.successMessage.set('Bonus/Malus squadra inserito correttamente.');

      this.teamEventForm.reset({
        matchId: '',
        teamName: '',
        ruleId: ''
      });
    } catch (error) {
      console.error('Errore inserimento bonus/malus:', error);
      this.errorMessage.set('Bonus/Malus non inserito. Verifica ruolo admin e rules.');
    }
  }
}
