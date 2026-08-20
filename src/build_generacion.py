"""
Convierte el KMZ "Instalaciones y Proyectos de Generación Eléctrica" a un
GeoJSON liviano para el portal (capa de contexto energético nacional).

Particularidad de este KMZ: los atributos NO vienen en <ExtendedData>, sino
incrustados en una tabla HTML dentro de <description>. La tecnología, además,
solo existe en la jerarquía de carpetas (Tecnología → Estado → Placemark). Por
eso no sirve el build_layers.py genérico (geopandas) y parseamos a mano.

Salida: web/public/data/layers/generacion.geojson
Propiedades por punto: nombre, tecnologia, estado, potencia_mw, medio,
titular, region, comuna.

Uso:
    python src/build_generacion.py
"""

from __future__ import annotations

import html
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
KMZ = PROJECT / "data" / "Instalaciones y Proyectos de Generacion Eléctrica (junio 2026).kmz"
OUT = PROJECT / "web" / "public" / "data" / "layers" / "generacion.geojson"

NS = "{http://www.opengis.net/kml/2.2}"
PRECISION = 5

# Etiquetas de la tabla HTML → clave de salida.
FIELD_MAP = {
    "Estado": "estado",
    "Potencia_MW": "potencia_mw",
    "Medio_de_generación": "medio",
    "Titular": "titular",
    "Región": "region",
    "Comuna": "comuna",
}

_TD = re.compile(r"<td[^>]*>(.*?)</td>", re.DOTALL)
_TAG = re.compile(r"<[^>]+>")


def clean(text: str) -> str:
    """Quita tags internos, decodifica entidades y normaliza espacios."""
    return html.unescape(_TAG.sub("", text)).strip()


def parse_description(desc: str) -> dict[str, str]:
    """Extrae los pares etiqueta/valor de la tabla HTML de <description>.

    Las celdas vienen en orden: [título, Label1, Value1, Label2, Value2, ...].
    """
    cells = [clean(c) for c in _TD.findall(desc or "")]
    props: dict[str, str] = {}
    # El primer <td> es el título (nombre); el resto son pares etiqueta/valor.
    for i in range(1, len(cells) - 1, 2):
        label, value = cells[i], cells[i + 1]
        key = FIELD_MAP.get(label)
        if key:
            props[key] = value
    return props


def parse_point(placemark: ET.Element) -> tuple[float, float] | None:
    coords = placemark.findtext(f"{NS}Point/{NS}coordinates")
    if not coords:
        return None
    lon, lat, *_ = coords.strip().split(",")
    return round(float(lon), PRECISION), round(float(lat), PRECISION)


def walk(folder: ET.Element, tech: str | None, depth: int, features: list) -> None:
    """Recorre la jerarquía Envoltorio(1) → Tecnología(2) → Estado(3) → Placemark.

    La tecnología está en el segundo nivel de carpeta (el primero es un
    envoltorio con el nombre del archivo), por eso se fija cuando depth == 1.
    """
    for child in folder:
        tag = child.tag.split("}")[-1]
        if tag == "Folder":
            name = (child.findtext(f"{NS}name") or "").strip()
            new_tech = name if depth == 1 else tech
            walk(child, new_tech, depth + 1, features)
        elif tag == "Placemark":
            pt = parse_point(child)
            if pt is None:
                continue
            props: dict[str, object] = {
                "nombre": (child.findtext(f"{NS}name") or "").strip(),
                "tecnologia": tech or "",
            }
            props.update(parse_description(child.findtext(f"{NS}description") or ""))
            # Potencia como número cuando sea posible.
            pot = props.get("potencia_mw")
            if isinstance(pot, str):
                try:
                    props["potencia_mw"] = round(float(pot.replace(",", ".")), 3)
                except ValueError:
                    props["potencia_mw"] = None
            features.append(
                {"type": "Feature", "geometry": {"type": "Point", "coordinates": list(pt)}, "properties": props}
            )


def build() -> None:
    with zipfile.ZipFile(KMZ) as z:
        kml = z.read("doc.kml").decode("utf-8")
    doc = ET.fromstring(kml).find(f"{NS}Document")
    if doc is None:
        raise SystemExit("No se encontró <Document> en el KML.")

    features: list = []
    walk(doc, None, 0, features)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    fc = {"type": "FeatureCollection", "features": features}
    OUT.write_text(json.dumps(fc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    kb = OUT.stat().st_size / 1024
    from collections import Counter

    tech = Counter(f["properties"]["tecnologia"] for f in features)
    estado = Counter(f["properties"].get("estado", "—") for f in features)
    print(f"OK {len(features)} puntos -> {OUT.name} ({kb:,.0f} KB)")
    print(f"  Tecnologías: {dict(tech)}")
    print(f"  Estados:     {dict(estado)}")


if __name__ == "__main__":
    build()
