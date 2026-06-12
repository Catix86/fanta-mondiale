import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData
} from '@angular/fire/firestore';
import { combineLatest, map, Observable } from 'rxjs';
import { Match } from '../../core/models/match.model';
import { TeamEvent } from '../../core/models/team-event.model';
import { getFantaTeamPrice } from '../../core/constants/fantateam-prices';
import { TeamFlagPipe } from '../../shared/pipes/team-flag.pipe';
import { WORLD_CUP_TEAMS } from '../../core/constants/teams';

interface TeamEventView extends TeamEvent {
    matchLabel: string;
}

interface TeamScoreboardRow {
    teamName: string;
    price: number;
    totalPoints: number;
    bonusPoints: number;
    malusPoints: number;
    matches: number;
    events: TeamEventView[];
}

@Component({
    standalone: true,
    imports: [AsyncPipe, TeamFlagPipe],
    templateUrl: './teams.component.html',
    styleUrl: './teams.component.scss'
})
export class TeamsComponent {
    private firestore = inject(Firestore);

    private matches$ = collectionData(
        collection(this.firestore, 'matches'),
        { idField: 'id' }
    ) as Observable<Match[]>;

    private teamEvents$ = collectionData(
        collection(this.firestore, 'teamEvents'),
        { idField: 'id' }
    ) as Observable<TeamEvent[]>;

    teamsScoreboard$: Observable<TeamScoreboardRow[]> = combineLatest([
        this.matches$,
        this.teamEvents$
    ]).pipe(
        map(([matches, events]) => {
            const matchesMap = new Map<string, Match>();

            for (const match of matches) {
                matchesMap.set(match.id, match);
            }

            const teams = WORLD_CUP_TEAMS
                .map(teamName => this.buildTeamRow(teamName, events, matchesMap))
                .sort((a, b) => {
                    if (b.totalPoints !== a.totalPoints) {
                        return b.totalPoints - a.totalPoints;
                    }

                    return a.teamName.localeCompare(b.teamName, 'it');
                });

            return teams;
        })
    );

    totalEvents(rows: TeamScoreboardRow[]): number {
        return rows.reduce((total, row) => total + row.events.length, 0);
    }

    totalBonusPoints(rows: TeamScoreboardRow[]): number {
        return rows.reduce((total, row) => total + row.bonusPoints, 0);
    }

    totalMalusPoints(rows: TeamScoreboardRow[]): number {
        return rows.reduce((total, row) => total + row.malusPoints, 0);
    }

    private buildTeamRow(
        teamName: string,
        events: TeamEvent[],
        matchesMap: Map<string, Match>
    ): TeamScoreboardRow {
        const aliases = this.teamAliases(teamName);

        const teamEvents = events
            .filter(event => aliases.includes(event.teamName))
            .map(event => {
                const match = matchesMap.get(event.matchId);

                const matchLabel = match
                    ? `${match.homeTeam} - ${match.awayTeam}`
                    : 'Partita non trovata';

                return {
                    ...event,
                    matchLabel
                };
            });

        const totalPoints = teamEvents.reduce(
            (total, event) => total + event.points,
            0
        );

        const bonusPoints = teamEvents
            .filter(event => event.points > 0)
            .reduce((total, event) => total + event.points, 0);

        const malusPoints = teamEvents
            .filter(event => event.points < 0)
            .reduce((total, event) => total + event.points, 0);

        const matchesPlayed = teamEvents.length > 0 ? new Set(teamEvents.map(e => e.matchId)).size : 0;

        return {
            teamName,
            price: getFantaTeamPrice(teamName),
            totalPoints,
            bonusPoints,
            malusPoints,
            matches: matchesPlayed,
            events: teamEvents
        };
    }

    private teamAliases(teamName: string): string[] {
        const aliases: Record<string, string[]> = {
            'USA': ['USA', 'Stati Uniti'],
            'Repubblica Ceca': ['Repubblica Ceca', 'Rep. Ceca'],
            'RD Congo': ['RD Congo', 'RD del Congo'],
            'Costa d’Avorio': ['Costa d’Avorio', 'Costa d\'Avorio']
        };

        return aliases[teamName] ?? [teamName];
    }
}