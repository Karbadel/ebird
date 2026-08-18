declare module 'leaflet.markercluster';

import type * as L from 'leaflet';

declare module 'leaflet' {
  interface MarkerClusterGroupOptions extends LayerOptions {
    maxClusterRadius?: number;
    iconCreateFunction?: (cluster: MarkerCluster) => L.Icon | L.DivIcon;
    showCoverageOnHover?: boolean;
    spiderfyOnMaxZoom?: boolean;
  }
  interface MarkerCluster extends Marker {
    getChildCount(): number;
  }
  class MarkerClusterGroup extends FeatureGroup {
    constructor(options?: MarkerClusterGroupOptions);
    getBounds(): LatLngBounds;
  }
  function markerClusterGroup(options?: MarkerClusterGroupOptions): MarkerClusterGroup;
}
