"""Idoneidad ambiental del cóndor andino: raster oficial → capa del mapa + grilla del motor.

Fuente: Estrada Pacheco, R., N.L. Jácome, C.E. Borghi, V. Astore, C.I. Piña & R. Cavia.
2025. Mapping environmental suitability for Andean condor conservation in the southern
half of its range. Journal for Nature Conservation 87: 126970. (Facilitado por los
autores.) El GeoTIFF NO se copia al repo: se lee por ruta (argumento --src o la
constante SRC_DEFAULT).

Metadatos del raster (medidos con rasterio): EPSG:32719 (UTM 19S), 5.177 × 5.770 px de
≈ 829 × 831 m, float32, NoData = NaN, valores 0,0009–0,9997 (probabilidad de
idoneidad ambiental; ya está en escala 0–1, no requiere normalizar). Cubre desde
≈ 20°S hacia el sur: NO cubre el extremo norte de Chile (Arica y Parinacota, norte de
Tarapacá) → allí el motor no tiene dato de hábitat (criterio «sin dato», que se excluye
del promedio ponderado, igual que las celdas sin dato de la grilla anterior).

Salidas (web/public/data/riesgo/):
  · idoneidad_grid.json  — grilla lon/lat para el motor (Chile continental), 1 byte por
                           celda: valor = byte/254. Lookup O(1) en el navegador.
  · idoneidad.png        — RGBA en Web Mercator para L.imageOverlay (rampa azul →
                           amarillo → rojo, transparente en NoData/fuera de Chile).
  · idoneidad_meta.json  — bounds del PNG.

Resolución: ver RESOLUCION en el informe del PASO 1 (se comparan 0,03° / 0,02° / 0,01°
frente al muestreo directo del raster; 0,01° ≈ 1 km resume el raster nativo de 830 m).

Correr con:  .venv/Scripts/python.exe src/build_idoneidad.py [--src RUTA.tif] [--step 0.01]
"""
import argparse
import json
from pathlib import Path

import numpy as np

from raster_utils import DATA, Source, build_lonlat_values, chile_continental, decode_grid, encode_grid, \
    ramp_rgb, render_mercator, write_png_rgba

SRC_DEFAULT = Path(r"C:\Users\jgomezt\Desktop\condores\adjuntos\Estrada-Pacheco et al. - APTITUD\Estrada-Pacheco et al. - APTITUD_glm29x8.tif")
OUT_DIR = DATA / "riesgo"

# Misma rampa que la capa anterior (HABITAT_RAMP de MapView.tsx), 10 paradas.
HABITAT_RAMP = ["#1c8eb0", "#6eb5a7", "#a9d69f", "#cfe3ae", "#f5f3b6", "#feeba9", "#fed287", "#fdb561", "#f97841", "#da3726"]
CITA = ("Estrada Pacheco, R., N.L. Jácome, C.E. Borghi, V. Astore, C.I. Piña & R. Cavia. 2025. Mapping "
        "environmental suitability for Andean condor conservation in the southern half of its range. "
        "Journal for Nature Conservation 87: 126970.")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", type=Path, default=SRC_DEFAULT)
    ap.add_argument("--step", type=float, default=0.01, help="paso de la grilla del motor (grados)")
    ap.add_argument("--png-px", type=float, default=1000.0, help="píxel del PNG (m en Web Mercator)")
    ap.add_argument("--out-dir", type=Path, default=OUT_DIR)
    ap.add_argument("--no-png", action="store_true")
    a = ap.parse_args()

    src = Source(a.src)
    print(f"raster: {src.crs} {src.w}x{src.h} px, dtype={src.arr.dtype}, "
          f"min={np.nanmin(src.arr):.4f} max={np.nanmax(src.arr):.4f}")
    chile = chile_continental()
    print("Chile continental bounds:", [round(x, 2) for x in chile.bounds])

    # ── (a) grilla del motor ─────────────────────────────────────────────────
    sub = max(1, int(round(a.step / 0.0075)))  # ≈ una muestra cada ~830 m
    vals, lon0, lat0, ncols, nrows = build_lonlat_values(src, chile, a.step, sub)
    valid = ~np.isnan(vals)
    print(f"grilla {a.step}°: {ncols}x{nrows}, celdas con dato = {valid.sum():,}, media = {np.nanmean(vals):.3f}")
    a.out_dir.mkdir(parents=True, exist_ok=True)
    grid = encode_grid(vals, lon0, lat0, a.step, {
        "name": "Idoneidad del hábitat del cóndor andino (0–1)",
        "source": CITA + " (Facilitado por los autores.)",
        "note": "Raster oficial (EPSG:32719, ~830 m) remuestreado a una grilla lon/lat; valor = promedio de las "
                "muestras válidas de cada celda. Recortada a Chile continental. Sin dato al norte de ~20°S "
                "(fuera de la cobertura del raster).",
    })
    txt = json.dumps(grid, separators=(",", ":"))
    out_grid = a.out_dir / "idoneidad_grid.json"
    out_grid.write_text(txt, encoding="utf-8")
    print(f"{out_grid.name}: {len(txt) / 1e6:.2f} MB")
    back = decode_grid(json.loads(txt))
    assert np.nanmax(np.abs(back - np.clip(vals, 0, 1))[valid]) <= 1 / 254 / 2 + 1e-6, "cuantización fuera de tolerancia"
    assert (np.isnan(back) == np.isnan(vals)).all(), "máscara de NoData alterada"

    # ── error frente al muestreo directo del raster (puntos aleatorios en Chile) ──
    rng = np.random.default_rng(1)
    minx, miny, maxx, maxy = chile.bounds
    err = []
    from shapely import contains_xy
    while len(err) < 4000:
        lon = rng.uniform(minx, maxx, 20000)
        lat = rng.uniform(miny, maxy, 20000)
        keep = contains_xy(chile, lon, lat)
        lon, lat = lon[keep], lat[keep]
        direct = src.sample(lon, lat, bilinear=False)
        col = np.floor((lon - lon0) / a.step).astype(int)
        row = np.floor((lat0 - lat) / a.step).astype(int)
        g = back[row, col]
        ok = ~np.isnan(direct) & ~np.isnan(g)
        err.extend(np.abs(direct[ok] - g[ok]).tolist())
    err_a = np.array(err)
    print(f"error |grilla − raster| en puntos de Chile: media {err_a.mean():.4f}, p95 {np.percentile(err_a, 95):.4f}, "
          f"máx {err_a.max():.3f} (n={err_a.size})")

    # ── (b) PNG Web Mercator ─────────────────────────────────────────────────
    if not a.no_png:
        px_vals, bounds = render_mercator(lambda lo, la: src.sample(lo, la), chile, a.png_px)
        h, w = px_vals.shape
        ok = ~np.isnan(px_vals)
        rgba = np.zeros((h, w, 4), dtype=np.uint8)
        rgba[..., :3] = ramp_rgb(np.where(ok, px_vals, 0.0), HABITAT_RAMP)
        rgba[..., 3] = np.where(ok, 255, 0).astype(np.uint8)
        out_png = a.out_dir / "idoneidad.png"
        write_png_rgba(out_png, rgba)
        (a.out_dir / "idoneidad_meta.json").write_text(
            json.dumps({"bounds": bounds, "size": [w, h], "source": CITA}), encoding="utf-8")
        print(f"{out_png.name}: {w}x{h} px, {out_png.stat().st_size / 1e6:.2f} MB, bounds {bounds}")


if __name__ == "__main__":
    main()
