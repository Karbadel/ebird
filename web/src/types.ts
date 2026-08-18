export type Group = 'acuatica' | 'marina' | 'rapaz' | 'passer' | 'loro' | 'otra';

export type Category = 'especie' | 'exótica';

export interface Observation {
  es: string;
  en: string;
  sci: string;
  grp: Group;
  order: string;
  family: string;
  cat: Category;
  lat: number;
  lng: number;
  region: string;
  loc: string;
  date: string;
  count: number;
  obs: string;
  valid: boolean;
  rev: boolean;
  exo: boolean;
  sub: string;
  notable: boolean;
}

export interface GroupMeta {
  color: string;
  label: string;
  glyph: string;
}

export const GROUPS: Record<Group, GroupMeta> = {
  acuatica: { color: '#2c6a5b', label: 'Acuáticas', glyph: '🦢' },
  marina:   { color: '#35617a', label: 'Marinas / costeras', glyph: '🐧' },
  rapaz:    { color: '#a4441e', label: 'Rapaces', glyph: '🦅' },
  passer:   { color: '#6f7a45', label: 'Passeriformes', glyph: '🐦' },
  loro:     { color: '#c07a2b', label: 'Loros', glyph: '🦜' },
  otra:     { color: '#4c5347', label: 'Otras', glyph: '🪶' },
};
