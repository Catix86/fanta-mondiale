import { TeamEvent } from "./team-event.model";

export interface AppUserRow {
    uid: string;
    username: string;
    championPick: string;
}

export interface WorldCupSettings {
    winner?: string;
}

export interface TeamEventView extends TeamEvent {
    matchLabel: string;
    computedPoints: number;
}

export interface TeamScoreView {
    teamName: string;
    price: number;
    isCaptain: boolean;
    basePoints: number;
    finalPoints: number;
    events: TeamEventView[];
}

export interface LeaderboardRow {
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