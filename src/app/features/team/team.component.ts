import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserTeamService } from '../../core/services/user-team.service';
import { TeamEventService } from '../../core/services/team-event.service';
import { UserTeam } from '../../core/models/user-team.model';
import { TeamEvent } from '../../core/models/team-event.model';
import {
    FANTATEAM_BUDGET,
    FANTATEAM_TEAM_SIZE,
    FANTATEAM_PRICES,
    calculateFantaTeamBudget,
    getFantaTeamPrice
} from '../../core/constants/fantateam-prices';
import { FANTATEAM_RULES } from '../../core/constants/fantateam-rules';
import { TeamFlagPipe } from '../../shared/pipes/team-flag.pipe';

interface TeamScoreView {
    teamName: string;
    price: number;
    isCaptain: boolean;
    basePoints: number;
    finalPoints: number;
    events: TeamEvent[];
}

@Component({
    standalone: true,
    imports: [FormsModule, TeamFlagPipe],
    templateUrl: './team.component.html',
    styleUrl: './team.component.scss'
})
export class TeamComponent {
    private auth = inject(AuthService);
    private userTeamService = inject(UserTeamService);
    private teamEventService = inject(TeamEventService);
    private destroyRef = inject(DestroyRef);

    budget = FANTATEAM_BUDGET;
    teamSize = FANTATEAM_TEAM_SIZE;
    prices = FANTATEAM_PRICES;
    rules = FANTATEAM_RULES;

    loading = signal(false);
    successMessage = signal('');
    errorMessage = signal('');
    rulesModalOpen = signal(false);
    myTeam = signal<UserTeam | undefined>(undefined);
    teamEvents = signal<TeamEvent[]>([]);

    selectedTeams: string[] = [];
    selectedCaptain = '';

    openRulesModal(): void {
        this.rulesModalOpen.set(true);
    }

    closeRulesModal(): void {
        this.rulesModalOpen.set(false);
    }

    constructor() {
        this.auth.firebaseUser$
            .pipe(
                switchMap(user => {
                    if (!user) {
                        return of(undefined);
                    }

                    return this.userTeamService.getMyTeam(user.uid);
                }),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(team => {
                this.myTeam.set(team);

                if (team) {
                    this.selectedTeams = team.teams;
                    this.selectedCaptain = team.captainTeam;
                }
            });

        this.teamEventService.getTeamEvents()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(events => {
                this.teamEvents.set(events);
            });
    }

    toggleTeam(teamName: string): void {
        if (this.myTeam()) {
            return;
        }

        if (this.selectedTeams.includes(teamName)) {
            this.selectedTeams = this.selectedTeams.filter(team => team !== teamName);

            if (this.selectedCaptain === teamName) {
                this.selectedCaptain = '';
            }

            return;
        }

        if (this.selectedTeams.length >= this.teamSize) {
            this.errorMessage.set(`Puoi scegliere massimo ${this.teamSize} squadre.`);
            return;
        }

        this.selectedTeams = [...this.selectedTeams, teamName];
        this.errorMessage.set('');
    }

    isSelected(teamName: string): boolean {
        return this.selectedTeams.includes(teamName);
    }

    usedBudget(): number {
        return calculateFantaTeamBudget(this.selectedTeams);
    }

    remainingBudget(): number {
        return this.budget - this.usedBudget();
    }

    canSaveTeam(): boolean {
        return this.selectedTeams.length === this.teamSize &&
            Boolean(this.selectedCaptain) &&
            this.usedBudget() <= this.budget &&
            !this.myTeam();
    }

    async saveTeam(): Promise<void> {
        this.successMessage.set('');
        this.errorMessage.set('');

        if (!this.canSaveTeam()) {
            this.errorMessage.set('Controlla numero squadre, capitano e budget.');
            return;
        }

        this.loading.set(true);

        try {
            await this.userTeamService.saveMyTeam(this.selectedTeams, this.selectedCaptain);
            this.successMessage.set('Squadra salvata correttamente.');
        } catch (error: any) {
            console.error('Errore salvataggio squadra:', error);
            this.errorMessage.set(error?.message || 'Squadra non salvata.');
        } finally {
            this.loading.set(false);
        }
    }

    teamScores(): TeamScoreView[] {
        const team = this.myTeam();

        if (!team) {
            return [];
        }

        const result = team.teams.map(teamName => {
            const events = this.teamEvents().filter(event => event.teamName === teamName);
            const basePoints = events.reduce((total, event) => total + event.points, 0);
            const isCaptain = team.captainTeam === teamName;

            return {
                teamName,
                price: getFantaTeamPrice(teamName),
                isCaptain,
                basePoints,
                finalPoints: isCaptain ? basePoints * 2 : basePoints,
                events
            };
        });

        // ordina le squadre, prima il capitano, poi per punti, poi per CF
        const orderedResult = result.sort((a, b) => {
            if (a.isCaptain && !b.isCaptain) {
                return -1;
            } else if (!a.isCaptain && b.isCaptain) {
                return 1;
            } else if (b.finalPoints !== a.finalPoints) {
                return b.finalPoints - a.finalPoints;
            } else if (b.price !== a.price) {
                return b.price - a.price;
            } else {
                return a.teamName.localeCompare(b.teamName);
            }
        });

        return orderedResult;
    }

    totalTeamPoints(): number {
        return this.teamScores().reduce((total, team) => total + team.finalPoints, 0);
    }

    categoryLabel(category: string): string {
        if (category === 'attack') return '⚽ Attacco e Spettacolo';
        if (category === 'defense') return '🛡️ Difesa e Resistenza';
        if (category === 'pop') return '🎭 Pop & Trash';
        if (category === 'malus') return '🛑 Malus';
        if (category === 'knockout') return '🏆 Fase a Eliminazione Diretta';

        return category;
    }
}