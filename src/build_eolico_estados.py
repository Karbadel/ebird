"""
Construye las capas eólicas por estado a partir de los 16 KMZ de MINENERGIA
(corte 30-06-2026) guardados en `data/eolico_2026_06/`:

- `NN_AE_*.kmz`           aerogeneradores (Point), uno por estado.
- `NN_Buff_5x_D_Rot_*.kmz` áreas buffer de 5 x diámetro de rotor (MultiGeometry de
                           Polygon), un placemark por parque.

Exportación ArcGIS: los atributos NO están en ExtendedData sino como tabla HTML
(`<tr><td>Campo</td><td>Valor</td></tr>`) dentro del `<description>` de cada Placemark.
Los números vienen con coma decimal.

Escribe en `web/public/data/layers/`:
- `aerogeneradores_estado.geojson`  un Point por aerogenerador (sin los `Mapear = No`).
- `parques_eolicos_estado.geojson`  un Point por parque (promedio lon/lat de sus
                                    aerogeneradores).
- `buffers_5d_rotor.geojson`        Polygon/MultiPolygon por parque, simplificado (~5 m).

Se excluyen por completo (aerogeneradores, punto de parque y buffer) los 3 parques con
todos sus aerogeneradores en `Mapear = No`: PE_031 (Malleco Sur, agregado de PE_031_1 +
PE_031_2), PE_024 (Eólica Lebu, Ampliación) y PE_079 (Campo Lindo, Modificación). Lebu y
Campo Lindo vienen marcados por el proveedor; pendiente de confirmar. Con
`INCLUIR_PARQUES_SIN_MAPEAR = True` se conservarían punto y buffer de esos parques.
Salida: 210 parques, 210 buffers, 6.619 aerogeneradores (6.716 leídos, 97 excluidos).

Puro stdlib. Uso:
    python src/build_eolico_estados.py
Luego regenerar el conteo de capas:
    python src/build_capas_derivadas.py
"""

from __future__ import annotations

import html
import json
import math
import re
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
FUENTE = PROJECT / "data" / "eolico_2026_06"
LAYERS = PROJECT / "web" / "public" / "data" / "layers"

OUT_AE = LAYERS / "aerogeneradores_estado.geojson"
OUT_PARQUES = LAYERS / "parques_eolicos_estado.geojson"
OUT_BUFFERS = LAYERS / "buffers_5d_rotor.geojson"

PRECISION = 5
TOLERANCIA_GRADOS = 0.00005  # ~5 m
MAX_BYTES_BUFFERS = 2.5 * 1024 * 1024
# Parques con todos sus aerogeneradores en `Mapear = No` (PE_024, PE_031, PE_079): se excluyen
# por completo (punto, buffer y aerogeneradores), respetando la marca del proveedor.
INCLUIR_PARQUES_SIN_MAPEAR = False

# (prefijo de archivo, estado_key, texto original de Est_JUN26, categoria)
ESTADOS = [
    ("01", "calificacion", "En Calificación", "En SEIA"),
    ("02", "aprobado", "Aprobado", "Otros"),
    ("03", "construccion", "En Construcción", "Otros"),
    ("04", "pruebas", "En Pruebas", "OPC"),
    ("05", "operacion", "En Operación", "OPC"),
    ("06", "caducado", "Caducado", "No vigente"),
    ("07", "rechazado", "Rechazado", "No vigente"),
    ("08", "desistido", "Desistido", "No vigente"),
]

DIAM_PROMEDIO_OPC = 128  # m, promedio de los parques OPC (campo Di_Pro_OPC)

ESPERADO_PARQUES = 213  # leídos en los KMZ
ESPERADO_PARQUES_SALIDA = 210  # tras excluir los 3 parques sin aerogeneradores mapeables
ESPERADO_AE_TOTAL = 6716
ESPERADO_AE_EXCLUIDOS = 97

RE_FILA = re.compile(r"<tr[^>]*>\s*<td>([^<]*)</td>\s*<td>([^<]*)</td>\s*</tr>")
RE_PLACEMARK = re.compile(r"<Placemark\b.*?</Placemark>", re.S)
RE_COORDS = re.compile(r"<coordinates>\s*([^<]*?)\s*</coordinates>", re.S)
RE_POLIGONO = re.compile(r"<Polygon\b.*?</Polygon>", re.S)
RE_EXTERIOR = re.compile(r"<outerBoundaryIs>(.*?)</outerBoundaryIs>", re.S)
RE_INTERIOR = re.compile(r"<innerBoundaryIs>(.*?)</innerBoundaryIs>", re.S)


def escribir_json(path: Path, obj: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    texto = json.dumps(obj, ensure_ascii=False, allow_nan=False, separators=(",", ":"))
    path.write_text(texto, encoding="utf-8")


def numero(texto: str) -> float:
    """'136,4' -> 136.4. Devuelve int si es entero (p. ej. '149' -> 149)."""
    v = float(texto.strip().replace(",", "."))
    return int(v) if v == int(v) else v


def leer_kml(path: Path) -> list[tuple[dict[str, str], str]]:
    """[(atributos, xml del placemark)] de un KMZ."""
    with zipfile.ZipFile(path) as z:
        kml = z.read("doc.kml").decode("utf-8")
    salida = []
    for pm in RE_PLACEMARK.findall(kml):
        attrs = {html.unescape(k).strip(): html.unescape(v).strip() for k, v in RE_FILA.findall(pm)}
        salida.append((attrs, pm))
    return salida


def parse_coords(texto: str) -> list[tuple[float, float]]:
    pts = []
    for tok in texto.split():
        partes = tok.split(",")
        pts.append((float(partes[0]), float(partes[1])))
    return pts


def r5(x: float) -> float:
    return round(x, PRECISION)


# --------------------------------------------------------------------------
# Simplificación Douglas-Peucker (anillos cerrados)
# --------------------------------------------------------------------------

def _dist_seg(p, a, b, kx: float) -> float:
    ax, ay = a[0] * kx, a[1]
    bx, by = b[0] * kx, b[1]
    px, py = p[0] * kx, p[1]
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def dp_abierta(pts: list, tol: float, kx: float) -> list:
    """Douglas-Peucker iterativo sobre una polilínea abierta."""
    n = len(pts)
    if n < 3:
        return list(pts)
    keep = [False] * n
    keep[0] = keep[-1] = True
    pila = [(0, n - 1)]
    while pila:
        i, j = pila.pop()
        dmax, idx = 0.0, -1
        for k in range(i + 1, j):
            d = _dist_seg(pts[k], pts[i], pts[j], kx)
            if d > dmax:
                dmax, idx = d, k
        if idx != -1 and dmax > tol:
            keep[idx] = True
            pila.append((i, idx))
            pila.append((idx, j))
    return [p for p, k in zip(pts, keep) if k]


def simplificar_anillo(anillo: list, tol: float) -> list:
    """Simplifica un anillo cerrado conservando >= 4 puntos y el cierre."""
    pts = anillo[:-1] if anillo[0] == anillo[-1] else list(anillo)
    if len(pts) <= 3:
        return pts + [pts[0]]
    kx = math.cos(math.radians(pts[0][1]))
    # Se parte el anillo en el vértice más lejano al primero para no depender del origen.
    j = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)
    a = dp_abierta(pts[: j + 1], tol, kx)
    b = dp_abierta(pts[j:] + [pts[0]], tol, kx)
    res = a[:-1] + b[:-1]
    if len(res) < 3:  # degenerado: se conserva el original
        res = pts
    return res + [res[0]]


def area_anillo(anillo: list) -> float:
    s = 0.0
    for (x1, y1), (x2, y2) in zip(anillo, anillo[1:]):
        s += x1 * y2 - x2 * y1
    return s / 2


def redondear(anillo: list) -> list:
    """Redondea a PRECISION decimales y elimina consecutivos repetidos; deja cerrado."""
    res: list = []
    for x, y in anillo:
        p = [r5(x), r5(y)]
        if not res or res[-1] != p:
            res.append(p)
    if res[0] != res[-1]:
        res.append(res[0])
    return res


def poligonos_de_placemark(pm: str, tol: float) -> list:
    polys = []
    for xml_poly in RE_POLIGONO.findall(pm):
        ext = RE_EXTERIOR.search(xml_poly)
        assert ext, "Polygon sin outerBoundaryIs"
        anillos = [parse_coords(RE_COORDS.search(ext.group(1)).group(1))]
        for inte in RE_INTERIOR.findall(xml_poly):
            anillos.append(parse_coords(RE_COORDS.search(inte).group(1)))
        salida = []
        for i, an in enumerate(anillos):
            assert len(an) >= 4 and an[0] == an[-1], "anillo KML no cerrado o con < 4 puntos"
            s = redondear(simplificar_anillo(an, tol))
            if len(s) < 4:
                s = redondear(an)
            salida.append(s)
        polys.append(salida)
    return polys


# --------------------------------------------------------------------------
# Lectura
# --------------------------------------------------------------------------

CAMPOS_AE = ["ID_Unico", "AG", "Nombre_Cor", "Est_JUN26", "Cap_JUN26", "Sistema", "Fuente", "Propiedad", "Region", "Diam_Rotor", "Di_R_5x"]
CAMPOS_BUF = ["ID_Unico", "Nombre_Cor", "Est_JUN26", "Cap_JUN26", "Sistema", "Fuente", "Propiedad", "Region", "Fech_Act"]


def archivo(prefijo: str, tipo: str) -> Path:
    cand = sorted(FUENTE.glob(f"{prefijo}_{tipo}_*.kmz"))
    assert len(cand) == 1, f"se esperaba 1 KMZ {prefijo}_{tipo}_*, hay {len(cand)}"
    return cand[0]


def fecha_iso(texto: str) -> str:
    d, m, a = texto.split("-")
    return f"{a}-{m}-{d}"


def requerir(attrs: dict, campos: list, donde: str) -> None:
    for c in campos:
        assert c in attrs, f"{donde}: falta el campo {c}"
        assert attrs[c] != "", f"{donde}: campo vacío {c} ({attrs.get('ID_Unico')})"


def main() -> None:
    ae_all: list[dict] = []  # aerogeneradores (incluye Mapear=No, con bandera)
    buffers: dict[str, dict] = {}
    fechas = set()
    ids_por_estado: dict[str, set] = {}

    for prefijo, key, texto_estado, categoria in ESTADOS:
        ids_ae = set()
        for attrs, pm in leer_kml(archivo(prefijo, "AE")):
            requerir(attrs, CAMPOS_AE, f"AE {prefijo}")
            assert attrs["Est_JUN26"] == texto_estado, f"AE {prefijo}: estado {attrs['Est_JUN26']!r} != {texto_estado!r}"
            m = RE_COORDS.search(pm)
            lon, lat = parse_coords(m.group(1))[0]
            ae_all.append(
                {
                    "estado_key": key,
                    "estado": texto_estado,
                    "categoria": categoria,
                    "id": attrs["ID_Unico"],
                    "nombre": attrs["Nombre_Cor"],
                    "ag": int(numero(attrs["AG"])),
                    "mw": float(numero(attrs["Cap_JUN26"])),
                    "sistema": attrs["Sistema"],
                    "fuente": attrs["Fuente"],
                    "titular": attrs["Propiedad"],
                    "region": attrs["Region"],
                    "diam": numero(attrs["Diam_Rotor"]),
                    "radio": numero(attrs["Di_R_5x"]),
                    # En los parques OPC el rotor igual al promedio (128 m) es un valor imputado.
                    # Los demás estados traen Di_Pro_OPC solo como referencia (no es dato del parque).
                    "imputado": categoria == "OPC" and numero(attrs["Diam_Rotor"]) == DIAM_PROMEDIO_OPC,
                    "mapear": attrs.get("Mapear", "Si") != "No",
                    "lon": lon,
                    "lat": lat,
                }
            )
            ids_ae.add(attrs["ID_Unico"])
        ids_por_estado[key] = ids_ae

        ids_buf = set()
        for attrs, pm in leer_kml(archivo(prefijo, "Buff_5x_D_Rot")):
            requerir(attrs, CAMPOS_BUF, f"Buffer {prefijo}")
            assert attrs["Est_JUN26"] == texto_estado, f"Buffer {prefijo}: estado distinto"
            pid = attrs["ID_Unico"]
            assert pid not in buffers, f"buffer duplicado {pid}"
            fechas.add(fecha_iso(attrs["Fech_Act"]))
            buffers[pid] = {
                "attrs": attrs,
                "estado_key": key,
                "polys": poligonos_de_placemark(pm, TOLERANCIA_GRADOS),
            }
            ids_buf.add(pid)
        assert ids_ae == ids_buf, f"estado {key}: parques de AE y buffers difieren: {sorted(ids_ae ^ ids_buf)}"

    assert len(fechas) == 1, f"Fech_Act no uniforme: {fechas}"
    fecha_act = fechas.pop()

    # ids únicos entre categorías
    todos = [i for s in ids_por_estado.values() for i in s]
    assert len(todos) == len(set(todos)), "ID_Unico repetido entre estados"
    assert len(todos) == ESPERADO_PARQUES, f"parques {len(todos)} != {ESPERADO_PARQUES}"
    assert len(ae_all) == ESPERADO_AE_TOTAL, f"aerogeneradores {len(ae_all)} != {ESPERADO_AE_TOTAL}"
    excluidos = [a for a in ae_all if not a["mapear"]]
    assert len(excluidos) == ESPERADO_AE_EXCLUIDOS, f"Mapear=No {len(excluidos)} != {ESPERADO_AE_EXCLUIDOS}"

    # --- agrupación por parque ---
    por_parque: dict[str, list] = defaultdict(list)
    for a in ae_all:
        por_parque[a["id"]].append(a)

    def moda(valores: list):
        c = Counter(valores)
        return sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]

    anomalias: list[str] = []
    sin_mapeables = sorted(i for i, v in por_parque.items() if not any(a["mapear"] for a in v))

    parques_props: dict[str, dict] = {}
    for pid, v in por_parque.items():
        # consistencia AE <-> buffer
        b = buffers[pid]["attrs"]
        for campo_ae, campo_b in (("nombre", "Nombre_Cor"), ("sistema", "Sistema"), ("fuente", "Fuente"), ("titular", "Propiedad"), ("region", "Region")):
            assert all(a[campo_ae] == b[campo_b] for a in v), f"{pid}: {campo_ae} difiere entre AE y buffer"
        assert all(a["mw"] == numero(b["Cap_JUN26"]) for a in v), f"{pid}: Cap_JUN26 difiere entre AE y buffer"
        assert len({a["mw"] for a in v}) == 1
        diams = {a["diam"] for a in v}
        if len(diams) > 1:
            anomalias.append(f"{pid} {v[0]['nombre']}: diámetros de rotor distintos {sorted(diams)}")
        diam = moda([a["diam"] for a in v])
        radio = moda([a["radio"] for a in v])
        for a in v:
            if abs(a["radio"] - 5 * a["diam"]) > 0.5:
                anomalias.append(f"{pid} AG {a['ag']}: radio {a['radio']} != 5 x diámetro {a['diam']}")
                break
        v0 = v[0]
        parques_props[pid] = {
            "id_parque": pid,
            "nombre": v0["nombre"],
            "estado": v0["estado"],
            "estado_key": v0["estado_key"],
            "categoria": v0["categoria"],
            "vigente": v0["categoria"] != "No vigente",
            "potencia_mw": v0["mw"],
            "sistema": v0["sistema"],
            "fuente": v0["fuente"],
            "titular": v0["titular"],
            "region": v0["region"],
            "fecha_act": fecha_act,
            "diam_rotor_m": diam,
            "radio_buffer_m": radio,
            "rotor_imputado": any(a["imputado"] for a in v),
            "n_aerogeneradores": len(v),
        }

    # --- ¿quedan fuera los parques sin aerogeneradores mapeables? ---
    ids_incluidos = set(por_parque)
    if not INCLUIR_PARQUES_SIN_MAPEAR:
        ids_incluidos -= set(sin_mapeables)

    orden_estado = {k: i for i, (_p, k, _t, _c) in enumerate(ESTADOS)}

    def clave(pid: str):
        p = parques_props[pid]
        return (orden_estado[p["estado_key"]], p["nombre"], pid)

    esperado = ESPERADO_PARQUES if INCLUIR_PARQUES_SIN_MAPEAR else ESPERADO_PARQUES_SALIDA
    assert len(ids_incluidos) == esperado, f"parques de salida {len(ids_incluidos)} != {esperado}"

    # --- aerogeneradores ---
    feats_ae = []
    for a in sorted((a for a in ae_all if a["mapear"]), key=lambda a: (orden_estado[a["estado_key"]], a["nombre"], a["id"], a["ag"])):
        feats_ae.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [r5(a["lon"]), r5(a["lat"])]},
                "properties": {
                    "id_parque": a["id"],
                    "nombre": a["nombre"],
                    "estado": a["estado"],
                    "estado_key": a["estado_key"],
                    "categoria": a["categoria"],
                    "vigente": a["categoria"] != "No vigente",
                    "potencia_mw": a["mw"],
                    "sistema": a["sistema"],
                    "fuente": a["fuente"],
                    "titular": a["titular"],
                    "region": a["region"],
                    "fecha_act": fecha_act,
                    "ag": a["ag"],
                    "diam_rotor_m": a["diam"],
                    "radio_buffer_m": a["radio"],
                    "rotor_imputado": a["imputado"],
                },
            }
        )
    assert len(feats_ae) == ESPERADO_AE_TOTAL - ESPERADO_AE_EXCLUIDOS

    # --- parques (centroide de TODOS sus aerogeneradores) ---
    feats_parques = []
    for pid in sorted(ids_incluidos, key=clave):
        v = por_parque[pid]
        lon = sum(a["lon"] for a in v) / len(v)
        lat = sum(a["lat"] for a in v) / len(v)
        feats_parques.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [r5(lon), r5(lat)]},
                "properties": parques_props[pid],
            }
        )

    # --- buffers (con ajuste de tolerancia si pesa demasiado) ---
    def armar_buffers(tol: float):
        feats = []
        for pid in sorted(ids_incluidos, key=clave):
            polys = buffers[pid]["polys"] if tol == TOLERANCIA_GRADOS else None
            if polys is None:
                polys = buffers[pid]["polys_tol"][tol]
            if len(polys) == 1:
                geom = {"type": "Polygon", "coordinates": polys[0]}
            else:
                geom = {"type": "MultiPolygon", "coordinates": polys}
            feats.append({"type": "Feature", "geometry": geom, "properties": parques_props[pid]})
        return feats

    feats_buf = armar_buffers(TOLERANCIA_GRADOS)
    tol_usada = TOLERANCIA_GRADOS
    texto = json.dumps({"type": "FeatureCollection", "features": feats_buf}, ensure_ascii=False, allow_nan=False, separators=(",", ":"))
    if len(texto.encode("utf-8")) > MAX_BYTES_BUFFERS:
        # Reintenta con tolerancias crecientes releyendo las geometrías originales.
        for tol in (0.0001, 0.00015, 0.0002, 0.0003):
            for prefijo, key, *_ in ESTADOS:
                for attrs, pm in leer_kml(archivo(prefijo, "Buff_5x_D_Rot")):
                    buffers[attrs["ID_Unico"]].setdefault("polys_tol", {})[tol] = poligonos_de_placemark(pm, tol)
            feats_buf = armar_buffers(tol)
            texto = json.dumps({"type": "FeatureCollection", "features": feats_buf}, ensure_ascii=False, allow_nan=False, separators=(",", ":"))
            tol_usada = tol
            if len(texto.encode("utf-8")) <= MAX_BYTES_BUFFERS:
                break
    OUT_BUFFERS.parent.mkdir(parents=True, exist_ok=True)
    OUT_BUFFERS.write_text(texto, encoding="utf-8")

    # --- validaciones de geometría ---
    for f in feats_buf:
        g = f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        for poly in polys:
            for k, anillo in enumerate(poly):
                assert len(anillo) >= 4 and anillo[0] == anillo[-1], f"anillo inválido en {f['properties']['id_parque']}"
                a = area_anillo(anillo)
                if a == 0:
                    anomalias.append(f"{f['properties']['id_parque']}: anillo de área 0 tras simplificar")
                if k == 0 and a < 0:
                    pass  # orientación horaria/antihoraria no se normaliza (KML ya viene consistente)

    escribir_json(OUT_AE, {"type": "FeatureCollection", "features": feats_ae})
    escribir_json(OUT_PARQUES, {"type": "FeatureCollection", "features": feats_parques})

    # --- resumen ---
    print(f"Fecha de actualización: {fecha_act}   tolerancia buffers: {tol_usada} grados")
    print(f"{'estado':14s} {'parques':>8s} {'aeros':>7s} {'MW':>10s}")
    tot = [0, 0, 0.0]
    for _p, key, texto_estado, _c in ESTADOS:
        ps = [p for p in feats_parques if p["properties"]["estado_key"] == key]
        n_ae = sum(1 for f in feats_ae if f["properties"]["estado_key"] == key)
        mw = sum(p["properties"]["potencia_mw"] for p in ps)
        print(f"{key:14s} {len(ps):8d} {n_ae:7d} {mw:10,.1f}")
        tot[0] += len(ps)
        tot[1] += n_ae
        tot[2] += mw
    print(f"{'TOTAL':14s} {tot[0]:8d} {tot[1]:7d} {tot[2]:10,.1f}")
    for path, n in ((OUT_AE, len(feats_ae)), (OUT_PARQUES, len(feats_parques)), (OUT_BUFFERS, len(feats_buf))):
        print(f"OK {n:5d} features -> {path.name}  {path.stat().st_size / 1024:,.1f} KB")

    print(f"\nAerogeneradores excluidos (Mapear = No): {len(excluidos)}")
    for pid in sin_mapeables:
        v = por_parque[pid]
        print(f"  parque sin aerogeneradores mapeables: {pid} {v[0]['nombre']} ({len(v)} AE, {v[0]['mw']} MW)"
              f" -> {'se conserva punto y buffer' if INCLUIR_PARQUES_SIN_MAPEAR else 'EXCLUIDO por completo (Mapear = No)'}")
    rest = {a["id"] for a in excluidos} - set(sin_mapeables)
    if rest:
        print(f"  parques con AE excluidos y otros mapeados: {sorted(rest)}")
    imp = Counter(a["estado_key"] for a in ae_all if a["imputado"] and a["mapear"])
    print(f"Rotor imputado (aerogeneradores): {dict(imp)}")
    if anomalias:
        print(f"\nAnomalías ({len(anomalias)}):")
        for s in anomalias[:40]:
            print("  -", s)


if __name__ == "__main__":
    main()
