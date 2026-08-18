import L from 'leaflet';

/** Referencia compartida al mapa Leaflet (lo crea MapView; lo usan los controles). */
export const mapInstance: { map: L.Map | null } = { map: null };

export const CHILE = L.latLngBounds([-56.2, -76.5], [-17.2, -66.0]);
export const FIT: L.FitBoundsOptions = {
  paddingTopLeft: [30, 60],
  paddingBottomRight: [380, 30],
};
