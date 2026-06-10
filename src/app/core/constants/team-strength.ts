export const TEAM_STRENGTH: Record<string, number> = {
    'Argentina': 94,
    'Brasile': 94,
    'Francia': 95,
    'Inghilterra': 91,
    'Spagna': 90,
    'Germania': 88,
    'Portogallo': 89,
    'Paesi Bassi': 87,
    'Belgio': 84,
    'Croazia': 82,
    'Uruguay': 82,
    'Colombia': 81,
    'Marocco': 80,
    'Svizzera': 79,
    'Norvegia': 78,
    'Giappone': 78,
    'Senegal': 78,
    'Messico': 77,
    'Stati Uniti': 76,
    'Turchia': 76,
    'Svezia': 76,
    'Repubblica Ceca': 75,
    'Ecuador': 75,
    'Algeria': 74,
    'Costa d’Avorio': 74,
    'Corea del Sud': 74,
    'Scozia': 73,
    'Egitto': 73,
    'Canada': 72,
    'Australia': 72,
    'Paraguay': 72,
    'Ghana': 72,
    'Bosnia ed Erzegovina': 71,
    'Iran': 70,
    'Tunisia': 70,
    'RD Congo': 67,
    'Qatar': 66,
    'Arabia Saudita': 66,
    'Sudafrica': 66,
    'Uzbekistan': 64,
    'Panama': 63,
    'Iraq': 62,
    'Capo Verde': 61,
    'Nuova Zelanda': 60,
    'Giordania': 58,
    'Haiti': 56,
    'Curaçao': 55
};

const TEAM_ALIASES: Record<string, string> = {
    'Brazil': 'Brasile',
    'France': 'Francia',
    'England': 'Inghilterra',
    'Spain': 'Spagna',
    'Germany': 'Germania',
    'Portugal': 'Portogallo',
    'Netherlands': 'Paesi Bassi',
    'Belgium': 'Belgio',
    'Croatia': 'Croazia',
    'Switzerland': 'Svizzera',
    'Japan': 'Giappone',
    'Morocco': 'Marocco',
    'Mexico': 'Messico',
    'Türkiye': 'Turchia',
    'Turkey': 'Turchia',
    'Korea Republic': 'Corea del Sud',
    'Czechia': 'Repubblica Ceca',
    'South Africa': 'Sudafrica',
    'Bosnia and Herzegovina': 'Bosnia ed Erzegovina',
    'Côte d’Ivoire': 'Costa d’Avorio',
    'Ivory Coast': 'Costa d’Avorio',
    'Saudi Arabia': 'Arabia Saudita',
    'New Zealand': 'Nuova Zelanda',
    'Congo DR': 'RD Congo',
    'Cape Verde': 'Capo Verde'
};

export function canonicalTeamName(teamName: string): string {
    return TEAM_ALIASES[teamName] ?? teamName;
}

export function getTeamStrength(teamName: string): number {
    const canonical = canonicalTeamName(teamName);
    return TEAM_STRENGTH[canonical] ?? 70;
}

export function sameTeam(teamA: string | undefined, teamB: string | undefined): boolean {
    if (!teamA || !teamB) {
        return false;
    }

    return canonicalTeamName(teamA) === canonicalTeamName(teamB);
}