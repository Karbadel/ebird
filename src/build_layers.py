"""
Convierte las capas KMZ (aerogeneradores, aeropuertos, áreas protegidas) a
GeoJSON liviano para el portal.

- Une todas las sub-capas internas de cada KMZ.
- Simplifica la geometría (equilibrado) y recorta precisión a 5 decimales.
- Escribe en web/public/data/layers/.

Uso:
    python src/build_layers.py
"""

from pathlib import Path

import geopandas as gpd
import pandas as pd
import pyogrio

PROJECT = Path(__file__).resolve().parent.parent
SRC = PROJECT / "material adicional" / "OneDrive_1_17-08-2026"
OUT = PROJECT / "web" / "public" / "data" / "layers"

# simplify: tolerancia en grados (~0.001° ≈ 110 m). 0 = sin simplificar (puntos).
# precision: decimales de coordenadas en el GeoJSON.
LAYERS = [
    {"kmz": "Aerogeneradores_2026_06_Junio_Todos_estados.kmz", "out": "aerogeneradores.geojson", "simplify": 0.0, "precision": 5},
    {"kmz": "Aeropuertos.kmz", "out": "aeropuertos.geojson", "simplify": 0.0003, "precision": 5},
    {"kmz": "SNAP_MMA_2024_KMZ.kmz", "out": "areas_protegidas.geojson", "simplify": 0.012, "precision": 4, "min_area": 0.0004},
]


def read_all_layers(path: str) -> gpd.GeoDataFrame | None:
    """Lee y concatena todas las sub-capas de un KMZ, etiquetando la capa origen."""
    layers = pyogrio.list_layers(path)
    parts: list[gpd.GeoDataFrame] = []
    for name in layers[:, 0]:
        try:
            g = gpd.read_file(path, layer=name)
        except Exception:  # noqa: BLE001
            continue
        if len(g) == 0:
            continue
        g["_layer"] = name
        parts.append(g)
    if not parts:
        return None
    crs = parts[0].crs
    merged = pd.concat(parts, ignore_index=True)
    return gpd.GeoDataFrame(merged, geometry="geometry", crs=crs)


def clean_layer_name(name: str) -> str:
    """'Vig_PP 00 03_Ad Rodelillo.kmz' -> 'Rodelillo'; deja nombres genéricos vacíos."""
    if name in {"Line Features", "Point Features", "Area Features"} or name.startswith("Line Features"):
        return ""
    n = name.replace(".kmz", "")
    if "_Ad " in n:
        n = n.split("_Ad ", 1)[1]
    elif "_Ap " in n:
        n = n.split("_Ap ", 1)[1]
    return n.strip()


def build() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for cfg in LAYERS:
        path = SRC / cfg["kmz"]
        print(f"→ {cfg['kmz']}")
        gdf = read_all_layers(str(path))
        if gdf is None or gdf.empty:
            print("  (sin geometrías, se omite)")
            continue

        # Nombre: usa el campo Name; si está vacío, deriva del nombre de la sub-capa.
        name_col = next((c for c in ("Name", "name") if c in gdf.columns), None)
        base = gdf[name_col].fillna("") if name_col else pd.Series([""] * len(gdf))
        layer_name = gdf["_layer"].map(clean_layer_name)
        gdf["nombre"] = base.where(base.str.strip() != "", layer_name)
        gdf = gdf[["nombre", "geometry"]]

        # Limpieza geométrica.
        gdf = gdf[gdf.geometry.notna() & ~gdf.geometry.is_empty]
        if gdf.crs is not None and gdf.crs.to_epsg() != 4326:
            gdf = gdf.to_crs(4326)
        # Descarta partes minúsculas (islotes) en capas de polígonos.
        min_area = cfg.get("min_area")
        if min_area:
            gdf = gdf.explode(index_parts=False)
            gdf = gdf[gdf.geometry.area >= min_area]
        if cfg["simplify"] > 0:
            gdf["geometry"] = gdf.geometry.simplify(cfg["simplify"], preserve_topology=True)
            gdf = gdf[gdf.geometry.notna() & ~gdf.geometry.is_empty]

        geom_counts = gdf.geom_type.value_counts().to_dict()
        out = OUT / cfg["out"]
        gdf.to_file(out, driver="GeoJSON", COORDINATE_PRECISION=cfg["precision"])
        kb = out.stat().st_size / 1024
        print(f"  {len(gdf)} features {geom_counts} -> {cfg['out']} ({kb:,.0f} KB)")

    print(f"\n✓ Capas escritas en {OUT}")


if __name__ == "__main__":
    build()
