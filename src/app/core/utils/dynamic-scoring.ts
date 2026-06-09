import { Match } from '../models/match.model';
import { Prediction } from '../models/prediction.model';
import { getTeamStrength, sameTeam } from '../constants/team-strength';

export interface MatchOutcomePoints {
    homeWinPoints: number;
    drawPoints: number;
    awayWinPoints: number;
}

export interface PredictionScoreResult {
    points: number;
    exactResult: boolean;
    correctOutcome: boolean;
    outcomePoints: number;
    exactBonus: number;
}

const MIN_OUTCOME_POINTS = 4;
const MAX_OUTCOME_POINTS = 18;

const MIN_EXACT_BONUS = 10;
const MAX_EXACT_BONUS = 24;
const EXACT_BONUS_BASE = 6;

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function getOutcome(homeGoals: number, awayGoals: number): '1' | 'X' | '2' {
    if (homeGoals > awayGoals) return '1';
    if (homeGoals < awayGoals) return '2';
    return 'X';
}

export function getMatchOutcomePoints(match: Match): MatchOutcomePoints {
    const homeStrength = getTeamStrength(match.homeTeam);
    const awayStrength = getTeamStrength(match.awayTeam);

    const strengthDiff = homeStrength - awayStrength;

    const homeWinPoints = clamp(
        Math.round(6 - strengthDiff / 5),
        MIN_OUTCOME_POINTS,
        MAX_OUTCOME_POINTS
    );

    const awayWinPoints = clamp(
        Math.round(6 + strengthDiff / 5),
        MIN_OUTCOME_POINTS,
        MAX_OUTCOME_POINTS
    );

    const drawPoints = clamp(
        Math.round(7 + Math.abs(strengthDiff) / 10),
        6,
        12
    );

    return {
        homeWinPoints,
        drawPoints,
        awayWinPoints
    };
}

export function getOutcomePointsForPrediction(
    match: Match,
    predictedHomeGoals: number,
    predictedAwayGoals: number
): number {
    const outcomePoints = getMatchOutcomePoints(match);
    const predictedOutcome = getOutcome(predictedHomeGoals, predictedAwayGoals);

    if (predictedOutcome === '1') {
        return outcomePoints.homeWinPoints;
    }

    if (predictedOutcome === 'X') {
        return outcomePoints.drawPoints;
    }

    return outcomePoints.awayWinPoints;
}

export function getExactResultBonus(outcomePoints: number): number {
    return clamp(
        EXACT_BONUS_BASE + outcomePoints,
        MIN_EXACT_BONUS,
        MAX_EXACT_BONUS
    );
}

export interface PotentialPredictionPoints {
    outcome: '1' | 'X' | '2';
    outcomePoints: number;
    exactBonus: number;
    exactTotal: number;
}

export function calculatePotentialPredictionPoints(
    match: Match,
    predictedHomeGoals: number,
    predictedAwayGoals: number
): PotentialPredictionPoints {
    const outcome = getOutcome(predictedHomeGoals, predictedAwayGoals);

    const outcomePoints = getOutcomePointsForPrediction(
        match,
        predictedHomeGoals,
        predictedAwayGoals
    );

    const exactBonus = getExactResultBonus(outcomePoints);

    return {
        outcome,
        outcomePoints,
        exactBonus,
        exactTotal: outcomePoints + exactBonus
    };
}

export function calculatePredictionScore(
    match: Match,
    prediction: Prediction
): PredictionScoreResult {
    if (
        match.status !== 'finished' ||
        typeof match.officialHomeGoals !== 'number' ||
        typeof match.officialAwayGoals !== 'number'
    ) {
        return {
            points: 0,
            exactResult: false,
            correctOutcome: false,
            outcomePoints: 0,
            exactBonus: 0
        };
    }

    const officialOutcome = getOutcome(
        match.officialHomeGoals,
        match.officialAwayGoals
    );

    const predictedOutcome = getOutcome(
        prediction.predictedHomeGoals,
        prediction.predictedAwayGoals
    );

    if (officialOutcome !== predictedOutcome) {
        return {
            points: 0,
            exactResult: false,
            correctOutcome: false,
            outcomePoints: 0,
            exactBonus: 0
        };
    }

    const outcomePoints = getOutcomePointsForPrediction(
        match,
        prediction.predictedHomeGoals,
        prediction.predictedAwayGoals
    );

    const exactResult =
        prediction.predictedHomeGoals === match.officialHomeGoals &&
        prediction.predictedAwayGoals === match.officialAwayGoals;

    const exactBonus = exactResult
        ? getExactResultBonus(outcomePoints)
        : 0;

    return {
        points: outcomePoints + exactBonus,
        exactResult,
        correctOutcome: true,
        outcomePoints,
        exactBonus
    };
}

export function getChampionWinnerPoints(teamName: string): number {
    const strength = getTeamStrength(teamName);

    if (strength >= 92) return 80;
    if (strength >= 88) return 90;
    if (strength >= 82) return 110;
    if (strength >= 74) return 130;
    if (strength >= 66) return 160;

    return 200;
}

export function isSameChampionPick(
    winner: string | undefined,
    championPick: string
): boolean {
    return sameTeam(winner, championPick);
}