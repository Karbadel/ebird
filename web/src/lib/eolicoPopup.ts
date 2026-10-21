import { EOLICO_ESTADO_COLOR } from '../data/portal';

type Props = Record<string, unknown>;

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
const num = (v: unknown, digits = 0) =>
  typeof v === 'number' ? v.toLocaleString('es-CL', { maximumFractionDigits: digits }) : '—';
// '2026-06-30' → '30-06-2026'
const fecha = (v: unknown) => {
  const m = String(v ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '30-06-2026';
};

export type EolicoTipo = 'parque' | 'aerogenerador' | 'area';

/** HTML del popup de las tres capas eólicas por estado (parques, aerogeneradores y
 *  áreas buffer 5 × diámetro de rotor). Todo el texto del dato va escapado. */
export function eolicoPopupHtml(p: Props, tipo: EolicoTipo): string {
  const color = EOLICO_ESTADO_COLOR[String(p['estado_key'] ?? '')] ?? '#8a8a8a';
  const titulo =
    tipo === 'area' ? `Área buffer 5 × diámetro de rotor · ${esc(p['nombre'])}` : esc(p['nombre']);
  const lineas: string[] = [
    `<b>${titulo}</b>`,
    `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${color};margin-right:5px"></span>${esc(p['estado'])}` +
      (p['vigente'] === false ? ' · no vigente' : ''),
    `<b>Potencia del parque:</b> ${num(p['potencia_mw'], 1)} MW`,
    `<b>Titular:</b> ${esc(p['titular'])}`,
    `<b>Sistema:</b> ${esc(p['sistema'])} · <b>Fuente:</b> ${esc(p['fuente'])}`,
    `<b>Región:</b> ${esc(p['region'])}`,
  ];
  if (tipo === 'aerogenerador') lineas.push(`<b>Aerogenerador n.º</b> ${num(p['ag'])}`);
  else lineas.push(`<b>Aerogeneradores del parque:</b> ${num(p['n_aerogeneradores'])}`);
  lineas.push(
    `<b>Diámetro de rotor:</b> ${num(p['diam_rotor_m'])} m · <b>Radio del buffer:</b> ${num(p['radio_buffer_m'])} m`,
  );
  if (p['rotor_imputado'] === true) {
    lineas.push(
      '<span style="opacity:.75">Diámetro de rotor estimado (promedio de parques operativos).</span>',
    );
  }
  lineas.push(`<span style="opacity:.7">MINENERGIA · corte ${fecha(p['fecha_act'])}</span>`);
  return lineas.join('<br>');
}
