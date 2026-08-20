import JSZip from 'jszip';
import { kml } from '@tmcw/togeojson';
import type { FeatureCollection } from 'geojson';

/**
 * Convierte un archivo KML o KMZ subido por el usuario en un FeatureCollection.
 * - KMZ: es un ZIP; se extrae el primer .kml de su interior.
 * - KML: se lee como texto directamente.
 * El XML se parsea con DOMParser y togeojson hace la conversión a GeoJSON.
 */
export async function fileToGeoJSON(file: File): Promise<FeatureCollection> {
  const lower = file.name.toLowerCase();
  let kmlText: string;

  if (lower.endsWith('.kmz')) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entry = Object.keys(zip.files).find((n) => n.toLowerCase().endsWith('.kml'));
    const kmlFile = entry ? zip.files[entry] : undefined;
    if (!kmlFile) throw new Error('El KMZ no contiene ningún archivo .kml');
    kmlText = await kmlFile.async('text');
  } else if (lower.endsWith('.kml')) {
    kmlText = await file.text();
  } else {
    throw new Error('Formato no soportado: usa .kml o .kmz');
  }

  const dom = new DOMParser().parseFromString(kmlText, 'application/xml');
  if (dom.querySelector('parsererror')) throw new Error('El archivo KML no es un XML válido');

  const fc = kml(dom) as FeatureCollection;
  if (!fc.features?.length) throw new Error('El archivo no contiene geometrías');
  return fc;
}
