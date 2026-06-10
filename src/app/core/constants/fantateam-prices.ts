export interface FantaTeamPrice {
    teamName: string;
    price: number;
    tier: 1 | 2 | 3 | 4 | 5;
}

export const FANTATEAM_BUDGET = 100;
export const FANTATEAM_TEAM_SIZE = 6;

export const FANTATEAM_PRICES: FantaTeamPrice[] = [
    { teamName: 'Argentina', price: 38, tier: 1 },
    { teamName: 'Francia', price: 38, tier: 1 },
    { teamName: 'Brasile', price: 35, tier: 1 },
    { teamName: 'Inghilterra', price: 35, tier: 1 },
    { teamName: 'Spagna', price: 35, tier: 1 },

    { teamName: 'Portogallo', price: 25, tier: 2 },
    { teamName: 'Paesi Bassi', price: 24, tier: 2 },
    { teamName: 'Germania', price: 23, tier: 2 },
    { teamName: 'Belgio', price: 22, tier: 2 },
    { teamName: 'Croazia', price: 22, tier: 2 },
    { teamName: 'Uruguay', price: 21, tier: 2 },
    { teamName: 'Colombia', price: 20, tier: 2 },

    { teamName: 'Marocco', price: 15, tier: 3 },
    { teamName: 'Stati Uniti', price: 14, tier: 3 },
    { teamName: 'Messico', price: 14, tier: 3 },
    { teamName: 'Giappone', price: 13, tier: 3 },
    { teamName: 'Senegal', price: 12, tier: 3 },
    { teamName: 'Svizzera', price: 12, tier: 3 },
    { teamName: 'Svezia', price: 12, tier: 3 },
    { teamName: 'Corea del Sud', price: 12, tier: 3 },

    { teamName: 'Australia', price: 11, tier: 4 },
    { teamName: 'Turchia', price: 10, tier: 4 },
    { teamName: 'Austria', price: 9, tier: 4 },
    { teamName: 'Repubblica Ceca', price: 9, tier: 4 },
    { teamName: 'Canada', price: 9, tier: 4 },
    { teamName: 'Ecuador', price: 9, tier: 4 },
    { teamName: 'Norvegia', price: 8, tier: 4 },
    { teamName: 'Costa d\'Avorio', price: 8, tier: 4 },
    { teamName: 'Paraguay', price: 8, tier: 4 },
    { teamName: 'Scozia', price: 8, tier: 4 },
    { teamName: 'Egitto', price: 8, tier: 4 },
    { teamName: 'Algeria', price: 8, tier: 4 },
    { teamName: 'Bosnia ed Erzegovina', price: 7, tier: 4 },
    { teamName: 'Tunisia', price: 7, tier: 4 },
    { teamName: 'Ghana', price: 7, tier: 4 },
    { teamName: 'Sudafrica', price: 7, tier: 4 },
    { teamName: 'RD del Congo', price: 7, tier: 4 },

    { teamName: 'Iran', price: 5, tier: 5 },
    { teamName: 'Qatar', price: 5, tier: 5 },
    { teamName: 'Arabia Saudita', price: 5, tier: 5 },
    { teamName: 'Uzbekistan', price: 4, tier: 5 },
    { teamName: 'Giordania', price: 4, tier: 5 },
    { teamName: 'Panama', price: 4, tier: 5 },
    { teamName: 'Iraq', price: 4, tier: 5 },
    { teamName: 'Capo Verde', price: 3, tier: 5 },
    { teamName: 'Curaçao', price: 3, tier: 5 },
    { teamName: 'Haiti', price: 3, tier: 5 },
    { teamName: 'Nuova Zelanda', price: 2, tier: 5 }
];

export function getFantaTeamPrice(teamName: string): number {
    return FANTATEAM_PRICES.find(team => team.teamName === teamName)?.price ?? 999;
}

export function calculateFantaTeamBudget(teams: string[]): number {
    return teams.reduce((total, teamName) => total + getFantaTeamPrice(teamName), 0);
}