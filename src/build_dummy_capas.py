"""
Genera la geometría FICTICIA de las capas dummy del portal (dormideros de cóndor
y viento). No proviene de ninguna fuente: es ilustrativa, se reemplaza cuando
exista el dato real. (La abundancia de cóndor dejó de ser dummy: ahora viene de
eBird Status and Trends, ver build_abundancia.py.) Uso:
    python src/build_dummy_capas.py
"""
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "web" / "public" / "data" / "dummy"
OUT.mkdir(parents=True, exist_ok=True)


def fc(features):
    return {"type": "FeatureCollection", "features": features}


def punto(lon, lat, **props):
    return {"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {"dummy": True, **props}}


dorm = [(-70.6, -29.8), (-70.9, -31.2), (-70.3, -33.1), (-70.5, -33.9), (-70.6, -34.8), (-70.8, -35.6),
        (-71.1, -36.4), (-71.5, -37.4), (-71.7, -38.5), (-72.0, -46.0), (-73.05, -50.9), (-72.9, -51.2)]
(OUT / "dormideros_condor.geojson").write_text(json.dumps(fc(
    [punto(x, y, nombre=f"Dormidero {i + 1} (ilustrativo)") for i, (x, y) in enumerate(dorm)]),
    ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

viento = [(-69.8, -23.6, 8.1), (-70.4, -25.2, 7.4), (-70.9, -28.6, 6.9), (-71.3, -30.6, 7.8),
          (-71.6, -32.4, 6.2), (-72.2, -34.4, 5.8), (-72.6, -37.6, 6.5), (-72.9, -39.2, 5.9),
          (-72.6, -41.6, 6.1), (-69.0, -52.5, 9.2), (-70.0, -52.7, 8.7), (-68.6, -53.4, 9.5)]
(OUT / "viento.geojson").write_text(json.dumps(fc(
    [punto(x, y, nombre="Velocidad media de viento (ilustrativa)", velocidad_ms=v) for x, y, v in viento]),
    ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

print("ok")
