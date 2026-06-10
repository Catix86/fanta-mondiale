$ErrorActionPreference = "Stop"

$flagsDir = "src/assets/flags"

if (!(Test-Path $flagsDir)) {
    New-Item -ItemType Directory -Path $flagsDir -Force | Out-Null
}

$flags = @(
    "ar",      # Argentina
    "dz",      # Algeria
    "au",      # Australia
    "at",      # Austria
    "be",      # Belgio
    "ba",      # Bosnia ed Erzegovina
    "br",      # Brasile
    "cv",      # Capo Verde
    "ca",      # Canada
    "co",      # Colombia
    "cd",      # RD Congo
    "ci",      # Costa d'Avorio
    "hr",      # Croazia
    "cw",      # Curaçao
    "cz",      # Repubblica Ceca
    "ec",      # Ecuador
    "eg",      # Egitto
    "gb-eng",  # Inghilterra
    "fr",      # Francia
    "de",      # Germania
    "gh",      # Ghana
    "ht",      # Haiti
    "ir",      # Iran
    "iq",      # Iraq
    "jp",      # Giappone
    "jo",      # Giordania
    "kr",      # Corea del Sud
    "mx",      # Messico
    "ma",      # Marocco
    "nl",      # Paesi Bassi
    "nz",      # Nuova Zelanda
    "no",      # Norvegia
    "pa",      # Panama
    "py",      # Paraguay
    "pt",      # Portogallo
    "qa",      # Qatar
    "sa",      # Arabia Saudita
    "gb-sct",  # Scozia
    "sn",      # Senegal
    "za",      # Sudafrica
    "es",      # Spagna
    "se",      # Svezia
    "ch",      # Svizzera
    "tn",      # Tunisia
    "tr",      # Turchia
    "uy",      # Uruguay
    "us",      # Stati Uniti
    "uz"       # Uzbekistan
)

foreach ($flag in $flags) {
    $url = "https://hatscripts.github.io/circle-flags/flags/$flag.svg"
    $out = "$flagsDir/$flag.svg"

    Write-Host "Downloading $flag..."
    Invoke-WebRequest -Uri $url -OutFile $out
}

Write-Host "Done. Flags saved in $flagsDir"