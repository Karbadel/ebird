"""Utilidades compartidas por los scripts que convierten rasters (GeoTIFF) en las
dos salidas que usa el portal:

  1. una GRILLA lon/lat regular compacta para el motor de riesgo (JSON, 1 byte por
     celda, solo Chile continental), y
  2. un PNG RGBA en Web Mercator para `L.imageOverlay` (solo visual).

Los scripts que la usan: build_idoneidad.py y build_abundancia.py.
Requiere numpy, pyproj, shapely y rasterio (ver requirements.txt). El PNG se
escribe con stdlib (zlib), igual que build_terreno_png.py.
"""
import base64
import binascii
import json
import struct
import zlib
from pathlib import Path

import numpy as np
import rasterio
from pyproj import Transformer
from rasterio import features
from rasterio.transform import from_origin
from shapely.geometry import shape
from shapely.ops import transform as shp_transform, unary_union

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "web" / "public" / "data"
COMUNAS = DATA / "comunas.geojson"

NODATA_BYTE = 255
R_EARTH = 6378137.0


# ── Chile continental ────────────────────────────────────────────────────────
def chile_continental():
    """Unión de las comunas, sin Isla de Pascua, Juan Fernández ni Antártica: solo
    partes con lon > -77 y lat entre -57 y -17 (incluye Tierra del Fuego y los
    archipiélagos australes, excluye el resto del territorio insular oceánico)."""
    fc = json.loads(COMUNAS.read_text(encoding="utf-8"))
    geoms = [shape(f["geometry"]).buffer(0) for f in fc["features"] if f.get("geometry")]
    union = unary_union(geoms)
    parts = list(union.geoms) if hasattr(union, "geoms") else [union]
    keep = []
    for p in parts:
        c = p.centroid
        if -77.0 < c.x < -60.0 and -57.0 < c.y < -17.0:
            keep.append(p)
    return unary_union(keep)


# ── PNG ──────────────────────────────────────────────────────────────────────
def write_png_rgba(path: Path, rgba: np.ndarray) -> None:
    """PNG RGBA (H, W, 4) uint8 solo con stdlib (zlib)."""
    h, w, _ = rgba.shape

    def chunk(tag: bytes, data: bytes) -> bytes:
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", binascii.crc32(body) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    raw = bytearray()
    for row in rgba:
        raw.append(0)
        raw.extend(row.tobytes())
    idat = zlib.compress(bytes(raw), 9)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))


def ramp_rgb(t: np.ndarray, stops_hex: list) -> np.ndarray:
    """Interpola una rampa de colores (lista de '#rrggbb') en t∈[0,1] → (..., 3) uint8."""
    pal = np.array([[int(h[i:i + 2], 16) for i in (1, 3, 5)] for h in stops_hex], dtype=float)
    xs = np.linspace(0.0, 1.0, len(pal))
    t = np.clip(t, 0.0, 1.0)
    out = np.stack([np.interp(t, xs, pal[:, c]) for c in range(3)], axis=-1)
    return np.round(out).astype(np.uint8)


# ── muestreo del raster de origen ────────────────────────────────────────────
class Source:
    """Raster de origen en memoria con muestreo desde lon/lat (bilineal consciente
    de NoData: promedia solo los vecinos válidos)."""

    def __init__(self, path: Path):
        self.ds = rasterio.open(path)
        self.crs = self.ds.crs
        self.arr = self.ds.read(1).astype("float32")
        nd = self.ds.nodata
        if nd is not None and not np.isnan(nd):
            self.arr[self.arr == nd] = np.nan
        self.inv = ~self.ds.transform
        self.to_src = Transformer.from_crs("EPSG:4326", self.crs, always_xy=True)
        self.h, self.w = self.arr.shape

    def sample(self, lon: np.ndarray, lat: np.ndarray, bilinear: bool = True) -> np.ndarray:
        x, y = self.to_src.transform(lon, lat)
        col, row = self.inv * (np.asarray(x), np.asarray(y))
        col = col - 0.5  # centro de celda = índice entero
        row = row - 0.5
        if not bilinear:
            r = np.round(row).astype(int)
            c = np.round(col).astype(int)
            ok = (r >= 0) & (r < self.h) & (c >= 0) & (c < self.w)
            out = np.full(lon.shape, np.nan, dtype="float32")
            out[ok] = self.arr[r[ok], c[ok]]
            return out
        r0 = np.floor(row).astype(int)
        c0 = np.floor(col).astype(int)
        fr = row - r0
        fc = col - c0
        num = np.zeros(lon.shape, dtype="float64")
        den = np.zeros(lon.shape, dtype="float64")
        for dr, wr in ((0, 1 - fr), (1, fr)):
            for dc, wc in ((0, 1 - fc), (1, fc)):
                r = r0 + dr
                c = c0 + dc
                ok = (r >= 0) & (r < self.h) & (c >= 0) & (c < self.w)
                v = np.full(lon.shape, np.nan, dtype="float64")
                v[ok] = self.arr[r[ok], c[ok]]
                good = ~np.isnan(v)
                w = (wr * wc) * good
                num += np.where(good, v, 0.0) * w
                den += w
        with np.errstate(invalid="ignore", divide="ignore"):
            return np.where(den > 1e-9, num / den, np.nan).astype("float32")


# ── grilla lon/lat para el motor ─────────────────────────────────────────────
def lonlat_grid(bounds, step: float):
    """Grilla regular (lon0, lat0 = esquina superior izquierda) que cubre `bounds`
    (minx, miny, maxx, maxy) con celdas de `step` grados."""
    minx, miny, maxx, maxy = bounds
    lon0 = np.floor(minx / step) * step
    lat0 = np.ceil(maxy / step) * step
    ncols = int(np.ceil((maxx - lon0) / step))
    nrows = int(np.ceil((lat0 - miny) / step))
    return float(lon0), float(lat0), ncols, nrows


def build_lonlat_values(src: Source, geom, step: float, sub: int):
    """Valores medios por celda (0..1 o unidades del raster) dentro de `geom`.

    Cada celda se promedia con `sub`×`sub` muestras (bilineales, solo válidas): así
    una celda de 3 km resume bien un raster de 830 m y una de 1 km lo iguala."""
    lon0, lat0, ncols, nrows = lonlat_grid(geom.bounds, step)
    tr = from_origin(lon0, lat0, step, step)
    inside = features.rasterize([(geom, 1)], out_shape=(nrows, ncols), transform=tr, fill=0, dtype="uint8").astype(bool)
    rows, cols = np.nonzero(inside)
    acc = np.zeros(rows.size)
    cnt = np.zeros(rows.size)
    offs = (np.arange(sub) + 0.5) / sub
    for oy in offs:
        for ox in offs:
            lon = lon0 + (cols + ox) * step
            lat = lat0 - (rows + oy) * step
            v = src.sample(lon, lat)
            good = ~np.isnan(v)
            acc += np.where(good, v, 0.0)
            cnt += good
    vals = np.full((nrows, ncols), np.nan, dtype="float32")
    with np.errstate(invalid="ignore", divide="ignore"):
        vals[rows, cols] = np.where(cnt > 0, acc / cnt, np.nan)
    return vals, lon0, lat0, ncols, nrows


def encode_grid(vals: np.ndarray, lon0: float, lat0: float, step: float, extra: dict) -> dict:
    """Serializa la grilla: 1 byte por celda (round(v·254); 255 = sin dato), por
    filas y solo los tramos con dato, en base64. `vals` ya normalizada a 0–1."""
    q = np.where(np.isnan(vals), NODATA_BYTE, np.round(np.clip(vals, 0, 1) * 254)).astype(np.uint8)
    rows = []
    for r in range(q.shape[0]):
        valid = q[r] != NODATA_BYTE
        segs = []
        if valid.any():
            idx = np.flatnonzero(valid)
            # tramos contiguos de celdas con dato
            breaks = np.flatnonzero(np.diff(idx) > 1)
            starts = np.concatenate(([idx[0]], idx[breaks + 1]))
            ends = np.concatenate((idx[breaks], [idx[-1]]))
            for a, b in zip(starts, ends):
                segs.append([int(a), base64.b64encode(q[r, a:b + 1].tobytes()).decode("ascii")])
        rows.append(segs)
    return {
        "type": "raster_grid",
        "crs": "EPSG:4326",
        "lon0": round(lon0, 6),
        "lat0": round(lat0, 6),
        "step": step,
        "ncols": int(q.shape[1]),
        "nrows": int(q.shape[0]),
        "encoding": "byte=round(v*254); 255=sin dato; rows[r]=[[col_inicial, base64], ...]",
        **extra,
        "rows": rows,
    }


def decode_grid(g: dict) -> np.ndarray:
    """Inversa de encode_grid (para verificar): devuelve (nrows, ncols) float32 con NaN."""
    out = np.full((g["nrows"], g["ncols"]), np.nan, dtype="float32")
    for r, segs in enumerate(g["rows"]):
        for c0, b64 in segs:
            b = np.frombuffer(base64.b64decode(b64), dtype=np.uint8)
            out[r, c0:c0 + b.size] = b / 254.0
    return out


# ── PNG en Web Mercator ──────────────────────────────────────────────────────
def merc_x(lon):
    return np.radians(lon) * R_EARTH


def merc_y(lat):
    return np.log(np.tan(np.pi / 4 + np.radians(lat) / 2)) * R_EARTH


def render_mercator(sample_fn, geom, px_m: float, pad_deg: float = 0.03):
    """Rasteriza `sample_fn(lon, lat) -> valores` en una imagen Web Mercator de píxel
    `px_m` metros (mercator), recortada al polígono `geom` (+ `pad_deg` de holgura).
    Devuelve (valores (H,W) con NaN fuera, bounds [[lat_sw, lon_sw], [lat_ne, lon_ne]])."""
    to3857 = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)
    g = geom.buffer(pad_deg)
    minx, miny, maxx, maxy = g.bounds
    x0, x1 = float(merc_x(minx)), float(merc_x(maxx))
    y0, y1 = float(merc_y(miny)), float(merc_y(maxy))
    width = int(np.ceil((x1 - x0) / px_m))
    height = int(np.ceil((y1 - y0) / px_m))
    x1 = x0 + width * px_m
    y1 = y0 + height * px_m
    tr = from_origin(x0, y1, px_m, px_m)
    g_m = shp_transform(lambda x, y, z=None: to3857.transform(x, y), g)
    inside = features.rasterize([(g_m, 1)], out_shape=(height, width), transform=tr, fill=0, dtype="uint8").astype(bool)
    rows, cols = np.nonzero(inside)
    xm = x0 + (cols + 0.5) * px_m
    ym = y1 - (rows + 0.5) * px_m
    lon = np.degrees(xm / R_EARTH)
    lat = np.degrees(2 * np.arctan(np.exp(ym / R_EARTH)) - np.pi / 2)
    vals = np.full((height, width), np.nan, dtype="float32")
    vals[rows, cols] = sample_fn(lon, lat)
    lat_ne = float(np.degrees(2 * np.arctan(np.exp(y1 / R_EARTH)) - np.pi / 2))
    lat_sw = float(np.degrees(2 * np.arctan(np.exp(y0 / R_EARTH)) - np.pi / 2))
    lon_sw = float(np.degrees(x0 / R_EARTH))
    lon_ne = float(np.degrees(x1 / R_EARTH))
    return vals, [[lat_sw, lon_sw], [lat_ne, lon_ne]]
