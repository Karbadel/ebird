import L from 'leaflet';

/** Referencia compartida al mapa Leaflet (lo crea MapView; lo usan los controles). */
export const mapInstance: { map: L.Map | null } = { map: null };

export const CHILE = L.latLngBounds([-56.2, -76.5], [-17.2, -66.0]);

/**
 * Límite "sólido" del mapa: Chile con margen regional (Argentina, Perú/Bolivia
 * y océano para contexto). Con maxBoundsViscosity: 1 el borde no se puede
 * cruzar, así que al hacer zoom out el mapa se mantiene anclado a Chile.
 *
 * A zoom bajo el viewport es mucho más ancho que este recuadro, así que Leaflet
 * centra la vista en el CENTRO del recuadro. Por eso el centro en longitud
 * (~-63) está a propósito al ESTE de Chile (~-71): así Chile queda a la
 * izquierda, despejado del panel de detalles. El centro en latitud (~-35) va
 * algo al norte del centro del país (~-37) para que Chile caiga un poco abajo.
 */
export const MAX_BOUNDS = L.latLngBounds([-57.0, -80.0], [-13.0, -46.0]);

export const FIT: L.FitBoundsOptions = {
  paddingTopLeft: [30, 60],
  paddingBottomRight: [380, 30],
};
