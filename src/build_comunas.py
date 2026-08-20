"""
Prepara las capas de comunas para el buscador del portal (navegar + resaltar).

Entradas (data/):
  - ZT_Comunas_Simple200.json : polígonos comunales en Esri JSON, EPSG:32719
    (WGS84 / UTM 19S, en metros). 410 features → 345 comunas.
  - comunas_centroides.json    : centroides {cut_comuna, nombre, lat, lon}.

Salidas (web/public/data/):
  - comunas.geojson            : polígonos reproyectados a EPSG:4326, un feature
    por comuna, con propiedades mínimas {cut, comuna, region, zona_t}.
  - comunas_centroides.json    : centroides normalizados {cut, nombre, lat, lon}
    para el autocompletado y el vuelo del mapa.

Uso (requiere el .venv con geopandas/pyproj):
    .venv/Scripts/python.exe src/build_comunas.py
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import geopandas as gpd
import warnings

PROJECT = Path(__file__).resolve().parent.parent
SRC = PROJECT / "data"
OUT = PROJECT / "web" / "public" / "data"

POLY_IN = SRC / "ZT_Comunas_Simple200.json"
CENT_IN = SRC / "comunas_centroides.json"
POLY_OUT = OUT / "comunas.geojson"
CENT_OUT = OUT / "comunas_centroides.json"

# Parámetros de aligeramiento (el resalte no necesita alta fidelidad):
#  - SIMPLIFY: tolerancia extra en grados (~0.002° ≈ 220 m).
#  - PRECISION: 4 decimales (~11 m) basta para dibujar el contorno.
#  - MIN_PART_AREA: descarta islotes menores a ~0.0005°² (≈ 6 km²), pero SIEMPRE
#    se conserva el mayor polígono de cada comuna (no se pierde ninguna comuna).
# El origen trae muchísimos anillos-isla (p.ej. Iquique, 65) que disparan el peso.
SIMPLIFY = 0.002
PRECISION = 4
MIN_PART_AREA = 0.0005


def build_polygons() -> set[int]:
    warnings.filterwarnings("ignore")
    gdf = gpd.read_file(POLY_IN)
    # Esri JSON en UTM 19S: si el driver no fija el CRS, lo forzamos.
    if gdf.crs is None:
        gdf = gdf.set_crs(32719)
    gdf = gdf.to_crs(4326)

    gdf = gdf.rename(columns={"CUT": "cut", "Comuna": "comuna", "Región": "region", "Zona_T": "zona_t"})
    gdf = gdf[["cut", "comuna", "region", "zona_t", "geometry"]]
    gdf = gdf.dissolve(by="cut", as_index=False, aggfunc="first")

    # Separa en partes simples y descarta islotes minúsculos, conservando siempre
    # el cuerpo principal de cada comuna (el de mayor área).
    parts = gdf.explode(index_parts=False).reset_index(drop=True)
    parts["_a"] = parts.geometry.area
    largest = parts.groupby("cut")["_a"].idxmax()
    kept = parts[(parts["_a"] >= MIN_PART_AREA) | (parts.index.isin(largest))]
    gdf = kept.drop(columns="_a").dissolve(by="cut", as_index=False, aggfunc="first")

    gdf = gdf[gdf.geometry.notna() & ~gdf.geometry.is_empty]
    gdf["geometry"] = gdf.geometry.simplify(SIMPLIFY, preserve_topology=True)

    OUT.mkdir(parents=True, exist_ok=True)
    if POLY_OUT.exists():
        POLY_OUT.unlink()
    gdf.to_file(POLY_OUT, driver="GeoJSON", COORDINATE_PRECISION=PRECISION)
    kb = POLY_OUT.stat().st_size / 1024
    print(f"OK polígonos: {len(gdf)} comunas -> {POLY_OUT.name} ({kb:,.0f} KB)")
    # Nombre y región tomados del polígono: traen la grafía con tildes correcta
    # (los centroides vienen sin acentos).
    return {int(c): {"nombre": n, "region": r} for c, n, r in zip(gdf["cut"], gdf["comuna"], gdf["region"])}


def build_centroids(meta_by_cut: dict[int, dict[str, str]]) -> set[int]:
    raw = json.loads(CENT_IN.read_text(encoding="utf-8"))
    out = []
    skipped = []
    for c in raw:
        cut = int(c["cut_comuna"])
        lat, lon = float(c["lat"]), float(c["lon"])
        # Islas oceánicas (Isla de Pascua, Juan Fernández) no traen geometría y su
        # centroide sale NaN. Se descartan: NaN no es JSON válido y rompería el
        # parseo del archivo completo en el navegador (JSON.parse).
        if not (math.isfinite(lat) and math.isfinite(lon)):
            skipped.append(cut)
            continue
        meta = meta_by_cut.get(cut, {})
        out.append(
            {
                "cut": cut,
                # Nombre acentuado del polígono; si faltara, el del centroide.
                "nombre": meta.get("nombre") or c["nombre"],
                "region": meta.get("region", ""),
                "lat": round(lat, 5),
                "lon": round(lon, 5),
            }
        )
    out.sort(key=lambda c: c["nombre"])
    # allow_nan=False: falla ruidosamente si se colara un NaN/Infinity en vez de
    # emitir JSON que el navegador no puede parsear.
    CENT_OUT.write_text(
        json.dumps(out, ensure_ascii=False, separators=(",", ":"), allow_nan=False),
        encoding="utf-8",
    )
    if skipped:
        print(f"  centroides sin coordenadas (descartados): {sorted(skipped)}")
    kb = CENT_OUT.stat().st_size / 1024
    print(f"OK centroides: {len(out)} comunas -> {CENT_OUT.name} ({kb:,.0f} KB)")
    return set(c["cut"] for c in out)


def build() -> None:
    meta_by_cut = build_polygons()
    cut_poly = set(meta_by_cut)
    cut_cent = build_centroids(meta_by_cut)
    # Los dos conjuntos deben cruzar por CUT (el nombre difiere en tildes/mayúsculas).
    only_poly = cut_poly - cut_cent
    only_cent = cut_cent - cut_poly
    print(f"  CUT solo en polígonos: {len(only_poly)} | solo en centroides: {len(only_cent)}")
    if only_poly:
        print(f"    (poly) {sorted(only_poly)[:10]}")
    if only_cent:
        print(f"    (cent) {sorted(only_cent)[:10]}")


if __name__ == "__main__":
    build()
