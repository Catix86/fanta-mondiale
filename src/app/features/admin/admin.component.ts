import { Component, DestroyRef, inject, signal } from '@angular/core';
import { shareReplay, tap } from 'rxjs';
import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatchService } from '../../core/services/match.service';
import { Match, MatchStage } from '../../core/models/match.model';
import { WORLD_CUP_TEAMS } from '../../core/constants/teams';
import { TeamEventService } from '../../core/services/team-event.service';
import { FANTATEAM_RULES } from '../../core/constants/fantateam-rules';
import { ToastService } from '../../core/services/toast.service';

@Component({
  standalone: true,
  imports: [AsyncPipe, DatePipe, FormsModule, NgClass, ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  private matches = inject(MatchService);
  private fb = inject(FormBuilder);
  private teamEvents = inject(TeamEventService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  teams = WORLD_CUP_TEAMS;
  rules = FANTATEAM_RULES;

  private currentMatches: Match[] = [];

  matches$ = this.matches.getMatches().pipe(
    tap(matches => {
      this.currentMatches = matches;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  savingMatchId = signal<string | null>(null);
  creatingMatch = signal(false);

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

  teamEventForm = this.fb.nonNullable.group({
    matchId: ['', Validators.required],
    teamName: ['', Validators.required],
    ruleIds: [[] as string[], Validators.required]
  });

  drafts: Record<string, { home: number; away: number }> = {};

  constructor() {
    this.teamEventForm.controls.matchId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.teamEventForm.controls.teamName.setValue('');
      });
  }

  draft(matchId: string): { home: number; away: number } {
    if (!this.drafts[matchId]) {
      this.drafts[matchId] = { home: 0, away: 0 };
    }

    return this.drafts[matchId];
  }

  matchDate(match: Match): Date {
    const kickoffAt: any = match.kickoffAt;

    if (kickoffAt?.toDate) {
      return kickoffAt.toDate();
    }

    return new Date(kickoffAt);
  }

  selectedMatchTeams(): string[] {
    const matchId = this.teamEventForm.controls.matchId.value;

    if (!matchId) {
      return [];
    }

    const match = this.currentMatches.find(item => item.id === matchId);

    if (!match) {
      return [];
    }

    return Array.from(new Set([
      match.homeTeam,
      match.awayTeam
    ]));
  }

  selectedRuleIds(): string[] {
    return this.teamEventForm.controls.ruleIds.value;
  }

  isRuleSelected(ruleId: string): boolean {
    return this.selectedRuleIds().includes(ruleId);
  }

  toggleRule(ruleId: string): void {
    const current = this.selectedRuleIds();

    const next = current.includes(ruleId)
      ? current.filter(id => id !== ruleId)
      : [...current, ruleId];

    this.teamEventForm.controls.ruleIds.setValue(next);
    this.teamEventForm.controls.ruleIds.markAsDirty();
    this.teamEventForm.controls.ruleIds.markAsTouched();
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
    if (this.createMatchForm.invalid) {
      this.createMatchForm.markAllAsTouched();
      this.toast.show('Compila squadre, fase e data/ora.', 'error');
      return;
    }

    const value = this.createMatchForm.getRawValue();

    if (!value.homeTeam || !value.awayTeam) {
      this.toast.show('Seleziona entrambe le squadre.', 'error');
      return;
    }

    if (value.homeTeam.trim().toLowerCase() === value.awayTeam.trim().toLowerCase()) {
      this.toast.show('Le due squadre devono essere diverse.', 'error');
      return;
    }

    const kickoffAt = new Date(value.kickoffAt);

    if (Number.isNaN(kickoffAt.getTime())) {
      this.toast.show('Data e ora non valide.', 'error');
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

      this.toast.show('Match creato correttamente.');
      this.createMatchForm.reset({
        homeTeam: '',
        awayTeam: '',
        group: '',
        stage: 'group',
        kickoffAt: ''
      });
    } catch (error) {
      console.error('Errore creazione match:', error);
      this.toast.show('Match non creato. Verifica ruolo admin e regole Firestore.', 'error');
    } finally {
      this.creatingMatch.set(false);
    }
  }

  async saveResult(match: Match): Promise<void> {
    const draft = this.draft(match.id);
    const homeGoals = Number(draft.home);
    const awayGoals = Number(draft.away);

    if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals)) {
      this.toast.show('Inserisci un risultato valido.', 'error');
      return;
    }

    if (homeGoals < 0 || awayGoals < 0 || homeGoals > 30 || awayGoals > 30) {
      this.toast.show('Il risultato deve essere tra 0 e 30.', 'error');
      return;
    }

    this.savingMatchId.set(match.id);

    try {
      await this.matches.setOfficialResult(match.id, homeGoals, awayGoals);
      this.toast.show('Risultato ufficiale salvato correttamente.');
    } catch (error) {
      console.error('Errore salvataggio risultato:', error);
      this.toast.show('Risultato non salvato. Verifica ruolo admin e rules corrette.', 'error');
    } finally {
      this.savingMatchId.set(null);
    }
  }

  async importGroupStage2026(): Promise<void> {
    this.creatingMatch.set(true);

    try {
      const count = await this.matches.importWorldCup2026GroupStageMatches();
      this.toast.show(`Import completato: ${count} partite create/aggiornate.`);
    } catch (error) {
      console.error('Errore import calendario:', error);
      this.toast.show('Import non riuscito. Verifica ruolo admin e Firestore Rules.', 'error');
    } finally {
      this.creatingMatch.set(false);
    }
  }

  async addTeamEvent(): Promise<void> {
    if (this.teamEventForm.invalid || this.selectedRuleIds().length === 0) {
      this.teamEventForm.markAllAsTouched();
      this.toast.show('Seleziona partita, squadra e almeno un bonus/malus.', 'error');
      return;
    }

    const value = this.teamEventForm.getRawValue();

    try {
      await Promise.all(
        value.ruleIds.map(ruleId =>
          this.teamEvents.addTeamEvent(
            value.matchId,
            value.teamName,
            ruleId
          )
        )
      );

      this.toast.show(`${value.ruleIds.length} bonus/malus inseriti correttamente.`);

      this.teamEventForm.reset({
        matchId: '',
        teamName: '',
        ruleIds: []
      });
    } catch (error) {
      console.error('Errore inserimento bonus/malus:', error);
      this.toast.show('Bonus/Malus non inseriti. Verifica ruolo admin e rules.', 'error');
    }
  }
}