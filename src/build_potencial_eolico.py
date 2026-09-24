"""
Convierte el KMZ "Potencial Eólico Bruto SEN 2026" (MINENERGIA) a GeoJSON para
el portal (capa de contexto: dónde hay recurso eólico aprovechable).

Particularidades de este KMZ:
- Los atributos vienen en una tabla HTML dentro de <description> (igual que el
  de generación), no en <ExtendedData>.
- Las tildes llegan DAÑADAS desde el origen (U+FFFD: "Biob�o", "�uble"); se
  corrigen los nombres de región con una tabla fija.
- Los polígonos derivan de un raster de ~100 m → bordes escalonados. NO se
  simplifica con tolerancia (se perdería el escalón, pedido explícito de
  conservar el borde): solo se redondea a 4 decimales (~11 m) y se quitan
  vértices duplicados y colineales. Resultado idéntico a la vista.

Salida: web/public/data/layers/potencial_eolico.geojson
Propiedades por polígono: id, region, ha, mw.

Uso (stdlib, no requiere .venv):
    python src/build_potencial_eolico.py
"""

from __future__ import annotations

import html
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
KMZ = PROJECT / "data" / "Potencial_Eólico_Bruto_SEN_2026.kmz"
OUT = PROJECT / "web" / "public" / "data" / "layers" / "potencial_eolico.geojson"

NS = "{http://www.opengis.net/kml/2.2}"
PRECISION = 4

# Nombres de región con tilde rota en la fuente → nombre correcto.
REGION_FIX = {
    "Biob�o": "Biobío",
    "Araucan�a": "Araucanía",
    "Los R�os": "Los Ríos",
    "�uble": "Ñuble",
    "Tarapac�": "Tarapacá",
    "Valpara�so": "Valparaíso",
}

_TD = re.compile(r"<td[^>]*>(.*?)</td>", re.DOTALL)
_TAG = re.compile(r"<[^>]+>")


def clean(text: str) -> str:
    return html.unescape(_TAG.sub("", text)).strip()


def parse_description(desc: str) -> dict[str, str]:
    """Pares etiqueta/valor de la tabla HTML (el primer <td> es el título)."""
    cells = [clean(c) for c in _TD.findall(desc or "")]
    return {cells[i]: cells[i + 1] for i in range(1, len(cells) - 1, 2)}


def num(value: str | None) -> float | None:
    """'572,61871' → 572.61871 (coma decimal de la fuente)."""
    try:
        return float((value or "").replace(",", "."))
    except ValueError:
        return None


def parse_ring(text: str) -> list[list[float]]:
    """Coordenadas KML → anillo redondeado, sin duplicados ni colineales."""
    pts: list[list[float]] = []
    for tok in text.split():
        lon, lat, *_ = tok.split(",")
        p = [round(float(lon), PRECISION), round(float(lat), PRECISION)]
        if not pts or p != pts[-1]:
            pts.append(p)
    # Quitar vértices colineales (tramos rectos del escalón raster). Se trabaja
    # sobre el anillo abierto y luego se vuelve a cerrar.
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts.pop()
    changed = True
    while changed and len(pts) > 3:
        changed = False
        out: list[list[float]] = []
        n = len(pts)
        for i in range(n):
            a, b, c = pts[i - 1], pts[i], pts[(i + 1) % n]
            cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
            if abs(cross) < 1e-12:
                changed = True
                continue
            out.append(b)
        if len(out) < 3:
            break
        pts = out
    pts.append(pts[0])
    return pts


def parse_geometry(pm: ET.Element) -> dict | None:
    polys = []
    for pg in pm.iter(f"{NS}Polygon"):
        outer = pg.findtext(f"{NS}outerBoundaryIs/{NS}LinearRing/{NS}coordinates")
        if not outer:
            continue
        rings = [parse_ring(outer)]
        for inner in pg.findall(f"{NS}innerBoundaryIs/{NS}LinearRing/{NS}coordinates"):
            r = parse_ring(inner.text or "")
            if len(r) >= 4:
                rings.append(r)
        if len(rings[0]) >= 4:
            polys.append(rings)
    if not polys:
        return None
    if len(polys) == 1:
        return {"type": "Polygon", "coordinates": polys[0]}
    return {"type": "MultiPolygon", "coordinates": polys}


def build() -> None:
    with zipfile.ZipFile(KMZ) as z:
        kml = z.read("doc.kml").decode("utf-8", errors="replace")
    root = ET.fromstring(kml)

    features: list = []
    for pm in root.iter(f"{NS}Placemark"):
        geom = parse_geometry(pm)
        if geom is None:
            continue
        attrs = parse_description(pm.findtext(f"{NS}description") or "")
        region = next((v for k, v in attrs.items() if k.startswith("Regi")), "")
        region = REGION_FIX.get(region, region)
        ha, mw = num(attrs.get("Superficie (ha)")), num(attrs.get("Potencia (MW)"))
        features.append(
            {
                "type": "Feature",
                "geometry": geom,
                "properties": {
                    "id": int(num(attrs.get("ID")) or 0),
                    "region": region,
                    "ha": round(ha, 1) if ha is not None else None,
                    "mw": round(mw, 1) if mw is not None else None,
                },
            }
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    fc = {"type": "FeatureCollection", "features": features}
    OUT.write_text(
        json.dumps(fc, ensure_ascii=False, separators=(",", ":"), allow_nan=False),
        encoding="utf-8",
    )

    mb = OUT.stat().st_size / 1e6
    regiones = Counter(f["properties"]["region"] for f in features)
    total_mw = sum(f["properties"]["mw"] or 0 for f in features)
    total_ha = sum(f["properties"]["ha"] or 0 for f in features)
    print(f"OK {len(features)} polígonos -> {OUT.name} ({mb:.2f} MB)")
    print(f"  Total: {total_ha:,.0f} ha · {total_mw:,.0f} MW")
    print(f"  Regiones: {dict(regiones)}")
    rotas = [r for r in regiones if "�" in r]
    if rotas:
        raise SystemExit(f"Regiones con tilde rota sin corregir: {rotas}")


if __name__ == "__main__":
    build()
