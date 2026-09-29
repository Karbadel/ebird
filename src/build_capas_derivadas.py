"""
Deriva capas auxiliares a partir de datos ya publicados del portal, sin tocar
las fuentes originales:

1. `layers/generacion.geojson` se separa en:
   - `layers/parques_eolicos.geojson` (solo tecnología Eólico, con `categoria`
     agregada: OPC / En SEIA / Otros según `estado`).
   - `layers/otros_generacion.geojson` (todo lo que no es Eólico).
2. `riesgo/colisiones.geojson` (29 puntos) se expande a
   `riesgo/colisiones_influencia.geojson`: un círculo geodésico de radio
   `COLISIONES_RADIO_KM` (64 vértices) por cada colisión, con las propiedades
   originales + `radio_km`.
3. Se escribe `capas_conteo.json` con el conteo de features de cada capa del
   portal (para mostrar "N elementos" en la UI sin leer el archivo completo
   en el navegador).

Puro stdlib. Uso:
    python src/build_capas_derivadas.py
"""

from __future__ import annotations

import json
import math
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
DATA = PROJECT / "web" / "public" / "data"
LAYERS = DATA / "layers"
RIESGO = DATA / "riesgo"

GENERACION = LAYERS / "generacion.geojson"
OUT_PARQUES = LAYERS / "parques_eolicos.geojson"
OUT_OTROS = LAYERS / "otros_generacion.geojson"

COLISIONES = RIESGO / "colisiones.geojson"
OUT_COLISIONES_INFLUENCIA = RIESGO / "colisiones_influencia.geojson"

OUT_CONTEO = DATA / "capas_conteo.json"

# Radio de influencia por defecto del criterio "Historial de colisiones
# cercanas" (web/src/data/riskConfig.ts, variable `colisiones`, `decayKm`).
COLISIONES_RADIO_KM = 10.0
CIRCULO_VERTICES = 64
RADIO_TIERRA_KM = 6371.0088
PRECISION = 5

# Estado -> categoría de parque eólico. Cualquier estado fuera de este mapa
# aborta la ejecución (no hay que fallar en silencio ante un estado nuevo).
ESTADO_A_CATEGORIA = {
    "En Operación": "OPC",
    "En Pruebas": "OPC",
    "En Calificación": "En SEIA",
    "Aprobado": "Otros",
    "En Construcción": "Otros",
}


def cargar_geojson(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def escribir_json(path: Path, obj: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    texto = json.dumps(obj, ensure_ascii=False, allow_nan=False, separators=(",", ":"))
    path.write_text(texto, encoding="utf-8")


# --------------------------------------------------------------------------
# 1) Generación -> parques eólicos / resto
# --------------------------------------------------------------------------

def split_generacion() -> None:
    fc = cargar_geojson(GENERACION)
    features = fc["features"]

    eolicos: list = []
    otros: list = []
    for feat in features:
        props = feat["properties"]
        if props.get("tecnologia") == "Eólico":
            estado = props.get("estado")
            categoria = ESTADO_A_CATEGORIA.get(estado)
            if categoria is None:
                raise SystemExit(
                    f"Estado de parque eólico no reconocido: {estado!r} "
                    f"(nombre={props.get('nombre')!r}). "
                    "Actualizar ESTADO_A_CATEGORIA en build_capas_derivadas.py."
                )
            nuevo_props = dict(props)
            nuevo_props["categoria"] = categoria
            nuevo_feat = dict(feat)
            nuevo_feat["properties"] = nuevo_props
            eolicos.append(nuevo_feat)
        else:
            otros.append(feat)

    if len(eolicos) + len(otros) != len(features):
        raise SystemExit("Split de generacion.geojson inconsistente (no cuadra la suma).")

    escribir_json(OUT_PARQUES, {"type": "FeatureCollection", "features": eolicos})
    escribir_json(OUT_OTROS, {"type": "FeatureCollection", "features": otros})

    conteo_categoria = Counter(f["properties"]["categoria"] for f in eolicos)
    print(f"OK {len(eolicos)} parques eólicos -> {OUT_PARQUES.name}")
    print(f"   categorías: {dict(conteo_categoria)}")
    print(f"OK {len(otros)} otras instalaciones -> {OUT_OTROS.name}")


# --------------------------------------------------------------------------
# 2) Colisiones -> polígonos de influencia (círculo geodésico)
# --------------------------------------------------------------------------

def destino_geodesico(lon: float, lat: float, bearing_deg: float, dist_km: float) -> tuple[float, float]:
    """Punto a `dist_km` de (lon, lat) en dirección `bearing_deg`, sobre una
    esfera de radio RADIO_TIERRA_KM (fórmula estándar de "destination point").
    """
    lat1 = math.radians(lat)
    lon1 = math.radians(lon)
    theta = math.radians(bearing_deg)
    delta = dist_km / RADIO_TIERRA_KM

    lat2 = math.asin(
        math.sin(lat1) * math.cos(delta) + math.cos(lat1) * math.sin(delta) * math.cos(theta)
    )
    lon2 = lon1 + math.atan2(
        math.sin(theta) * math.sin(delta) * math.cos(lat1),
        math.cos(delta) - math.sin(lat1) * math.sin(lat2),
    )
    return math.degrees(lon2), math.degrees(lat2)


def circulo_geodesico(lon: float, lat: float, radio_km: float, vertices: int = CIRCULO_VERTICES) -> list[list[float]]:
    anillo = []
    for i in range(vertices):
        bearing = 360.0 * i / vertices
        vlon, vlat = destino_geodesico(lon, lat, bearing, radio_km)
        anillo.append([round(vlon, PRECISION), round(vlat, PRECISION)])
    anillo.append(anillo[0])  # cierra el anillo
    return anillo


def build_colisiones_influencia() -> None:
    fc = cargar_geojson(COLISIONES)
    features = fc["features"]

    salida = []
    for feat in features:
        lon, lat = feat["geometry"]["coordinates"][:2]
        anillo = circulo_geodesico(lon, lat, COLISIONES_RADIO_KM)
        props = dict(feat["properties"])
        props["radio_km"] = COLISIONES_RADIO_KM
        salida.append(
            {
                "type": "Feature",
                "geometry": {"type": "Polygon", "coordinates": [anillo]},
                "properties": props,
            }
        )

    escribir_json(OUT_COLISIONES_INFLUENCIA, {"type": "FeatureCollection", "features": salida})
    print(
        f"OK {len(salida)} zonas de influencia (radio {COLISIONES_RADIO_KM} km) "
        f"-> {OUT_COLISIONES_INFLUENCIA.name}"
    )


# --------------------------------------------------------------------------
# 3) Conteo de capas
# --------------------------------------------------------------------------

def contar_features_geojson(path: Path) -> int:
    return len(cargar_geojson(path)["features"])


def contar_terreno(path: Path) -> int:
    with path.open(encoding="utf-8") as f:
        d = json.load(f)
    return len(d["cells"])


def contar_array_json(path: Path) -> int:
    with path.open(encoding="utf-8") as f:
        d = json.load(f)
    return len(d)


def build_conteo() -> dict:
    def ruta_rel(p: Path) -> str:
        return p.relative_to(DATA.parent).as_posix()

    conteo: dict[str, dict] = {}

    def registrar(layer_id: str, path: Path, n: int, unidad: str) -> None:
        conteo[layer_id] = {
            "n": n,
            "file": ruta_rel(path),
            "bytes": path.stat().st_size,
            "unidad": unidad,
        }

    registrar("habitat", RIESGO / "habitat.geojson", contar_features_geojson(RIESGO / "habitat.geojson"), "celdas")
    registrar("obs", DATA / "observaciones.json", contar_array_json(DATA / "observaciones.json"), "registros")
    registrar("nidos", RIESGO / "nidos.geojson", contar_features_geojson(RIESGO / "nidos.geojson"), "sitios")
    registrar("colisiones", COLISIONES, contar_features_geojson(COLISIONES), "colisiones")
    registrar(
        "colisiones_hist",
        OUT_COLISIONES_INFLUENCIA,
        contar_features_geojson(OUT_COLISIONES_INFLUENCIA),
        "zonas",
    )
    registrar("parques_eolicos", OUT_PARQUES, contar_features_geojson(OUT_PARQUES), "parques")
    registrar("wind", RIESGO / "wind.geojson", contar_features_geojson(RIESGO / "wind.geojson"), "parques")
    registrar(
        "turb",
        LAYERS / "aerogeneradores.geojson",
        contar_features_geojson(LAYERS / "aerogeneradores.geojson"),
        "aerogeneradores",
    )
    registrar("lineas", RIESGO / "lineas.geojson", contar_features_geojson(RIESGO / "lineas.geojson"), "tramos")
    registrar("projects", OUT_OTROS, contar_features_geojson(OUT_OTROS), "proyectos")
    registrar(
        "windpot",
        LAYERS / "potencial_eolico.geojson",
        contar_features_geojson(LAYERS / "potencial_eolico.geojson"),
        "áreas",
    )
    registrar(
        "vertederos", RIESGO / "vertederos.geojson", contar_features_geojson(RIESGO / "vertederos.geojson"), "sitios"
    )
    registrar(
        "ebird_densidad",
        RIESGO / "ebird_densidad.geojson",
        contar_features_geojson(RIESGO / "ebird_densidad.geojson"),
        "celdas",
    )
    registrar(
        "protected",
        LAYERS / "areas_protegidas.geojson",
        contar_features_geojson(LAYERS / "areas_protegidas.geojson"),
        "áreas",
    )
    registrar(
        "airports", LAYERS / "aeropuertos.geojson", contar_features_geojson(LAYERS / "aeropuertos.geojson"), "elementos"
    )
    registrar("terreno_3km", RIESGO / "terreno_3km.json", contar_terreno(RIESGO / "terreno_3km.json"), "celdas")
    # Veranadas y ganado ya no figuran en el panel de capas (solo alimentan el
    # motor de riesgo), por eso no se cuentan ni se ofrecen en la página de descargas.

    conteo["_generado"] = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")
    return conteo


def build_capas_conteo() -> None:
    conteo = build_conteo()
    escribir_json(OUT_CONTEO, conteo)

    print(f"\nResumen de capas -> {OUT_CONTEO.name}")
    for layer_id, info in conteo.items():
        if layer_id == "_generado":
            continue
        kb = info["bytes"] / 1024
        print(f"  {layer_id:16s} n={info['n']:>6}  {info['file']:45s} {kb:>8,.1f} KB")


def main() -> None:
    split_generacion()
    build_colisiones_influencia()
    build_capas_conteo()


if __name__ == "__main__":
    main()
