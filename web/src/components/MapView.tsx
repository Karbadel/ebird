import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Feature } from 'geojson';
import { useFiltered } from '../lib/useFiltered';
import { aggregateSites, type Site } from '../lib/derive';
import { mapInstance, CHILE, FIT } from '../lib/mapInstance';
import { usePortalStore } from '../store/usePortalStore';
import { COLL, NET_SEGMENTS, RIDGE, RISK_COLORS } from '../data/portal';

function ridgeLon(lat: number): number {
  for (let i = 0; i < RIDGE.length - 1; i++) {
    const [a, al] = RIDGE[i]!;
    const [b, bl] = RIDGE[i + 1]!;
    if (lat <= a && lat >= b) return al + (bl - al) * ((lat - a) / (b - a));
  }
  return RIDGE[RIDGE.length - 1]![1];
}

function buildRisk(): L.LayerGroup {
  const g = L.layerGroup();
  const step = 0.5;
  for (let lat = -18; lat > -55; lat -= step) {
    const rl = ridgeLon(lat);
    for (let o = -2.5; o <= 0.5; o += step) {
      const lon = rl + o;
      if (lon < -75.5) continue;
      const latBand =
        Math.exp(-Math.pow((lat + 31.5) / 6.5, 2)) * 0.75 +
        Math.exp(-Math.pow((lat + 38) / 5.5, 2)) * 0.5;
      const near = Math.exp(-Math.pow((o + 1) / 1.1, 2));
      const jitter = ((Math.sin(lat * 12.9898 + lon * 78.233) + 1) / 2) * 0.28;
      const v = Math.min(1, latBand * 0.85 + near * 0.35 + jitter * 0.4);
      const k = Math.min(4, Math.floor(v * 5));
      if (k === 0 && jitter < 0.12) continue;
      L.rectangle([[lat - step, lon], [lat, lon + step]], {
        stroke: false,
        fillColor: RISK_COLORS[k],
        fillOpacity: 0.34 + k * 0.09,
        interactive: false,
      }).addTo(g);
    }
  }
  return g;
}

function buildColl(): L.LayerGroup {
  const g = L.layerGroup();
  COLL.forEach((c) => {
    const s = 26 + Math.round(c.c / 4);
    L.marker(c.ll, {
      icon: L.divIcon({
        className: '',
        iconSize: [s, s],
        iconAnchor: [s / 2, s / 2],
        html: `<div class="collide" style="width:${s}px;height:${s}px">✕${c.c}</div>`,
      }),
    })
      .bindTooltip(`${c.c} colisiones · ${c.n}, ${c.r} (${c.y})`, { direction: 'top', offset: [0, -s / 2] })
      .addTo(g);
  });
  return g;
}

function buildNet(): L.LayerGroup {
  const g = L.layerGroup();
  NET_SEGMENTS.forEach((seg) => {
    L.polyline(seg, { color: '#2b2b2d', weight: 1.5, dashArray: '6 4' })
      .bindTooltip('Infraestructura eléctrica · trazado esquemático', { direction: 'top' })
      .addTo(g);
  });
  return g;
}

export default function MapView() {
  const filtered = useFiltered();
  const layers = usePortalStore((s) => s.layers);
  const activeSite = usePortalStore((s) => s.activeSite);
  const setActiveSite = usePortalStore((s) => s.setActiveSite);
  const flyTarget = usePortalStore((s) => s.flyTarget);
  const consumeFly = usePortalStore((s) => s.consumeFly);

  const groupsRef = useRef<Record<string, L.Layer>>({});
  const pinsRef = useRef<L.LayerGroup | null>(null);
  const canvasRef = useRef<L.Canvas | null>(null);
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
    const load = async (file: string, options: L.GeoJSONOptions): Promise<L.Layer> => {
      const res = await fetch(`${import.meta.env.BASE_URL}data/layers/${file}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return L.geoJSON(await res.json(), options);
    };
    if (id === 'turb')
      return () =>
        load('aerogeneradores.geojson', {
          pointToLayer: (_f, ll) =>
            L.circleMarker(ll, { renderer: canvas, radius: 2.5, color: '#2c455d', weight: 1, fillColor: '#2c455d', fillOpacity: 0.7 }),
          onEachFeature: bindName,
        });
    if (id === 'protected')
      return () =>
        load('areas_protegidas.geojson', {
          style: () => ({ renderer: canvas, color: '#416180', weight: 1, fillColor: '#b5d9fd', fillOpacity: 0.18 }),
          onEachFeature: bindName,
        });
    if (id === 'airports')
      return () =>
        load('aeropuertos.geojson', {
          style: () => ({ renderer: canvas, color: '#597ea3', weight: 1, fillColor: '#597ea3', fillOpacity: 0.08 }),
          pointToLayer: (_f, ll) =>
            L.circleMarker(ll, { renderer: canvas, radius: 3, color: '#597ea3', weight: 1, fillOpacity: 0.6 }),
          onEachFeature: bindName,
        });
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
    groupsRef.current = {
      risk: buildRisk(),
      coll: buildColl(),
      obs: pins,
      net: buildNet(),
    };
    map.on('zoomend moveend', () => {
      if (map.hasLayer(pins)) drawPins();
    });

    return () => {
      map.remove();
      mapInstance.map = null;
      pinsRef.current = null;
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

  return <div id="map" />;
}
