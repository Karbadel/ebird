"""Rango estimado y área predictiva del cóndor andino (eBird Status and Trends 2023):
GeoPackage → GeoJSON simplificado, para las capas solo visuales del grupo Cóndor.

Fuente: Fink et al. 2025, eBird Status and Trends, Data Version: 2023 (Cornell Lab of
Ornithology; ver cita completa en build_abundancia.py). Los .gpkg NO se copian al repo:
se leen por ruta (--dir o DIR_DEFAULT). Los productos eBird S&T no se redistribuyen; el
portal solo publica esta versión simplificada con su cita.

El área predictiva del producto es global (32.000 vértices): se recorta al marco de
navegación del portal (MAX_BOUNDS de web/src/lib/mapInstance.ts) y se simplifica
(tolerancia TOL grados, ≈ 200 m) para no superar ~1 MB por archivo. Coordenadas a 3
decimales (≈ 110 m).

Salidas (web/public/data/layers/): rango_condor.geojson, area_predictiva_condor.geojson.
Correr con:  .venv/Scripts/python.exe src/build_rango_condor.py [--dir CARPETA_GPKG]
"""
import argparse
import json
from pathlib import Path

import geopandas as gpd
from shapely.geometry import box, mapping

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "web" / "public" / "data" / "layers"
DIR_DEFAULT = Path(r"C:\Users\jgomezt\Desktop\condores\adjuntos\Cóndor_andcon1_range_2023")
# Marco del portal (lon_min, lat_min, lon_max, lat_max) = MAX_BOUNDS de mapInstance.ts.
CLIP = box(-80.0, -57.0, -46.0, -13.0)
TOL = 0.002
CITA = "Fink et al. 2025, eBird Status and Trends, Data Version: 2023. Cornell Lab of Ornithology."

PRODUCTOS = [
    ("andcon1_range_2023.gpkg", "rango_condor.geojson", "Rango estimado del cóndor andino (eBird S&T 2023)"),
    ("andcon1_prediction-area_2023.gpkg", "area_predictiva_condor.geojson", "Área predictiva del cóndor andino (eBird S&T 2023)"),
]


def round_coords(obj, nd=3):
    if isinstance(obj, (list, tuple)):
        if obj and isinstance(obj[0], (int, float)):
            return [round(float(v), nd) for v in obj]
        return [round_coords(o, nd) for o in obj]
    return obj


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", type=Path, default=DIR_DEFAULT)
    a = ap.parse_args()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for fname, out_name, nombre in PRODUCTOS:
        g = gpd.read_file(a.dir / fname)
        geom = g.geometry.iloc[0].intersection(CLIP).simplify(TOL, preserve_topology=True)
        geom = geom.buffer(0)  # asegura polígonos válidos tras simplificar
        row = g.iloc[0]
        gj = mapping(geom)
        fc = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {
                    "nombre": nombre,
                    "producto": str(row.get("type", "")),
                    "temporada": str(row.get("season", "")),
                    "anio": int(row.get("prediction_year", 2023)),
                    "fuente": CITA,
                },
                "geometry": {"type": gj["type"], "coordinates": round_coords(gj["coordinates"])},
            }],
        }
        out = OUT_DIR / out_name
        out.write_text(json.dumps(fc, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
        print(f"{out_name}: {out.stat().st_size / 1e6:.2f} MB ({geom.geom_type}, {len(getattr(geom, 'geoms', [geom]))} polígonos)")


if __name__ == "__main__":
    main()
