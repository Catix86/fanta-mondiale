export const TEAM_FLAG_CODES: Record<string, string> = {
    'Argentina': 'ar',
    'Algeria': 'dz',
    'Australia': 'au',
    'Austria': 'at',
    'Belgio': 'be',
    'Bosnia ed Erzegovina': 'ba',
    'Brasile': 'br',
    'Capo Verde': 'cv',
    'Canada': 'ca',
    'Colombia': 'co',
    'RD Congo': 'cd',
    'RD del Congo': 'cd',
    'Costa d’Avorio': 'ci',
    'Croazia': 'hr',
    'Curaçao': 'cw',
    'Repubblica Ceca': 'cz',
    'Ecuador': 'ec',
    'Egitto': 'eg',
    'Inghilterra': 'gb-eng',
    'Francia': 'fr',
    'Germania': 'de',
    'Ghana': 'gh',
    'Haiti': 'ht',
    'Iran': 'ir',
    'Iraq': 'iq',
    'Giappone': 'jp',
    'Giordania': 'jo',
    'Corea del Sud': 'kr',
    'Messico': 'mx',
    'Marocco': 'ma',
    'Paesi Bassi': 'nl',
    'Nuova Zelanda': 'nz',
    'Norvegia': 'no',
    'Panama': 'pa',
    'Paraguay': 'py',
    'Portogallo': 'pt',
    'Qatar': 'qa',
    'Arabia Saudita': 'sa',
    'Scozia': 'gb-sct',
    'Senegal': 'sn',
    'Sudafrica': 'za',
    'Spagna': 'es',
    'Svezia': 'se',
    'Svizzera': 'ch',
    'Tunisia': 'tn',
    'Turchia': 'tr',
    'Uruguay': 'uy',
    'Stati Uniti': 'us',
    'Uzbekistan': 'uz'
};

export function getTeamFlagCode(teamName: string | undefined | null): string | null {
    if (!teamName) {
        return null;
    }

    return TEAM_FLAG_CODES[teamName] ?? null;
}

export function getTeamFlagPath(teamName: string | undefined | null): string {
    const code = getTeamFlagCode(teamName);

    if (!code) {
        return 'assets/icons/favicon.svg';
    }

    return `assets/flags/${code}.svg`;
}