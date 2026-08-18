/** Normaliza texto para búsqueda: sin acentos, en minúsculas, sin espacios extra.
 *  "Cóndor Andino" -> "condor andino"; "Ñielol" -> "nielol". */
export const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
