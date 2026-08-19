import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Feature, FeatureCollection } from 'geojson';
import { useFiltered } from '../lib/useFiltered';
import { aggregateSites, type Site } from '../lib/derive';
import { mapInstance, CHILE, FIT } from '../lib/mapInstance';
import { usePortalStore } from '../store/usePortalStore';
import { useRiskStore } from '../store/useRiskStore';
import { useMeasureStore, segmentKm, fmtKm } from '../store/useMeasureStore';

type RGB = [number, number, number];
// Rampas de color de los choropleth (idénticas al visor de riesgo fuente).
const HABITAT_RAMP: RGB[] = [
  [28, 142, 176], [110, 181, 167], [169, 214, 159], [207, 227, 174], [245, 243, 182],
  [254, 235, 169], [254, 210, 135], [253, 181, 97], [249, 120, 65], [218, 55, 38],
];
const EBIRD_RAMP: RGB[] = [
  [255, 247, 236], [254, 224, 182], [253, 187, 132], [252, 141, 89], [227, 74, 51], [153, 0, 0],
];
function rampColor(v: number, ramp: RGB[]): string {
  const t = Math.max(0, Math.min(1, v)) * (ramp.length - 1);
  const i0 = Math.floor(t);
  const i1 = Math.min(ramp.length - 1, i0 + 1);
  const f = t - i0;
  const a = ramp[i0]!;
  const b = ramp[i1]!;
  return `rgb(${Math.round(a[0] + f * (b[0] - a[0]))},${Math.round(a[1] + f * (b[1] - a[1]))},${Math.round(a[2] + f * (b[2] - a[2]))})`;
}
function maxProp(fc: FeatureCollection, key: string): number {
  let m = 0;
  for (const ft of fc.features) {
    const v = ft.properties?.[key];
    if (typeof v === 'number') m = Math.max(m, v);
  }
  return m || 1;
}

export default function MapView() {
  const filtered = useFiltered();
  const layers = usePortalStore((s) => s.layers);
  const activeSite = usePortalStore((s) => s.activeSite);
  const setActiveSite = usePortalStore((s) => s.setActiveSite);
  const flyTarget = usePortalStore((s) => s.flyTarget);
  const consumeFly = usePortalStore((s) => s.consumeFly);
  const riskQueryActive = useRiskStore((s) => s.queryActive);
  const riskResult = useRiskStore((s) => s.result);
  const loadRiskData = useRiskStore((s) => s.loadData);
  const measureActive = useMeasureStore((s) => s.active);
  const measurePoints = useMeasureStore((s) => s.points);

  const groupsRef = useRef<Record<string, L.Layer>>({});
  const pinsRef = useRef<L.LayerGroup | null>(null);
  const canvasRef = useRef<L.Canvas | null>(null);
  const riskMarkerRef = useRef<L.CircleMarker | null>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);
  const loadingRef = useRef<Set<string>>(new Set());
  const filteredRef = useRef<Site[]>([]);
  const activeRef = useRef<string | null>(activeSite);
  const obsOnRef = useRef<boolean>(true);
  activeRef.current = activeSite;
  obsOnRef.current = layers.find((l) => l.id === 'obs')?.on ?? true;

  function cluster() {
    const map = mapInstance.map;
    if (!map) return [] as { items: Site[]; ll: L.LatLng; c: number }[];
    const z = map.getZoom();
    const groups: { p: L.Point; items: Site[] }[] = [];
    filteredRef.current
      .map((s) => ({ s, p: map.project(s.ll, z) }))
      .forEach((it) => {
        const g = groups.find((gr) => Math.abs(gr.p.x - it.p.x) < 60 && Math.abs(gr.p.y - it.p.y) < 60);
        if (g) {
          g.items.push(it.s);
          g.p = L.point(
            (g.p.x * (g.items.length - 1) + it.p.x) / g.items.length,
            (g.p.y * (g.items.length - 1) + it.p.y) / g.items.length,
          );
        } else groups.push({ p: it.p, items: [it.s] });
      });
    return groups.map((g) => ({
      items: g.items,
      ll: map.unproject(g.p, z),
      c: g.items.reduce((a, s) => a + s.obsCount, 0),
    }));
  }

  function drawPins() {
    const map = mapInstance.map;
    const pins = pinsRef.current;
    if (!map || !pins) return;
    pins.clearLayers();
    if (!obsOnRef.current) return;
    cluster().forEach((g) => {
      const many = g.items.length > 1;
      const first = g.items[0]!;
      const size = Math.round(26 + Math.min(g.c, 420) / 18);
      const on = !many && activeRef.current === first.loc;
      const label = many
        ? `${g.c.toLocaleString('es-CL')}<span style="font-size:9px;opacity:.7">·${g.items.length}</span>`
        : String(g.c);
      L.marker(g.ll, {
        icon: L.divIcon({
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          html: `<div class="marker${on ? ' on' : ''}" style="width:${size}px;height:${size}px">${label}</div>`,
        }),
      })
        .bindTooltip(
          many ? `${g.items.length} localidades · ${g.c.toLocaleString('es-CL')} registros` : `${first.loc} · ${first.region}`,
          { direction: 'top', offset: [0, -size / 2] },
        )
        .on('click', () => {
          if (many) {
            map.flyToBounds(L.latLngBounds(g.items.map((s) => s.ll)).pad(0.35), { duration: 0.7 });
          } else {
            const next = activeRef.current === first.loc ? null : first.loc;
            setActiveSite(next);
            if (next) map.flyTo(first.ll, 9, { duration: 0.7 });
          }
        })
        .addTo(pins);
    });
  }

  // Cargadores diferidos de las capas GeoJSON (KMZ convertidos): se traen del
  // servidor solo cuando el usuario activa la capa por primera vez.
  function loaderFor(id: string): (() => Promise<L.Layer>) | null {
    const canvas = canvasRef.current!;
    const bindName = (feature: Feature, layer: L.Layer) => {
      const n = feature.properties?.['nombre'];
      if (n) layer.bindTooltip(String(n), { sticky: true });
    };
    const bindPopup = (text: string) => (_f: Feature, l: L.Layer) => l.bindPopup(text);
    const fetchJson = async (path: string): Promise<FeatureCollection> => {
      const res = await fetch(`${import.meta.env.BASE_URL}${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as FeatureCollection;
    };
    const loadLayers = (file: string, options: L.GeoJSONOptions) => async () =>
      L.geoJSON(await fetchJson(`data/layers/${file}`), options);
    const loadRisk = (file: string, options: L.GeoJSONOptions) => async () =>
      L.geoJSON(await fetchJson(`data/riesgo/${file}`), options);
    const pt = (color: string, radius = 3, fillOpacity = 0.85) =>
      (_f: Feature, ll: L.LatLng) =>
        L.circleMarker(ll, { renderer: canvas, radius, color, weight: 1, fillColor: color, fillOpacity });

    // Capas KMZ
    if (id === 'turb')
      return loadLayers('aerogeneradores.geojson', { pointToLayer: pt('#2c455d', 2.5, 0.7), onEachFeature: bindName });
    if (id === 'protected')
      return loadLayers('areas_protegidas.geojson', {
        style: () => ({ renderer: canvas, color: '#416180', weight: 1, fillColor: '#b5d9fd', fillOpacity: 0.18 }),
        onEachFeature: bindName,
      });
    if (id === 'airports')
      return loadLayers('aeropuertos.geojson', {
        style: () => ({ renderer: canvas, color: '#597ea3', weight: 1, fillColor: '#597ea3', fillOpacity: 0.08 }),
        pointToLayer: pt('#597ea3', 3, 0.6),
        onEachFeature: bindName,
      });

    // Capas de riesgo — puntos / líneas / polígonos
    if (id === 'wind')
      return loadRisk('wind.geojson', { pointToLayer: pt('#c0392b', 4), onEachFeature: bindPopup('Parque eólico') });
    if (id === 'lineas')
      return loadRisk('lineas.geojson', { style: () => ({ renderer: canvas, color: '#2c6ea6', weight: 1.4 }) });
    if (id === 'nidos')
      return loadRisk('nidos.geojson', { pointToLayer: pt('#ff00a5', 4), onEachFeature: bindPopup('Nido de cóndor (evidencia eBird C3/C4)') });
    if (id === 'colisiones')
      return loadRisk('colisiones.geojson', { pointToLayer: pt('#111111', 4, 0.9), onEachFeature: bindPopup('Colisión de cóndor confirmada') });
    if (id === 'vertederos')
      return loadRisk('vertederos.geojson', {
        style: () => ({ renderer: canvas, color: '#8a4b12', weight: 1, fillColor: '#8a4b12', fillOpacity: 0.25 }),
        pointToLayer: pt('#8a4b12', 3, 0.7),
      });
    if (id === 'veranadas')
      return loadRisk('veranadas.geojson', { style: () => ({ renderer: canvas, color: '#2e7d32', weight: 1, fillColor: '#2e7d32', fillOpacity: 0.18 }) });

    // Capas de riesgo — choropleth (normalizadas)
    if (id === 'habitat')
      return async () => {
        const fc = await fetchJson('data/riesgo/habitat.geojson');
        return L.geoJSON(fc, {
          style: (feat) => {
            const hs = feat?.properties?.['hs_mean'];
            const ok = typeof hs === 'number';
            return { renderer: canvas, stroke: false, fillColor: ok ? rampColor(hs, HABITAT_RAMP) : '#cfd6d2', fillOpacity: ok ? 0.6 : 0.1 };
          },
          onEachFeature: (f, l) => {
            const hs = f.properties?.['hs_mean'];
            l.bindPopup(typeof hs === 'number' ? `Idoneidad de hábitat: ${hs.toFixed(2)}` : 'Sin dato');
          },
        });
      };
    if (id === 'ebird_densidad')
      return async () => {
        const fc = await fetchJson('data/riesgo/ebird_densidad.geojson');
        const max = maxProp(fc, 'n_localities');
        return L.geoJSON(fc, {
          style: (feat) => {
            const v = feat?.properties?.['n_localities'];
            const n = typeof v === 'number' ? v : 0;
            return { renderer: canvas, stroke: false, fillColor: rampColor(Math.sqrt(n / max), EBIRD_RAMP), fillOpacity: 0.55 };
          },
          onEachFeature: (f, l) => l.bindPopup(`Densidad eBird: ${f.properties?.['n_localities'] ?? 0} localidades`),
        });
      };

    return null;
  }

  // Inicializa el mapa y construye las capas una sola vez.
  useEffect(() => {
    const map = L.map('map', { zoomControl: false, minZoom: 3, preferCanvas: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);
    L.control.scale({ metric: true, imperial: false, position: 'bottomright' }).addTo(map);
    map.fitBounds(CHILE, FIT);
    mapInstance.map = map;
    canvasRef.current = L.canvas({ padding: 0.5 });

    const pins = L.layerGroup();
    pinsRef.current = pins;
    groupsRef.current = { obs: pins };
    measureLayerRef.current = L.layerGroup().addTo(map);
    map.on('zoomend moveend', () => {
      if (map.hasLayer(pins)) drawPins();
    });
    map.on('click', (e) => {
      const risk = useRiskStore.getState();
      if (risk.queryActive) {
        risk.runQuery(e.latlng.lat, e.latlng.lng);
        return;
      }
      const measure = useMeasureStore.getState();
      if (measure.active) measure.addPoint(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapInstance.map = null;
      pinsRef.current = null;
      measureLayerRef.current = null;
      groupsRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza qué capas están visibles (las GeoJSON se cargan diferidas).
  useEffect(() => {
    const map = mapInstance.map;
    if (!map) return;
    let cancelled = false;
    layers.forEach((l) => {
      const existing = groupsRef.current[l.id];
      if (l.on) {
        if (existing) {
          existing.addTo(map);
          if (l.id === 'obs') drawPins();
        } else {
          const loader = loaderFor(l.id);
          if (loader && !loadingRef.current.has(l.id)) {
            loadingRef.current.add(l.id);
            loader()
              .then((layer) => {
                loadingRef.current.delete(l.id);
                groupsRef.current[l.id] = layer;
                const stillOn = usePortalStore.getState().layers.find((x) => x.id === l.id)?.on;
                if (!cancelled && mapInstance.map && stillOn) layer.addTo(mapInstance.map);
              })
              .catch(() => loadingRef.current.delete(l.id));
          }
        }
      } else if (existing) {
        map.removeLayer(existing);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers]);

  // Redibuja las observaciones al cambiar datos filtrados o sitio activo.
  useEffect(() => {
    filteredRef.current = aggregateSites(filtered);
    drawPins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, activeSite]);

  // Vuela a una coordenada solicitada (p.ej. desde una colisión o sitio).
  useEffect(() => {
    if (flyTarget && mapInstance.map) {
      mapInstance.map.flyTo(flyTarget, 9, { duration: 0.7 });
      consumeFly();
    }
  }, [flyTarget, consumeFly]);

  // Modo consulta de riesgo: cursor de mira + precarga de los datos del motor.
  // Al activarlo, desactiva la regla (modos mutuamente excluyentes).
  useEffect(() => {
    if (riskQueryActive) {
      loadRiskData();
      useMeasureStore.getState().deactivate();
    }
  }, [riskQueryActive, loadRiskData]);

  // Modo medición: cursor de mira, sin zoom por doble clic, y apaga la consulta
  // de riesgo si estuviera activa.
  useEffect(() => {
    const map = mapInstance.map;
    if (!map) return;
    if (measureActive) {
      map.doubleClickZoom.disable();
      const risk = useRiskStore.getState();
      if (risk.queryActive) risk.toggleQuery();
    } else {
      map.doubleClickZoom.enable();
    }
  }, [measureActive]);

  // Cursor de mira mientras cualquiera de los dos modos de consulta esté activo.
  useEffect(() => {
    const container = mapInstance.map?.getContainer();
    if (container) container.style.cursor = riskQueryActive || measureActive ? 'crosshair' : '';
  }, [riskQueryActive, measureActive]);

  // Marcador del punto consultado, coloreado por categoría de riesgo.
  useEffect(() => {
    const map = mapInstance.map;
    if (!map) return;
    if (riskMarkerRef.current) {
      map.removeLayer(riskMarkerRef.current);
      riskMarkerRef.current = null;
    }
    if (riskResult) {
      riskMarkerRef.current = L.circleMarker([riskResult.lat, riskResult.lng], {
        radius: 9,
        color: riskResult.category.color,
        weight: 2,
        fillColor: riskResult.category.color,
        fillOpacity: 0.5,
      }).addTo(map);
    }
  }, [riskResult]);

  // Regla: polilínea punteada + vértices + etiqueta de distancia acumulada por punto.
  useEffect(() => {
    const layer = measureLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (measurePoints.length === 0) return;

    const latlngs = measurePoints.map((p) => L.latLng(p.lat, p.lng));
    if (latlngs.length > 1) {
      L.polyline(latlngs, { color: '#c0392b', weight: 2, dashArray: '5,4' }).addTo(layer);
    }
    let cum = 0;
    measurePoints.forEach((p, i) => {
      if (i > 0) cum += segmentKm(measurePoints[i - 1]!, p);
      const last = i === measurePoints.length - 1;
      L.circleMarker([p.lat, p.lng], {
        radius: last ? 5 : 3.5,
        color: '#c0392b',
        weight: 2,
        fillColor: '#ffffff',
        fillOpacity: 1,
      }).addTo(layer);
      if (i > 0) {
        L.marker([p.lat, p.lng], {
          interactive: false,
          keyboard: false,
          icon: L.divIcon({ className: 'measure-label', html: `<span>${fmtKm(cum)}</span>`, iconSize: [0, 0] }),
        }).addTo(layer);
      }
    });
  }, [measurePoints]);

  return <div id="map" />;
}
