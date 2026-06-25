export type FantaTeamRuleCategory =
    | 'attack'
    | 'defense'
    | 'pop'
    | 'malus'
    | 'knockout';

export interface FantaTeamRule {
    id: string;
    category: FantaTeamRuleCategory;
    points: number;
    label: string;
    description: string;
}

export const FANTATEAM_RULES: FantaTeamRule[] = [
    {
        id: 'muso-corto',
        category: 'attack',
        points: 2,
        label: 'Muso corto',
        description: 'La squadra vince con un solo goal di scarto.'
    },
    {
        id: 'goleada',
        category: 'attack',
        points: 10,
        label: 'Goleada',
        description: 'La squadra segna 3 o più gol nella stessa partita.'
    },
    {
        id: 'panchina-oro',
        category: 'attack',
        points: 5,
        label: 'Panchina d’oro',
        description: 'La squadra segna con un giocatore subentrato dalla panchina.'
    },
    {
        id: 'eurogol',
        category: 'attack',
        points: 5,
        label: 'Eurogol',
        description: 'Un gol viene segnato da fuori area o in rovesciata.'
    },
    {
        id: 'davide-contro-golia',
        category: 'attack',
        points: 15,
        label: 'Davide contro Golia',
        description: 'La squadra vince contro una nazionale che ha almeno 15 posizioni in più nel Ranking FIFA.'
    },
    {
        id: 'rigore-procurato',
        category: 'attack',
        points: 3,
        label: 'Il massimo castigo',
        description: 'Alla squadra viene assegnato un calcio di rigore.'
    },
    {
        id: 'difesa-ferro',
        category: 'defense',
        points: 10,
        label: 'Difesa di ferro',
        description: 'La squadra finisce la partita senza subire gol.'
    },
    {
        id: 'mani-di-fata',
        category: 'defense',
        points: 8,
        label: 'Mani di Fata',
        description: 'Il portiere della squadra para un calcio di rigore.'
    },
    {
        id: 'noia-mortale',
        category: 'defense',
        points: 2,
        label: 'Noia mortale',
        description: 'La partita finisce 0-0.'
    },
    {
        id: 'buona-condotta',
        category: 'pop',
        points: 10,
        label: 'Buona condotta',
        description: 'La squadra non riceve nessun cartellino giallo o rosso.'
    },
    {
        id: 'legno',
        category: 'pop',
        points: 5,
        label: 'Il Legno',
        description: 'La squadra colpisce un palo o una traversa.'
    },
    {
        id: 'freekick',
        category: 'pop',
        points: 10,
        label: 'Pennellata vincente',
        description: 'La squadra segna un gol direttamente da calcio di punizione.'
    },
    {
        id: 'invasione-campo',
        category: 'pop',
        points: 30,
        label: 'Ultras fuori programma',
        description: 'Un tifoso con la maglia o la bandiera della squadra invade il campo.'
    },
    {
        id: 'esultanza-volgare',
        category: 'pop',
        points: 5,
        label: 'Celebrazione iconica',
        description: 'Il giocatore che segna esulta in maniera un po’ particolare.'
    },
    {
        id: 'danza-vittoria',
        category: 'pop',
        points: 10,
        label: 'Danza della Vittoria',
        description: 'I giocatori ballano insieme dopo aver segnato un gol.'
    },
    {
        id: 'doppietta',
        category: 'pop',
        points: 20,
        label: 'Doppietta',
        description: 'Un giocato della squadra fa una doppietta.'
    },
    {
        id: 'hat-trick',
        category: 'pop',
        points: 30,
        label: 'Hat Trick',
        description: 'Un giocato della squadra fa una tripletta.'
    },
    {
        id: 'furia',
        category: 'knockout',
        points: 10,
        label: 'Furia',
        description: 'La squadra segna 10 o più goal nei gironi'
    },
    {
        id: 'corazzata',
        category: 'knockout',
        points: 10,
        label: 'Corazzata',
        description: 'La squadra non sobisce nemmeno un goal nei gironi'
    },
    {
        id: 'passaggio-turno',
        category: 'knockout',
        points: 10,
        label: 'Passaggio del turno',
        description: 'La squadra si qualifica a ottavi/quarti/semifinali.'
    },
    {
        id: 'passaggio-gironi',
        category: 'knockout',
        points: 10,
        label: 'Girone di ferro',
        description: 'La squadra si qualifica ai sedicesimi'
    },
    {
        id: 'leader',
        category: 'knockout',
        points: 15,
        label: 'Leader',
        description: 'La squadra passa i gironi come prima'
    },
    {
        id: 'leader-full',
        category: 'knockout',
        points: 20,
        label: 'Prima della classe',
        description: 'La squadra passa i gironi come prima a punteggio pieno'
    },
    {
        id: 'sangue-freddo',
        category: 'knockout',
        points: 15,
        label: 'Sangue freddo',
        description: 'La squadra vince la partita alla lotteria dei calci di rigore.'
    },
    {
        id: 'goleador',
        category: 'knockout',
        points: 15,
        label: 'Goleador',
        description: 'La squadra ha il capocannoniere del torneo'
    },
    {
        id: 'campione-mondo',
        category: 'knockout',
        points: 100,
        label: 'Campione del Mondo',
        description: 'La squadra alza la coppa.'
    },
    //#region MALUS
    {
        id: 'sconfitta',
        category: 'malus',
        points: -5,
        label: 'Sconfitta',
        description: 'La squadra perde miseramente la partita.'
    },
    {
        id: 'autogol',
        category: 'malus',
        points: -5,
        label: 'Fuoco amico',
        description: 'Un giocatore della squadra fa autogol.'
    },
    {
        id: 'imbarcata',
        category: 'malus',
        points: -10,
        label: 'Imbarcata',
        description: 'La squadra subisce 3 o più gol nella stessa partita.'
    },
    {
        id: 'recidivo',
        category: 'malus',
        points: -2,
        label: 'Recidivo',
        description: 'Un giocatore prende un cartellino rosso per somma di ammonizioni.'
    },
    {
        id: 'cattiva-condotta',
        category: 'malus',
        points: -3,
        label: 'Cattiva condotta',
        description: 'Un giocatore della squadra prende un cartellino rosso diretto.'
    },
    {
        id: 'cagata-difensiva',
        category: 'malus',
        points: -5,
        label: 'Cagata difensiva',
        description: 'Un giocatore della squadra commette un errore che porta alla realizzazione di un gol avversario.'
    },
    {
        id: 'nervi-tesi',
        category: 'malus',
        points: -8,
        label: 'Nervi tesi',
        description: 'L’allenatore della squadra viene espulso dall’arbitro.'
    },
    {
        id: 'rigore-fallito',
        category: 'malus',
        points: -5,
        label: 'Dischetto amaro',
        description: 'La squadra non segna un rigore.'
    },
    {
        id: 'illusione-var',
        category: 'malus',
        points: -5,
        label: 'Illusione VAR',
        description: 'La squadra esulta per un gol che viene poi annullato dal VAR dopo un controllo.'
    },
    {
        id: 'smircio',
        category: 'knockout',
        points: -15,
        label: 'Smircio',
        description: 'La squadra non riesce a segnare neanche un goal nei gironi.'
    },
    {
        id: 'groviera',
        category: 'knockout',
        points: -15,
        label: 'Groviera',
        description: 'La squadra subisce 10 o più goal nei gironi.'
    },
    {
        id: 'disfatta',
        category: 'knockout',
        points: -10,
        label: 'Disfatta',
        description: 'La squadra perde la partita alla lotteria dei calci di rigore.'
    },
    {
        id: 'delusione',
        category: 'knockout',
        points: -10,
        label: 'Delusione',
        description: 'La squadra non supera i gironi.'
    },
    {
        id: 'vergogna',
        category: 'knockout',
        points: -20,
        label: 'Vergogna',
        description: 'La squadra non supera i gironi a 0 punti.'
    }
    //#endregion
];

export function getFantaTeamRule(ruleId: string): FantaTeamRule | undefined {
    return FANTATEAM_RULES.find(rule => rule.id === ruleId);
}