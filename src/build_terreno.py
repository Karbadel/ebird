"""Extrae la grilla de terreno (pendiente/rugosidad 3 km) embebida en el prototipo
`mapa_riesgo_condores_V20260821.html` y la deja como un JSON compacto servible por
la app React, con el `score` combinado PRECALCULADO (evita recomputar en el
navegador para ~24.843 celdas).

Procedencia del dato (declarada en el prototipo, nota al pie): grilla nacional de
3×3 km calculada desde el DEM Copernicus GLO-30 en Google Earth Engine. Este script
solo transforma esos valores YA calculados; el script de Earth Engine que los generó
no está en el repo (conseguirlo permitiría regenerar la grilla desde cero).

Formato de salida (web/public/data/riesgo/terreno_3km.json):
    {
      "type": "terreno_grid_3km",
      "cellKm": 3,
      "note": "score = 0.65*min(1, slope/35) + 0.35*min(1, demSd/350)",
      "cells": [[lon, lat, score, slope_deg, demSd_m, demMean_m], ...]
    }

Puro stdlib (json, re, ast): no requiere .venv.
"""
import ast
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "mapa_riesgo_condores_V20260821.html"
OUT = ROOT / "web" / "public" / "data" / "riesgo" / "terreno_3km.json"


def terreno_score(slope: float, dem_sd: float) -> float:
    s_norm = max(0.0, min(1.0, slope / 35.0))
    r_norm = max(0.0, min(1.0, dem_sd / 350.0))
    return round(s_norm * 0.65 + r_norm * 0.35, 3)


def main() -> None:
    text = HTML.read_text(encoding="utf-8", errors="replace")
    m = re.search(r"const\s+TERRENO_GRID_3KM\s*=\s*(\[\[.*?\]\])\s*;", text, re.S)
    if not m:
        raise SystemExit("No se encontró TERRENO_GRID_3KM en el HTML.")
    raw = ast.literal_eval(m.group(1))  # lista de [lon, lat, slope, demSd, demMean]

    cells = []
    for lon, lat, slope, dem_sd, dem_mean in raw:
        cells.append([
            round(float(lon), 4),
            round(float(lat), 4),
            terreno_score(float(slope), float(dem_sd)),
            round(float(slope), 1),
            round(float(dem_sd), 0),
            round(float(dem_mean), 0),
        ])

    out = {
        "type": "terreno_grid_3km",
        "cellKm": 3,
        "note": "score = 0.65*min(1, slope/35) + 0.35*min(1, demSd/350)",
        "cells": cells,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    print(f"{len(cells)} celdas -> {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
