"""Rasteriza la grilla de terreno (3 km) a un PNG RGBA georreferenciado en Web
Mercator, para mostrarla con `L.imageOverlay` en vez de 24.843 rectángulos.

Por qué así (ver LOG_ERRORES.md): la rugosidad es un CAMPO CONTINUO; pintarla como
celdas duras produce moteado. Un raster deja que el navegador la interpole (suave),
carga como 1 imagen (más rápido) y el canal alfa transparente recorta la silueta
real de Chile (sin bordes rectos). Se rasteriza en Web Mercator (EPSG:3857) para que
`L.imageOverlay` no distorsione la latitud (Chile va de ~17°S a ~56°S).

IMPORTANTE: esto es SOLO la capa visual. El `terreno_3km.json` se mantiene intacto
porque el motor de riesgo (riskEngine.terrenoScoreAt) lo consulta por punto.

Requiere: numpy + pyproj (ya en el .venv). El PNG se escribe con stdlib (zlib), sin
Pillow. Correr con:  .venv/Scripts/python.exe src/build_terreno_png.py
"""
import binascii
import json
import struct
import zlib
from pathlib import Path

import numpy as np
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "web" / "public" / "data" / "riesgo" / "terreno_3km.json"
OUT_PNG = ROOT / "web" / "public" / "data" / "riesgo" / "terreno_3km.png"
OUT_META = ROOT / "web" / "public" / "data" / "riesgo" / "terreno_3km_meta.json"

# Misma rampa que el front (EBIRD/TERRENO_RAMP en MapView.tsx): verdes 0→1.
RAMP = np.array([
    [247, 252, 245], [199, 233, 192], [161, 217, 155], [116, 196, 118],
    [65, 171, 93], [35, 139, 69], [0, 109, 44], [0, 68, 27],
], dtype=float)

HALF_M = 1500.0  # media celda de 3 km, en metros sobre el terreno
# Sobremuestreo respecto a la resolución nativa del dato. 1.0 = 1 px por celda: el
# navegador interpola bilinealmente al mostrar la imagen y el campo se ve SUAVE (en
# vez de celdas duras/moteadas). Valores altos vuelven a preservar el ruido.
OVERSAMPLE = 1.0


def write_png_rgba(path: Path, rgba: np.ndarray) -> None:
    """Escribe un PNG RGBA (H, W, 4) uint8 usando solo stdlib (zlib)."""
    h, w, _ = rgba.shape

    def chunk(tag: bytes, data: bytes) -> bytes:
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", binascii.crc32(body) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)  # 8 bits, color type 6 = RGBA
    raw = bytearray()
    for row in rgba:
        raw.append(0)  # filtro 0 (None) por scanline
        raw.extend(row.tobytes())
    idat = zlib.compress(bytes(raw), 9)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))


def nan_blur(score: np.ndarray, valid: np.ndarray) -> np.ndarray:
    """Blur gaussiano leve consciente de NoData (kernel separable [1,4,6,4,1])."""
    k = np.array([1.0, 4.0, 6.0, 4.0, 1.0])
    r = 2
    num = np.where(valid, score, 0.0)
    den = valid.astype(float)
    for axis in (0, 1):
        pad = [(r, r) if i == axis else (0, 0) for i in range(2)]
        pnum, pden = np.pad(num, pad), np.pad(den, pad)
        n = score.shape[axis]
        acc_num = np.zeros_like(num)
        acc_den = np.zeros_like(den)
        for i, w in enumerate(k):
            sl = [slice(None), slice(None)]
            sl[axis] = slice(i, i + n)
            acc_num += w * pnum[tuple(sl)]
            acc_den += w * pden[tuple(sl)]
        num, den = acc_num, acc_den
    with np.errstate(invalid="ignore", divide="ignore"):
        return np.where(den > 0, num / den, np.nan)


def main() -> None:
    data = json.loads(SRC.read_text(encoding="utf-8"))
    cells = np.array(data["cells"], dtype=float)  # [lon, lat, score, slope, demSd, demMean]
    lon, lat, score = cells[:, 0], cells[:, 1], cells[:, 2]

    to3857 = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)
    to4326 = Transformer.from_crs("EPSG:3857", "EPSG:4326", always_xy=True)

    # Medias celdas en grados (dLon depende de la latitud). En mercator, x depende
    # solo de lon y y solo de lat, así que basta proyectar los bordes por eje.
    d_lat = HALF_M / 111320.0
    d_lon = HALF_M / (111320.0 * np.cos(np.radians(lat)))
    x_l, _ = to3857.transform(lon - d_lon, lat)
    x_r, _ = to3857.transform(lon + d_lon, lat)
    _, y_b = to3857.transform(lon, lat - d_lat)
    _, y_t = to3857.transform(lon, lat + d_lat)

    x_min, x_max = float(np.min(x_l)), float(np.max(x_r))
    y_min, y_max = float(np.min(y_b)), float(np.max(y_t))
    # Tamaño de píxel ≈ tamaño de celda (resolución nativa): así el PNG NO agranda el
    # dato; el suavizado lo aporta la interpolación del navegador al escalarlo.
    px = float(np.median(y_t - y_b)) / OVERSAMPLE
    width = int(round((x_max - x_min) / px))
    height = int(round((y_max - y_min) / px))

    grid = np.full((height, width), np.nan, dtype=float)
    # Fila 0 = arriba (y_max). Se rellena la caja mercator de cada celda.
    col0 = np.clip(np.round((x_l - x_min) / px).astype(int), 0, width)
    col1 = np.clip(np.round((x_r - x_min) / px).astype(int), 0, width)
    row0 = np.clip(np.round((y_max - y_t) / px).astype(int), 0, height)
    row1 = np.clip(np.round((y_max - y_b) / px).astype(int), 0, height)
    for i in range(cells.shape[0]):
        c1 = max(col1[i], col0[i] + 1)
        r1 = max(row1[i], row0[i] + 1)
        grid[row0[i]:r1, col0[i]:c1] = score[i]

    valid = ~np.isnan(grid)
    smooth = nan_blur(grid, valid)
    smooth = np.clip(np.where(valid, smooth, 0.0), 0.0, 1.0)

    stops = np.linspace(0.0, 1.0, RAMP.shape[0])
    rgba = np.zeros((height, width, 4), dtype=np.uint8)
    for c in range(3):
        rgba[:, :, c] = np.round(np.interp(smooth, stops, RAMP[:, c])).astype(np.uint8)
    rgba[:, :, 3] = np.where(valid, 255, 0).astype(np.uint8)

    write_png_rgba(OUT_PNG, rgba)

    # bounds para L.imageOverlay: SW y NE del rectángulo mercator, en lat/lon.
    lon_sw, lat_sw = to4326.transform(x_min, y_min)
    lon_ne, lat_ne = to4326.transform(x_max, y_max)
    OUT_META.write_text(
        json.dumps({"bounds": [[lat_sw, lon_sw], [lat_ne, lon_ne]], "size": [width, height]}),
        encoding="utf-8",
    )
    print(f"PNG {width}x{height} -> {OUT_PNG} ({OUT_PNG.stat().st_size / 1024:.0f} KB)")
    print(f"bounds SW=({lat_sw:.3f},{lon_sw:.3f}) NE=({lat_ne:.3f},{lon_ne:.3f}) -> {OUT_META.name}")


if __name__ == "__main__":
    main()
