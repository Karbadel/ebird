"""
Genera la geometría FICTICIA de las capas dummy del portal (abundancia y
dormideros de cóndor y viento). No proviene de ninguna
fuente: es ilustrativa, se reemplaza cuando exista el dato real. Uso:
    python src/build_dummy_capas.py
"""
import json, math
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "web" / "public" / "data" / "dummy"
OUT.mkdir(parents=True, exist_ok=True)


def fc(features):
    return {"type": "FeatureCollection", "features": features}


def punto(lon, lat, **props):
    return {"type": "Feature", "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {"dummy": True, **props}}


def hexagono(lon, lat, r_km, **props):
    ring = []
    for i in range(6):
        a = math.radians(60 * i + 30)
        ring.append([round(lon + (r_km * math.cos(a)) / (111.32 * math.cos(math.radians(lat))), 4),
                     round(lat + (r_km * math.sin(a)) / 110.57, 4)])
    ring.append(ring[0])
    return {"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [ring]},
            "properties": {"dummy": True, **props}}


# Abundancia: hexágonos de ~25 km sobre la cordillera (valor relativo ficticio 1-5)
abund = [(-70.25, -33.35, 5), (-70.45, -34.2, 4), (-70.55, -35.1, 3), (-71.0, -36.3, 2),
         (-70.9, -31.6, 2), (-70.4, -30.2, 1), (-71.4, -37.5, 3), (-71.6, -38.6, 2),
         (-73.0, -51.0, 4), (-72.3, -46.5, 2)]
(OUT / "abundancia_condor.geojson").write_text(json.dumps(fc(
    [hexagono(x, y, 25, nombre="Zona de abundancia (ilustrativa)", abundancia_relativa=v)
     for x, y, v in abund]), ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

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
