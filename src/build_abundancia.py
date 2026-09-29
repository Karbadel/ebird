"""Abundancia relativa del cóndor andino (eBird Status and Trends 2023) → capa del mapa
+ grilla del motor.

Fuente: Fink, D., T. Auer, A. Johnston, M. Strimas-Mackey, S. Ligocki, O. Robinson,
W. Hochachka, L. Jaromczyk, C. Crowley, K. Dunham, A. Stillman, C. Davis, M. Stokowski,
V. Ruiz-Gutierrez, C. Wood & A. Rodewald. 2025. eBird Status and Trends, Data Version:
2023. Cornell Lab of Ornithology. https://science.ebird.org/en/status-and-trends/data-access/ebird-status-data-version-2023
(acceso 25/09/2025). Producto andcon1_abundance_seasonal_year_round_mean_2023: conteo
promedio estimado de individuos detectados por un eBirder en 1 h y 2 km, en el momento
óptimo del día, promedio anual. El GeoTIFF NO se copia al repo: se lee por ruta
(--src o SRC_DEFAULT). Los productos eBird S&T no se redistribuyen: el portal solo
publica esta derivación visual y de cálculo, con la cita.

Metadatos (medidos con rasterio): EPSG:8857 (Equal Earth), 11.484 × 5.562 px de 3.000 m,
float32, NoData = NaN (fuera del área de predicción), banda «resident», máx. mundial
14,4 (Chile continental: 9,28).

Normalización 0–1 (para el motor y el color): v / P99, con tope 1, donde P99 es el
percentil 99 de las celdas de 3 km de Chile continental con dato (incluye ceros:
P99 = 2,43 individuos/h·2 km). Se usa P99 y no el máximo porque un punto aislado
(≈ 9,3, sector de Torres del Paine) aplanaría el resto del país. Las celdas sin dato
(fuera del área de predicción de eBird) quedan «sin dato»; los ceros son abundancia 0.

Salidas (web/public/data/riesgo/): abundancia_grid.json (motor), abundancia.png
(mapa, Web Mercator, transparente en 0 y sin dato) y abundancia_meta.json (bounds, P99).

Correr con:  .venv/Scripts/python.exe src/build_abundancia.py [--src RUTA.tif]
"""
import argparse
import json
from pathlib import Path

import numpy as np

from raster_utils import DATA, Source, build_lonlat_values, chile_continental, decode_grid, encode_grid, \
    ramp_rgb, render_mercator, write_png_rgba

SRC_DEFAULT = Path(r"C:\Users\jgomezt\Desktop\condores\adjuntos\eBird Abundancia condor\andcon1_abundance_seasonal_year_round_mean_2023.tif")
OUT_DIR = DATA / "riesgo"
STEP = 0.03  # ≈ 3 km, la resolución nativa del producto
# Rampa secuencial claro → oscuro (amarillo pálido → verde azulado → violeta).
ABUND_RAMP = ["#f4f7b4", "#c5e58a", "#79d37f", "#2fb59b", "#2a8bab", "#3a5aa8", "#3f2f86", "#2a0f5a"]
CITA = ("Fink, D., T. Auer, A. Johnston, M. Strimas-Mackey, S. Ligocki, O. Robinson, W. Hochachka, L. Jaromczyk, "
        "C. Crowley, K. Dunham, A. Stillman, C. Davis, M. Stokowski, V. Ruiz-Gutierrez, C. Wood & A. Rodewald. 2025. "
        "eBird Status and Trends, Data Version: 2023. Cornell Lab of Ornithology. "
        "https://science.ebird.org/en/status-and-trends/data-access/ebird-status-data-version-2023 (acceso 25/09/2025).")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, default=SRC_DEFAULT)
    ap.add_argument("--png-px", type=float, default=1500.0, help="píxel del PNG (m en Web Mercator)")
    ap.add_argument("--out-dir", type=Path, default=OUT_DIR)
    a = ap.parse_args()

    src = Source(a.src)
    print(f"raster: {src.crs} {src.w}x{src.h} px de {abs(src.ds.res[0]):.0f} m, dtype={src.arr.dtype}, "
          f"máx={np.nanmax(src.arr):.2f}, banda={src.ds.descriptions[0]}")
    chile = chile_continental()

    vals, lon0, lat0, ncols, nrows = build_lonlat_values(src, chile, STEP, 2)
    finite = vals[~np.isnan(vals)]
    p99 = float(np.percentile(finite, 99))
    print(f"Chile: {finite.size:,} celdas con dato, {(finite == 0).mean():.1%} en cero, máx {finite.max():.2f}, P99 = {p99:.3f}")
    norm = np.clip(vals / p99, 0, 1)

    a.out_dir.mkdir(parents=True, exist_ok=True)
    grid = encode_grid(norm, lon0, lat0, STEP, {
        "name": "Abundancia relativa de cóndor andino, eBird S&T 2023 (normalizada 0–1)",
        "source": CITA,
        "p99": round(p99, 4),
        "max": round(float(finite.max()), 4),
        "note": "valor = min(1, abundancia / P99); P99 = percentil 99 de las celdas de Chile continental con dato. "
                "Abundancia = conteo promedio estimado de individuos detectados por un eBirder en 1 h y 2 km, "
                "en el momento óptimo del día (promedio anual). Sin dato = fuera del área de predicción.",
    })
    txt = json.dumps(grid, separators=(",", ":"))
    out_grid = a.out_dir / "abundancia_grid.json"
    out_grid.write_text(txt, encoding="utf-8")
    back = decode_grid(json.loads(txt))
    assert (np.isnan(back) == np.isnan(norm)).all()
    print(f"{out_grid.name}: {len(txt) / 1e6:.2f} MB")

    px_vals, bounds = render_mercator(lambda lo, la: src.sample(lo, la), chile, a.png_px)
    h, w = px_vals.shape
    has = ~np.isnan(px_vals) & (px_vals > 0)
    t = np.where(has, px_vals / p99, 0.0)
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[..., :3] = ramp_rgb(t, ABUND_RAMP)
    rgba[..., 3] = np.where(has, 255, 0).astype(np.uint8)
    out_png = a.out_dir / "abundancia.png"
    write_png_rgba(out_png, rgba)
    (a.out_dir / "abundancia_meta.json").write_text(
        json.dumps({"bounds": bounds, "size": [w, h], "p99": round(p99, 3), "source": CITA}), encoding="utf-8")
    print(f"{out_png.name}: {w}x{h} px, {out_png.stat().st_size / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
