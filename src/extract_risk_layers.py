"""
Extrae las capas GeoJSON embebidas en mapa_riesgo_condores.html y las escribe
como archivos GeoJSON en web/public/data/riesgo/.

Prioridad: precisión (coordenadas a 6 decimales, sin simplificar geometrías).

Uso:
    python src/extract_risk_layers.py
"""

import json
import re
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
SRC = PROJECT / "mapa_riesgo_condores.html"
OUT = PROJECT / "web" / "public" / "data" / "riesgo"

# Archivo de salida -> lista de (variable JS, etiqueta opcional). Si la etiqueta
# no es None, se agrega como propiedad `especie` a cada feature de esa fuente.
TARGETS: dict[str, list[tuple[str, str | None]]] = {
    "wind": [("WIND_GEOJSON", None)],
    "lineas": [("LINES_GEOJSON", None), ("SIC_GEOJSON", None)],
    "nidos": [("EBIRD_NIDOS_GEOJSON", None)],
    "colisiones": [("COLISIONES_GEOJSON", None)],
    "vertederos": [
        ("VERTEDEROS_POLIGONOS_GEOJSON", None),
        ("VERTEDEROS_PUNTOS_GEOJSON", None),
        ("VERTEDEROS_ILEGALES_GEOJSON", None),
    ],
    "veranadas": [("VERANADAS_GEOJSON", None)],
    "ganado": [
        ("GANADO_BOVINOS_GEOJSON", "bovino"),
        ("GANADO_OVINOS_GEOJSON", "ovino"),
        ("GANADO_CAPRINOS_GEOJSON", "caprino"),
    ],
    "habitat": [("SUITABILITY_GEOJSON", None)],
    "ebird_densidad": [("EBIRD_DENSIDAD_GEOJSON", None)],
}


def extract_object(text: str, brace_idx: int) -> str:
    """Extrae el objeto {...} balanceado desde la posición de '{', ignorando strings."""
    depth = 0
    in_str = False
    esc = False
    for i in range(brace_idx, len(text)):
        c = text[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return text[brace_idx : i + 1]
    raise ValueError("objeto no balanceado")


def find_geojson(text: str, name: str) -> dict:
    m = re.search(r"\b" + re.escape(name) + r"\s*=\s*", text)
    if not m:
        raise KeyError(name)
    brace = text.index("{", m.end())
    return json.loads(extract_object(text, brace))


def round_coords(obj, nd: int = 6):
    """Redondea recursivamente las coordenadas a `nd` decimales."""
    if isinstance(obj, float):
        return round(obj, nd)
    if isinstance(obj, list):
        return [round_coords(x, nd) for x in obj]
    if isinstance(obj, dict):
        return {k: round_coords(v, nd) for k, v in obj.items()}
    return obj


def build() -> None:
    text = SRC.read_text(encoding="utf-8")
    OUT.mkdir(parents=True, exist_ok=True)
    print(f"Fuente: {SRC.name} ({SRC.stat().st_size / 1024 / 1024:.1f} MB)\n")

    for out_name, variables in TARGETS.items():
        features = []
        missing = []
        for var, tag in variables:
            try:
                fc = find_geojson(text, var)
                feats = fc.get("features", [])
                if tag:
                    for ft in feats:
                        ft.setdefault("properties", {})["especie"] = tag
                features.extend(feats)
            except KeyError:
                missing.append(var)
        if not features:
            print(f"  ⚠ {out_name}: sin datos (faltan {missing})")
            continue
        fc_out = round_coords({"type": "FeatureCollection", "features": features})
        path = OUT / f"{out_name}.geojson"
        path.write_text(json.dumps(fc_out, ensure_ascii=False), encoding="utf-8")
        kb = path.stat().st_size / 1024
        note = f" (faltó {missing})" if missing else ""
        print(f"  {out_name:<16} {len(features):>5} features  {kb:>8,.0f} KB{note}")

    print(f"\n✓ Capas de riesgo en {OUT}")


if __name__ == "__main__":
    build()
