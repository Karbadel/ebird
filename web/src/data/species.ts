// Ficha de la especie — datos citables de fuentes oficiales/verificables.
// Fuente principal (Chile): MMA, Reglamento de Clasificación de Especies (RCE),
// 15° Proceso (2018), ficha de Vultur gryphus (autor: Eduardo Pavez, UNORCH/AvesChile).
// Estado global: UICN/BirdLife. Imagen: Wikimedia Commons (CC-BY-4.0).

export interface SpeciesFact { k: string; v: string }
export interface SpeciesLink { label: string; url: string }

export const SPECIES = {
  sci: 'Vultur gryphus',
  common: 'Cóndor andino',
  family: 'Cathartidae (buitres del Nuevo Mundo)',

  // Estado de conservación (verificado — no de memoria)
  statusChile: 'Casi Amenazada (NT)',
  statusChileNote: 'RCE · MMA Chile, 15° Proceso (2018)',
  statusGlobal: 'Vulnerable (VU)',
  statusGlobalNote: 'UICN / BirdLife',
  monument: 'Monumento Natural (Chile, 2006)',

  facts: [
    { k: 'Peso', v: 'Macho 11–15 kg (con cresta) · Hembra 8–11 kg' },
    { k: 'Madurez sexual', v: '6 años; primera puesta a los 8+' },
    { k: 'Reproducción', v: 'Monógamo de por vida · 1 huevo · cría cada ~2 años' },
    { k: 'Dieta', v: 'Carroñero; hoy depende del ganado doméstico' },
    { k: 'Distribución', v: 'Venezuela a Cabo de Hornos; en Chile, todo el territorio' },
    { k: 'Población en Chile', v: '~24.600 est. (Pavez 2012) · ~19.500 maduros' },
  ] as SpeciesFact[],

  threats:
    'Casi todas las amenazas son de origen humano: caza, cebos tóxicos, intoxicación en rellenos sanitarios, plomo (municiones) y colisión con tendidos eléctricos. Este portal se enfoca en una amenaza emergente: la colisión con aerogeneradores.',

  image: {
    src: 'img/condor.jpg',
    author: 'Camilo 24CH',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Condor_Andino_de_perfil.jpg',
  },

  sources: [
    { label: 'Ficha RCE — MMA Chile (clasificación de especies)', url: 'https://clasificacionespecies.mma.gob.cl/' },
    { label: 'BirdLife DataZone — Andean Condor', url: 'https://datazone.birdlife.org/species/factsheet/andean-condor-vultur-gryphus' },
    { label: 'eBird — Cóndor andino (andcon1)', url: 'https://ebird.org/species/andcon1' },
  ] as SpeciesLink[],
};
