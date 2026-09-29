"""Comparación antes/después del índice de riesgo (cambio de fuentes del motor,
2026-09-29) → docs/comparacion-indice-2026-09-29.md y docs/comparacion-indice-2026-09-29.csv.

Entradas (JSON generados por los scripts de web/, mismo formato antes y después):
  --antes / --despues            web/scripts/indice_snapshot.ts (parques 2018, ranking, control)
  --potencial-antes / --potencial-despues   web/scripts/potencial_por_clase.ts

La línea base «antes» se generó con el motor anterior (commit c5d07d0: parques del
catastro 2018 y grilla de idoneidad de 30 km); «después» con el motor actual.
Uso:
    .venv/Scripts/python.exe src/comparar_indice.py --antes A.json --despues D.json \
        --potencial-antes PA.json --potencial-despues PD.json
"""
import argparse
import csv
import json
from pathlib import Path
from statistics import mean, median

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
CLASES = ["Muy bajo", "Bajo", "Medio", "Alto", "Muy alto"]
PERFILES = {"vigente": "Vigente", "sensibilidad": "Sensibilidad del sitio"}

HAB = "Idoneidad de hábitat"
WIND = "Cercanía a parques eólicos"
ABUND = "Abundancia relativa de cóndor (eBird S&T 2023)"


def clase(total: float) -> str:
    return CLASES[4 if total >= 70 else 3 if total >= 50 else 2 if total >= 30 else 1 if total >= 12 else 0]


def n1(x, d=1):
    return f"{x:,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def sg(x, d=0):
    """Número con signo explícito."""
    s = n1(abs(x), d)
    return ("+" if x > 0 else "−" if x < 0 else "") + s if round(x, d) != 0 else n1(0, d)


def contribuciones(rows: list) -> dict:
    """Aporte de cada criterio al índice, en puntos (0–100): peso·puntaje / Σ pesos con dato."""
    wt = sum(r["weight"] for r in rows if r["score"] is not None)
    return {r["label"]: (100 * r["weight"] * r["score"] / wt if r["score"] is not None and wt else 0.0) for r in rows}


def por_nombre(lista: list) -> dict:
    return {x["nombre"]: x for x in lista}


def descomponer(a: dict, d: dict) -> dict:
    """Δ del índice repartido en idoneidad, parques y resto (en puntos, sin redondear)."""
    ca, cd = contribuciones(a["rows"]), contribuciones(d["rows"])
    dh = cd.get(HAB, 0) - ca.get(HAB, 0)
    dw = cd.get(WIND, 0) - ca.get(WIND, 0)
    tot = sum(cd.values()) - sum(ca.values())
    return {"hab": dh, "wind": dw, "otros": tot - dh - dw, "cd": cd, "ca": ca}


def score_de(item: dict, label: str):
    for r in item["rows"]:
        if r["label"] == label:
            return r["score"]
    return None


def motivo(a: dict, d: dict) -> str:
    """Texto breve: criterio que más explica el cambio."""
    dc = descomponer(a, d)
    diffs = {k: dc["cd"].get(k, 0) - dc["ca"].get(k, 0) for k in set(dc["cd"]) | set(dc["ca"])}
    if not diffs:
        return "—"
    k = max(diffs, key=lambda x: abs(diffs[x]))
    if abs(diffs[k]) < 0.5:
        return "sin cambio relevante"
    if k == HAB:
        sa, sd = score_de(a, HAB), score_de(d, HAB)
        f = lambda v: "sin dato" if v is None else n1(v, 2)
        return f"idoneidad de hábitat ({f(sa)} → {f(sd)})"
    if k == WIND:
        return "cercanía a parques"
    return k.split(" (")[0].lower()


def tabla(cab: list, filas: list, alin=None) -> str:
    alin = alin or ["l"] * len(cab)
    sep = ["---:" if x == "r" else "---" for x in alin]
    out = ["| " + " | ".join(cab) + " |", "| " + " | ".join(sep) + " |"]
    out += ["| " + " | ".join(str(c) for c in f) + " |" for f in filas]
    return "\n".join(out)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--antes", type=Path, required=True)
    ap.add_argument("--despues", type=Path, required=True)
    ap.add_argument("--potencial-antes", type=Path, required=True)
    ap.add_argument("--potencial-despues", type=Path, required=True)
    ap.add_argument("--fecha", default="2026-09-29")
    a = ap.parse_args()

    A = json.loads(a.antes.read_text(encoding="utf-8"))["profiles"]
    D = json.loads(a.despues.read_text(encoding="utf-8"))["profiles"]
    PA = json.loads(a.potencial_antes.read_text(encoding="utf-8"))
    PD = json.loads(a.potencial_despues.read_text(encoding="utf-8"))

    md: list = []
    csv_rows: list = []
    W = md.append

    W(f"# Comparación del índice de riesgo antes y después de actualizar las fuentes del motor\n")
    W(f"Portal «Cóndores y Energía Eólica» · Ministerio de Energía · {a.fecha}\n")
    W("Este documento acompaña el cambio del motor de cálculo pedido por el cliente («el motor debe leer las nuevas "
      "capas») y sirve para su validación. Los números del índice **cambian** con esta actualización; aquí se mide "
      "cuánto y por qué.\n")

    # ── 1. qué cambió ────────────────────────────────────────────────────────
    W("## 1. Qué cambió en el motor\n")
    W(tabla(
        ["Criterio", "Antes", "Después"],
        [
            ["Idoneidad de hábitat (20 %)", "Grilla de 30 × 30 km digitalizada de forma provisional desde la figura publicada "
             "(1.149 celdas, 148 sin dato)", "Raster oficial de Estrada Pacheco et al. (2025), ≈ 830 m, remuestreado a 0,01° "
             "(≈ 1 km): 751.632 celdas en Chile continental. El valor del raster (0–1) en el punto es el puntaje, igual "
             "que antes. Sin dato al norte de ≈ 20° S"],
            ["Cercanía a parques eólicos (20 %, influencia 3 km)", "30 parques operativos del catastro 2018",
             "180 parques del catastro MINENERGIA de junio 2026: 75 operativos (OPC) + 18 en SEIA + 87 aprobados o en "
             "construcción. Incluye proyectos en evaluación y aprobados (efecto acumulado)"],
            ["Abundancia relativa de cóndor (eBird S&T 2023)", "No existía", "Criterio nuevo, **peso 0 % en todos los perfiles**: "
             "disponible y editable, pero no altera ningún resultado mientras no se le asigne peso. Puntaje = "
             "abundancia / percentil 99 de Chile (tope 1)"],
            ["Ranking del Motor («parques operativos»)", "30 parques (catastro 2018)", "75 parques operativos (OPC) del catastro 2026"],
        ],
    ))
    W("\nSin cambios: pesos por defecto de los dos perfiles, distancias de influencia, líneas de transmisión, nidos, "
      "vertederos, veranadas, ganado, colisiones, densidad eBird, terreno y antenas de campo.\n")

    # ── 2. 30 parques originales ─────────────────────────────────────────────
    resumen_par = {}
    for pid, plabel in PERFILES.items():
        pa, pd = A[pid]["parks30"], D[pid]["parks30"]
        assert [x["nombre"] for x in pa] == [x["nombre"] for x in pd]
        deltas = [d["total"] - x["total"] for x, d in zip(pa, pd)]
        cambios_clase = sum(clase(x["total"]) != clase(d["total"]) for x, d in zip(pa, pd))
        dec = [descomponer(x, d) for x, d in zip(pa, pd)]
        resumen_par[pid] = {
            "n": len(pa), "media": mean(deltas), "mediana": median(deltas),
            "sube": sum(v > 0 for v in deltas), "baja": sum(v < 0 for v in deltas), "igual": sum(v == 0 for v in deltas),
            "clase": cambios_clase, "min": min(deltas), "max": max(deltas),
            "hab": mean(x["hab"] for x in dec), "wind": mean(x["wind"] for x in dec), "otros": mean(x["otros"] for x in dec),
        }
        for x, d in zip(pa, pd):
            dd = descomponer(x, d)
            csv_rows.append({
                "perfil": plabel, "conjunto": "30 parques del catastro 2018", "nombre": x["nombre"], "lat": x["lat"], "lng": x["lng"],
                "indice_antes": x["total"], "clase_antes": x["cat"], "indice_despues": d["total"], "clase_despues": d["cat"],
                "delta": d["total"] - x["total"], "delta_por_idoneidad": round(dd["hab"], 2), "delta_por_parques": round(dd["wind"], 2),
                "delta_otros": round(dd["otros"], 2), "criterio_principal": motivo(x, d),
                "idoneidad_antes": score_de(x, HAB), "idoneidad_despues": score_de(d, HAB),
            })

    r = resumen_par["vigente"]
    W("## 2. Los 30 parques originales, antes y después\n")
    W("Se puntúan los mismos 30 puntos (catastro 2018) con el motor anterior y con el actual, perfil **Vigente**. "
      "«Δ» es la diferencia del índice en puntos; «Motivo» es el criterio que más explica el cambio.\n")
    filas = []
    for x, d in sorted(zip(A["vigente"]["parks30"], D["vigente"]["parks30"]), key=lambda t: t[1]["total"] - t[0]["total"]):
        filas.append([x["nombre"].title(), x["total"], x["cat"], d["total"], d["cat"], sg(d["total"] - x["total"]), motivo(x, d)])
    W(tabla(["Parque", "Antes", "Clase antes", "Después", "Clase después", "Δ", "Motivo"], filas, ["l", "r", "l", "r", "l", "r", "l"]))
    W(f"\n**Resumen (perfil Vigente):** de {r['n']} parques, {r['baja']} bajan, {r['sube']} suben y {r['igual']} quedan igual; "
      f"el cambio medio es {sg(r['media'], 1)} puntos (mediana {sg(r['mediana'], 1)}; rango {sg(r['min'])} a {sg(r['max'])}). "
      f"{r['clase']} parques cambian de clase. De ese cambio medio, {sg(r['hab'], 1)} puntos vienen de la idoneidad de hábitat, "
      f"{sg(r['wind'], 1)} de la cercanía a parques y {sg(r['otros'], 1)} del resto (renormalización cuando un criterio pasa de "
      f"«sin dato» a tener dato).\n")
    s = resumen_par["sensibilidad"]
    W(f"En el perfil **Sensibilidad del sitio** (propuesta; hábitat pesa 30 %) el efecto es mayor: {s['baja']} bajan, {s['sube']} suben, "
      f"{s['igual']} igual; cambio medio {sg(s['media'], 1)} puntos (rango {sg(s['min'])} a {sg(s['max'])}); {s['clase']} parques cambian de clase. "
      "El detalle por parque de ambos perfiles está en el CSV.\n")

    # ── 3. Ranking de 75 OPC ─────────────────────────────────────────────────
    W("## 3. Nuevo ranking del Motor: 75 parques operativos\n")
    rank_res = {}
    for pid, plabel in PERFILES.items():
        R = D[pid]["ranking"]
        dist = {c: sum(1 for x in R if x["cat"] == c) for c in CLASES}
        rank_res[pid] = (R, dist)
        for x in R:
            csv_rows.append({
                "perfil": plabel, "conjunto": "Ranking: 75 parques operativos (OPC) 2026", "nombre": x["nombre"], "lat": x["lat"], "lng": x["lng"],
                "indice_antes": "", "clase_antes": "", "indice_despues": x["total"], "clase_despues": x["cat"], "delta": "",
                "delta_por_idoneidad": "", "delta_por_parques": "", "delta_otros": "", "criterio_principal": "",
                "idoneidad_antes": "", "idoneidad_despues": score_de(x, HAB),
            })
    R, dist = rank_res["vigente"]
    W("Perfil **Vigente**. Diez parques con mayor índice:\n")
    top = sorted(R, key=lambda x: -x["total"])[:10]
    W(tabla(["#", "Parque", "Región", "MW", "Índice", "Clase"],
            [[i + 1, x["nombre"], x["region"], n1(x["mw"], 1), x["total"], x["cat"]] for i, x in enumerate(top)],
            ["r", "l", "l", "r", "r", "l"]))
    W("\nDistribución por clase (75 parques):\n")
    Rs, dists = rank_res["sensibilidad"]
    W(tabla(["Clase", "Vigente", "Sensibilidad del sitio"], [[c, dist[c], dists[c]] for c in CLASES], ["l", "r", "r"]))
    idx = [x["total"] for x in R]
    W(f"\nPerfil Vigente: índice mínimo {min(idx)}, mediana {n1(median(idx), 0)}, máximo {max(idx)}. "
      f"Hay {sum(1 for x in R if score_de(x, ABUND) is None)} parques sin dato de abundancia (fuera del área de predicción de eBird, "
      "sobre todo en el desierto del norte); no influye porque el criterio pesa 0 %.\n")

    # ── 4. Puntos de control ─────────────────────────────────────────────────
    W("## 4. Puntos de control repartidos por Chile\n")
    W("26 puntos fijos (norte, centro y sur; cerca y lejos de parques y de nidos), mismos antes y después.\n")
    ctrl_res = {}
    for pid, plabel in PERFILES.items():
        ca, cd = A[pid]["control"], D[pid]["control"]
        for x, d in zip(ca, cd):
            dd = descomponer(x, d)
            csv_rows.append({
                "perfil": plabel, "conjunto": "Puntos de control", "nombre": x["nombre"], "lat": x["lat"], "lng": x["lng"],
                "indice_antes": x["total"], "clase_antes": x["cat"], "indice_despues": d["total"], "clase_despues": d["cat"],
                "delta": d["total"] - x["total"], "delta_por_idoneidad": round(dd["hab"], 2), "delta_por_parques": round(dd["wind"], 2),
                "delta_otros": round(dd["otros"], 2), "criterio_principal": motivo(x, d),
                "idoneidad_antes": score_de(x, HAB), "idoneidad_despues": score_de(d, HAB),
            })
        dl = [d["total"] - x["total"] for x, d in zip(ca, cd)]
        ctrl_res[pid] = (mean(dl), sum(v > 0 for v in dl), sum(v < 0 for v in dl), sum(clase(x["total"]) != clase(d["total"]) for x, d in zip(ca, cd)))
    filas = []
    for x, d, xs, ds in zip(A["vigente"]["control"], D["vigente"]["control"], A["sensibilidad"]["control"], D["sensibilidad"]["control"]):
        f = lambda v: "s/d" if v is None else n1(v, 2)
        filas.append([x["nombre"], f(score_de(x, HAB)), f(score_de(d, HAB)), f"{x['total']} → {d['total']} ({sg(d['total'] - x['total'])})",
                      f"{xs['total']} → {ds['total']} ({sg(ds['total'] - xs['total'])})"])
    W(tabla(["Punto", "Idoneidad antes", "Idoneidad después", "Índice Vigente", "Índice Sensibilidad"], filas, ["l", "r", "r", "r", "r"]))
    m1, u1, d1, c1 = ctrl_res["vigente"]
    m2, u2, d2, c2 = ctrl_res["sensibilidad"]
    W(f"\nPerfil Vigente: cambio medio {sg(m1, 1)} puntos ({u1} suben, {d1} bajan, {c1} cambian de clase). "
      f"Perfil Sensibilidad del sitio: {sg(m2, 1)} puntos ({u2} suben, {d2} bajan, {c2} cambian de clase).\n")

    # ── 5. Potencial eólico ─────────────────────────────────────────────────
    W("## 5. Vista de potencial eólico (MW por clase de riesgo)\n")
    W("Las 2.277 áreas de potencial eólico bruto (121,7 GW) se puntúan en un punto interior de cada una. "
      "Se recalcularon las mediciones con el motor nuevo.\n")
    for pid, plabel in PERFILES.items():
        ca, cd = PA[pid]["clases"], PD[pid]["clases"]
        filas = []
        for c in CLASES:
            xa, xd = ca.get(c, {"mw": 0, "n": 0}), cd.get(c, {"mw": 0, "n": 0})
            filas.append([c, n1(xa["mw"] / 1000, 1), n1(xd["mw"] / 1000, 1), sg((xd["mw"] - xa["mw"]) / 1000, 1), xa["n"], xd["n"]])
        W(f"**Perfil {plabel}**\n")
        W(tabla(["Clase", "GW antes", "GW después", "Δ GW", "Áreas antes", "Áreas después"], filas, ["l", "r", "r", "r", "r", "r"]))
        ia, id_ = PA[pid]["indice"], PD[pid]["indice"]
        ids = sorted(set(ia) & set(id_), key=int)
        dl = [id_[i] - ia[i] for i in ids]
        cc = sum(clase(ia[i]) != clase(id_[i]) for i in ids)
        W(f"\n{len(ids)} áreas: cambio medio del índice {sg(mean(dl), 1)} puntos (mediana {sg(median(dl), 1)}; "
          f"{sum(v > 0 for v in dl)} suben, {sum(v < 0 for v in dl)} bajan); {cc} áreas cambian de clase.\n")
        csv_rows.append({
            "perfil": plabel, "conjunto": "Potencial eólico (resumen)", "nombre": "2.277 áreas", "lat": "", "lng": "",
            "indice_antes": round(mean(ia[i] for i in ids), 2), "clase_antes": "", "indice_despues": round(mean(id_[i] for i in ids), 2),
            "clase_despues": "", "delta": round(mean(dl), 2), "delta_por_idoneidad": "", "delta_por_parques": "", "delta_otros": "",
            "criterio_principal": f"{cc} áreas cambian de clase", "idoneidad_antes": "", "idoneidad_despues": "",
        })

    # ── 6. limitaciones ─────────────────────────────────────────────────────
    W("## 6. Limitaciones y puntos a validar\n")
    for t in [
        "**Idoneidad al norte de 20° S:** el raster oficial cubre «la mitad sur» de la distribución y no llega a Arica y Parinacota ni "
        "al norte de Tarapacá. Allí el criterio queda «sin dato» y se excluye del promedio (el resto de criterios se renormaliza). "
        "Antes tampoco había dato confiable en esa zona (celdas sin dato en la grilla provisional).",
        "**Cambio de resolución:** de celdas de 30 km a ≈ 1 km. Es una mejora real, pero cambia el puntaje de muchos puntos: la grilla "
        "anterior era una digitalización de la figura publicada, no el raster. Se verificó contra el raster original en 8 puntos "
        "(p. ej. Cuel 0,25; Temuco 0,27; Farellones 0,99): la grilla nueva reproduce el raster. Las mayores diferencias con la grilla "
        "anterior (hasta ±0,5 de idoneidad) están en el sur de Biobío a Los Lagos y en el norte chico, y explican casi todo el cambio "
        "del índice; en el potencial eólico esto empuja muchas áreas de «Bajo» a «Muy bajo».",
        "**Parques en evaluación y aprobados:** el criterio de cercanía cuenta los 180 parques, no solo los operativos. Para los puntos "
        "de control y los 30 parques originales el efecto es nulo o mínimo (la cercanía a parques solo aporta cerca de un parque y cada "
        "parque del ranking ya es el más cercano a sí mismo); el efecto acumulado aparece en zonas con proyectos nuevos y en el potencial. "
        "Si se prefiere acotarlo, el filtro por categoría es una constante del código (`PARQUES_CATEGORIAS_INDICE`).",
        "**Abundancia eBird S&T:** peso 0 %, informativa. Es abundancia relativa de observación (esfuerzo estandarizado), no población. "
        "Fuera del área de predicción de eBird no hay dato. Normalización por percentil 99 de Chile continental; un valor sobre el P99 se recorta a 1.",
        "**Ranking con 75 parques:** incluye parques de tamaño muy distinto y ubicaciones sin cercanía a nidos conocidos; la cercanía a "
        "parques es constante (todos valen 1), por lo que el orden lo dan idoneidad, nidos, vertederos, ganado y demás criterios. "
        "No sustituye la evaluación ambiental de cada proyecto.",
        "**Índice indicativo y regional:** ningún resultado de este documento es una evaluación en terreno.",
    ]:
        W(f"- {t}")
    W("")
    W("## 7. Reproducir\n")
    W("Los archivos de datos se generan con `src/build_idoneidad.py`, `src/build_abundancia.py` y `src/build_rango_condor.py` "
      "(leen los archivos del cliente por ruta; no se copian al repositorio). Las fotografías del índice salen de "
      "`npm run indice:snapshot` y `npm run potencial:clases` (carpeta `web/`), y este documento de `src/comparar_indice.py`. "
      "Detalle por punto en `docs/comparacion-indice-2026-09-29.csv`.\n")
    W("### Fuentes\n")
    W("- Estrada Pacheco, R., N.L. Jácome, C.E. Borghi, V. Astore, C.I. Piña & R. Cavia. 2025. Mapping environmental suitability for "
      "Andean condor conservation in the southern half of its range. Journal for Nature Conservation 87: 126970. (Facilitado por los autores.)")
    W("- Fink, D., T. Auer, A. Johnston, M. Strimas-Mackey, S. Ligocki, O. Robinson, W. Hochachka, L. Jaromczyk, C. Crowley, K. Dunham, "
      "A. Stillman, C. Davis, M. Stokowski, V. Ruiz-Gutierrez, C. Wood & A. Rodewald. 2025. eBird Status and Trends, Data Version: 2023. "
      "Cornell Lab of Ornithology. https://science.ebird.org/en/status-and-trends/data-access/ebird-status-data-version-2023 (acceso 25/09/2025).")
    W("- MINENERGIA, catastro nacional de generación, junio 2026 (parques eólicos por estado).\n")

    DOCS.mkdir(exist_ok=True)
    out_md = DOCS / f"comparacion-indice-{a.fecha}.md"
    out_md.write_text("\n".join(md), encoding="utf-8")
    cols = list(csv_rows[0].keys())
    with (DOCS / f"comparacion-indice-{a.fecha}.csv").open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(csv_rows)
    print(f"OK {out_md} + CSV ({len(csv_rows)} filas)")


if __name__ == "__main__":
    main()
