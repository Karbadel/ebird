"""Comparación antes/después del índice de riesgo al pasar el motor a la capa de parques
por estado (corte 30-06-2026) → docs/comparacion-indice-2026-10-21.md y .csv.

Entradas (JSON generados por los scripts de web/, mismo formato antes y después):
  --antes / --despues                        web/scripts/indice_snapshot.ts
  --potencial-antes / --potencial-despues    web/scripts/potencial_por_clase.ts
  --parques-antes                            copia de layers/parques_eolicos.geojson (catastro de generación, 180 parques)
  --parques-despues                          layers/parques_eolicos_estado.geojson (210 parques)
Uso:
    .venv/Scripts/python.exe src/comparar_indice_estado.py --antes A.json --despues D.json \
        --potencial-antes PA.json --potencial-despues PD.json --parques-antes P0.geojson --parques-despues P1.geojson
"""
import argparse
import csv
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path
from statistics import mean, median

from comparar_indice import (ABUND, CLASES, HAB, PERFILES, WIND, clase, descomponer, motivo, n1, score_de, sg, tabla)

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
VIGENTES = ("OPC", "En SEIA", "Otros")


def norm(s: str) -> str:
    """Nombre comparable: sin tildes, minúsculas, sin «etapa N» ni espacios sobrantes."""
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\b(etapa|fase)\s*\w+\b", "", s)
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def cargar(p: Path) -> list:
    return json.loads(p.read_text(encoding="utf-8"))["features"]


def main() -> None:
    ap = argparse.ArgumentParser()
    for k in ("antes", "despues", "potencial-antes", "potencial-despues", "parques-antes", "parques-despues"):
        ap.add_argument(f"--{k}", type=Path, required=True)
    ap.add_argument("--fecha", default="2026-10-21")
    a = ap.parse_args()

    A = json.loads(a.antes.read_text(encoding="utf-8"))["profiles"]
    D = json.loads(a.despues.read_text(encoding="utf-8"))["profiles"]
    PA = json.loads(a.potencial_antes.read_text(encoding="utf-8"))
    PD = json.loads(a.potencial_despues.read_text(encoding="utf-8"))
    P0 = [f["properties"] for f in cargar(a.parques_antes)]
    P1 = [f["properties"] for f in cargar(a.parques_despues)]

    c0 = Counter(p["categoria"] for p in P0)
    c1 = Counter(p["categoria"] for p in P1)
    vig1 = [p for p in P1 if p["categoria"] in VIGENTES]
    no_vig = Counter(p["estado"] for p in P1 if p["categoria"] == "No vigente")
    n0 = {norm(p["nombre"]): p["nombre"] for p in P0 if p["categoria"] in VIGENTES}
    n1_ = {norm(p["nombre"]): p["nombre"] for p in vig1}
    salen = sorted(n0[k] for k in set(n0) - set(n1_))
    entran = sorted(n1_[k] for k in set(n1_) - set(n0))

    md: list = []
    csv_rows: list = []
    W = md.append

    W("# Comparación del índice de riesgo antes y después de pasar el motor a la capa de parques por estado\n")
    W(f"Portal «Cóndores y Energía Eólica» · Ministerio de Energía · {a.fecha}\n")
    W("Este documento acompaña el cambio de fuente del motor: la capa de parques eólicos por estado de MINENERGIA "
      "(corte 30-06-2026) reemplaza al catastro de generación en el criterio «Cercanía a parques eólicos» y en el ranking "
      "del Motor. Los números del índice **cambian** levemente; aquí se mide cuánto y por qué.\n")

    # ── 1 ──
    W("## 1. Qué cambió en el motor\n")
    W(tabla(["Elemento", "Antes", "Después"], [
        ["Fuente de parques", "Catastro de generación (`parques_eolicos.geojson`), 180 parques",
         f"Capa por estado (`parques_eolicos_estado.geojson`), {len(P1)} parques, de los cuales {len(vig1)} vigentes"],
        ["Cercanía a parques eólicos (20 %, influencia 3 km)",
         f"{sum(c0[c] for c in VIGENTES)} parques: OPC {c0['OPC']} · En SEIA {c0['En SEIA']} · Otros {c0['Otros']}",
         f"{len(vig1)} parques vigentes: OPC {c1['OPC']} · En SEIA {c1['En SEIA']} · Otros {c1['Otros']}. "
         f"No suman los {sum(no_vig.values())} no vigentes ({', '.join(f'{v} {k.lower()}' for k, v in no_vig.items())})"],
        ["Ranking del Motor («parques operativos»)", f"{c0['OPC']} parques OPC", f"{c1['OPC']} parques OPC (en operación o en pruebas)"],
        ["Medición de la distancia", "Al punto del parque", "Sin cambio: al punto del parque (centroide de sus aerogeneradores)"],
    ]))
    W("\nSin cambios: pesos de los dos perfiles, distancias de influencia y todos los demás criterios.\n")
    W("**Diferencias de nombres entre ambas fuentes (parques vigentes).** El catastro de generación separa algunos parques por "
      "etapas («etapa 1», «etapa 2») y la capa por estado los reúne en un solo parque (p. ej. Horizonte Norte y Sur → Horizonte); además la capa por estado "
      "nombra algunos parques con su condición («Modificación», «Sin construir»), lo que genera pares salida/entrada que son el mismo parque "
      "(Cardonal, Los Cerrillos, Manantiales). Se excluyen de la capa por estado los registros duplicados de ampliaciones o modificaciones "
      "marcados como «no mapear» por el proveedor.\n")
    W(f"- Solo en el catastro anterior ({len(salen)}): " + ("; ".join(salen) if salen else "ninguno") + ".")
    W(f"- Solo en la capa por estado ({len(entran)}): " + ("; ".join(entran) if entran else "ninguno") + ".\n")

    # ── 2 ──
    resumen = {}
    for pid, plabel in PERFILES.items():
        pa, pd = A[pid]["parks30"], D[pid]["parks30"]
        assert [x["nombre"] for x in pa] == [x["nombre"] for x in pd]
        dl = [d["total"] - x["total"] for x, d in zip(pa, pd)]
        dec = [descomponer(x, d) for x, d in zip(pa, pd)]
        resumen[pid] = {"media": mean(dl), "mediana": median(dl), "min": min(dl), "max": max(dl),
                        "sube": sum(v > 0 for v in dl), "baja": sum(v < 0 for v in dl), "igual": sum(v == 0 for v in dl),
                        "clase": sum(clase(x["total"]) != clase(d["total"]) for x, d in zip(pa, pd)),
                        "wind": mean(x["wind"] for x in dec), "otros": mean(x["hab"] + x["otros"] for x in dec)}
        for x, d in zip(pa, pd):
            dd = descomponer(x, d)
            csv_rows.append({
                "perfil": plabel, "conjunto": "30 parques de referencia (catastro 2018)", "nombre": x["nombre"], "lat": x["lat"], "lng": x["lng"],
                "indice_antes": x["total"], "clase_antes": x["cat"], "indice_despues": d["total"], "clase_despues": d["cat"],
                "delta": d["total"] - x["total"], "delta_por_parques": round(dd["wind"], 2), "delta_otros": round(dd["hab"] + dd["otros"], 2),
                "criterio_principal": motivo(x, d), "cercania_antes": score_de(x, WIND), "cercania_despues": score_de(d, WIND),
            })
    r = resumen["vigente"]
    W("## 2. Los 30 parques de referencia, antes y después\n")
    W("Se puntúan los mismos 30 puntos (catastro 2018) con el motor anterior y con el actual, perfil **Vigente**. "
      "«Δ» es la diferencia del índice en puntos; «Cercanía antes/después» es el puntaje (0–1) del criterio de parques.\n")
    filas = []
    for x, d in sorted(zip(A["vigente"]["parks30"], D["vigente"]["parks30"]), key=lambda t: (t[1]["total"] - t[0]["total"], t[0]["nombre"])):
        f = lambda v: "s/d" if v is None else n1(v, 2)
        filas.append([x["nombre"].title(), x["total"], x["cat"], d["total"], d["cat"], sg(d["total"] - x["total"]),
                      f(score_de(x, WIND)), f(score_de(d, WIND))])
    W(tabla(["Parque", "Antes", "Clase antes", "Después", "Clase después", "Δ", "Cercanía antes", "Cercanía después"], filas,
            ["l", "r", "l", "r", "l", "r", "r", "r"]))
    W("\nEl cambio de estos 30 puntos no es un efecto de «vigentes vs no vigentes», sino de la ubicación: en el catastro anterior cada uno de "
      "estos puntos coincidía con el punto de un parque del catastro (cercanía 1,00); en la capa por estado el punto de cada parque es el "
      "centroide de sus aerogeneradores, que queda a cierta distancia del punto antiguo, y la cercanía baja según el decaimiento de 3 km. "
      "El efecto es mayor en parques extensos (p. ej. Punta Colorada, Talinay, Taltal).")
    W(f"\n**Resumen (perfil Vigente):** de 30 parques, {r['baja']} bajan, {r['sube']} suben y {r['igual']} quedan igual; "
      f"cambio medio {sg(r['media'], 2)} puntos (mediana {sg(r['mediana'], 1)}; mínimo {sg(r['min'])}, máximo {sg(r['max'])}). "
      f"{r['clase']} parques cambian de clase. Del cambio medio, {sg(r['wind'], 2)} puntos vienen del criterio de cercanía a parques "
      f"y {sg(r['otros'], 2)} del resto (renormalización).\n")
    s = resumen["sensibilidad"]
    W(f"Perfil **Sensibilidad del sitio** (la cercanía a parques pesa 0 % en este perfil, por eso no se mueve): {s['baja']} bajan, {s['sube']} suben, {s['igual']} igual; cambio medio {sg(s['media'], 2)} puntos "
      f"(mínimo {sg(s['min'])}, máximo {sg(s['max'])}); {s['clase']} parques cambian de clase. El detalle por parque está en el CSV.\n")

    # ── 3 ──
    W(f"## 3. Ranking del Motor: de {c0['OPC']} a {c1['OPC']} parques operativos\n")
    rk = {}
    for pid, plabel in PERFILES.items():
        RA = sorted(A[pid]["ranking"], key=lambda x: (-x["total"], x["nombre"]))
        RD = sorted(D[pid]["ranking"], key=lambda x: (-x["total"], x["nombre"]))
        pa = {norm(x["nombre"]): (i + 1, x) for i, x in enumerate(RA)}
        pd = {norm(x["nombre"]): (i + 1, x) for i, x in enumerate(RD)}
        rk[pid] = (RA, RD, pa, pd)
        for k, (pos, x) in pd.items():
            ant = pa.get(k)
            csv_rows.append({
                "perfil": plabel, "conjunto": f"Ranking: {len(RD)} parques OPC (después) vs {len(RA)} (antes)", "nombre": x["nombre"],
                "lat": x["lat"], "lng": x["lng"], "indice_antes": ant[1]["total"] if ant else "", "clase_antes": ant[1]["cat"] if ant else "",
                "indice_despues": x["total"], "clase_despues": x["cat"], "delta": (x["total"] - ant[1]["total"]) if ant else "",
                "delta_por_parques": "", "delta_otros": "", "criterio_principal": f"puesto {ant[0] if ant else '—'} → {pos}", "cercania_antes": "", "cercania_despues": "",
            })
        for k, (pos, x) in pa.items():
            if k not in pd:
                csv_rows.append({
                    "perfil": plabel, "conjunto": "Ranking: sale (solo antes)", "nombre": x["nombre"], "lat": x["lat"], "lng": x["lng"],
                    "indice_antes": x["total"], "clase_antes": x["cat"], "indice_despues": "", "clase_despues": "", "delta": "",
                    "delta_por_parques": "", "delta_otros": "", "criterio_principal": f"puesto {pos} → fuera", "cercania_antes": "", "cercania_despues": "",
                })
    RA, RD, pa, pd = rk["vigente"]
    sal = [pa[k] for k in pa if k not in pd]
    ent = [pd[k] for k in pd if k not in pa]
    W(f"Perfil **Vigente**. Parques que salen del ranking ({len(sal)}) y que entran ({len(ent)}), por nombre normalizado "
      "(sin tildes y sin «etapa N»):\n")
    W("- Salen: " + ("; ".join(f"{x['nombre']} (puesto {p}, índice {x['total']})" for p, x in sorted(sal)) or "ninguno") + ".")
    W("- Entran: " + ("; ".join(f"{x['nombre']} (puesto {p}, índice {x['total']})" for p, x in sorted(ent)) or "ninguno") + ".\n")
    comunes = [k for k in pd if k in pa]
    dif = [pd[k][1]["total"] - pa[k][1]["total"] for k in comunes]
    W(f"De los {len(comunes)} parques presentes en ambos, el índice cambia en promedio {sg(mean(dif), 2)} puntos "
      f"(mínimo {sg(min(dif))}, máximo {sg(max(dif))}); {sum(clase(pa[k][1]['total']) != clase(pd[k][1]['total']) for k in comunes)} cambian de clase.\n")
    grandes = sorted(((pa[k][0] - pd[k][0], k) for k in comunes if abs(pa[k][0] - pd[k][0]) >= 5), key=lambda t: -abs(t[0]))
    if grandes:
        W("Cambios de puesto de 5 o más lugares (los puestos se desplazan también porque cambia el número de parques):\n")
        W(tabla(["Parque", "Puesto antes", "Puesto después", "Índice antes", "Índice después"],
                [[pd[k][1]["nombre"], pa[k][0], pd[k][0], pa[k][1]["total"], pd[k][1]["total"]] for _, k in grandes], ["l", "r", "r", "r", "r"]))
        W("")
    else:
        W("Ningún parque cambia de puesto en 5 o más lugares.\n")
    W("Diez parques con mayor índice (Vigente, después):\n")
    W(tabla(["#", "Parque", "Región", "MW", "Índice", "Clase", "Puesto antes"],
            [[i + 1, x["nombre"], x["region"], n1(x["mw"], 1), x["total"], x["cat"], (pa.get(norm(x["nombre"])) or ["—"])[0]]
             for i, x in enumerate(RD[:10])], ["r", "l", "l", "r", "r", "l", "r"]))
    RAs, RDs, _, _ = rk["sensibilidad"]
    W("\nDistribución por clase:\n")
    fil = [[c, sum(x["cat"] == c for x in RA), sum(x["cat"] == c for x in RD), sum(x["cat"] == c for x in RAs), sum(x["cat"] == c for x in RDs)] for c in CLASES]
    W(tabla(["Clase", f"Vigente antes ({len(RA)})", f"Vigente después ({len(RD)})", f"Sensibilidad antes ({len(RAs)})", f"Sensibilidad después ({len(RDs)})"],
            fil, ["l", "r", "r", "r", "r"]))
    W("")

    # ── 4 ──
    W("## 4. Puntos de control repartidos por Chile\n")
    W("26 puntos fijos, mismos antes y después.\n")
    ctrl = {}
    for pid, plabel in PERFILES.items():
        ca, cd = A[pid]["control"], D[pid]["control"]
        dl = [d["total"] - x["total"] for x, d in zip(ca, cd)]
        ctrl[pid] = (mean(dl), sum(v > 0 for v in dl), sum(v < 0 for v in dl), sum(clase(x["total"]) != clase(d["total"]) for x, d in zip(ca, cd)), min(dl), max(dl))
        for x, d in zip(ca, cd):
            dd = descomponer(x, d)
            csv_rows.append({
                "perfil": plabel, "conjunto": "Puntos de control", "nombre": x["nombre"], "lat": x["lat"], "lng": x["lng"],
                "indice_antes": x["total"], "clase_antes": x["cat"], "indice_despues": d["total"], "clase_despues": d["cat"],
                "delta": d["total"] - x["total"], "delta_por_parques": round(dd["wind"], 2), "delta_otros": round(dd["hab"] + dd["otros"], 2),
                "criterio_principal": motivo(x, d), "cercania_antes": score_de(x, WIND), "cercania_despues": score_de(d, WIND),
            })
    filas = []
    for x, d, xs, ds in zip(A["vigente"]["control"], D["vigente"]["control"], A["sensibilidad"]["control"], D["sensibilidad"]["control"]):
        f = lambda v: "s/d" if v is None else n1(v, 2)
        filas.append([x["nombre"], f"{f(score_de(x, WIND))} → {f(score_de(d, WIND))}", f"{x['total']} → {d['total']} ({sg(d['total'] - x['total'])})",
                      f"{xs['total']} → {ds['total']} ({sg(ds['total'] - xs['total'])})"])
    W(tabla(["Punto", "Cercanía a parques", "Índice Vigente", "Índice Sensibilidad"], filas, ["l", "r", "r", "r"]))
    m1, u1, d1, c1_, lo1, hi1 = ctrl["vigente"]
    m2, u2, d2, c2, lo2, hi2 = ctrl["sensibilidad"]
    W(f"\nPerfil Vigente: cambio medio {sg(m1, 2)} puntos (mínimo {sg(lo1)}, máximo {sg(hi1)}; {u1} suben, {d1} bajan, {c1_} cambian de clase). "
      f"Perfil Sensibilidad del sitio: {sg(m2, 2)} puntos (mínimo {sg(lo2)}, máximo {sg(hi2)}; {u2} suben, {d2} bajan, {c2} cambian de clase).\n")

    # ── 5 ──
    W("## 5. Vista de potencial eólico (MW por clase de riesgo)\n")
    W("Las 2.277 áreas de potencial eólico bruto se puntúan en un punto interior de cada una; se recalcularon las mediciones con la nueva capa de parques.\n")
    for pid, plabel in PERFILES.items():
        ca, cd = PA[pid]["clases"], PD[pid]["clases"]
        filas = []
        for c in CLASES:
            xa, xd = ca.get(c, {"mw": 0, "n": 0}), cd.get(c, {"mw": 0, "n": 0})
            filas.append([c, n1(xa["mw"] / 1000, 2), n1(xd["mw"] / 1000, 2), sg((xd["mw"] - xa["mw"]) / 1000, 2), xa["n"], xd["n"]])
        W(f"**Perfil {plabel}**\n")
        W(tabla(["Clase", "GW antes", "GW después", "Δ GW", "Áreas antes", "Áreas después"], filas, ["l", "r", "r", "r", "r", "r"]))
        ia, id_ = PA[pid]["indice"], PD[pid]["indice"]
        ids = sorted(set(ia) & set(id_), key=int)
        dl = [id_[i] - ia[i] for i in ids]
        cc = sum(clase(ia[i]) != clase(id_[i]) for i in ids)
        W(f"\n{len(ids)} áreas: cambio medio del índice {sg(mean(dl), 2)} puntos (mediana {sg(median(dl), 1)}; mínimo {sg(min(dl))}, máximo {sg(max(dl))}; "
          f"{sum(v > 0 for v in dl)} suben, {sum(v < 0 for v in dl)} bajan, {sum(v == 0 for v in dl)} sin cambio); {cc} áreas cambian de clase.\n")
        csv_rows.append({
            "perfil": plabel, "conjunto": "Potencial eólico (resumen)", "nombre": f"{len(ids)} áreas", "lat": "", "lng": "",
            "indice_antes": round(mean(ia[i] for i in ids), 2), "clase_antes": "", "indice_despues": round(mean(id_[i] for i in ids), 2),
            "clase_despues": "", "delta": round(mean(dl), 2), "delta_por_parques": "", "delta_otros": "",
            "criterio_principal": f"{cc} áreas cambian de clase", "cercania_antes": "", "cercania_despues": "",
        })

    # ── 6 ──
    W("## 6. Limitaciones y puntos a validar\n")
    for t in [
        "**Parques caducados, rechazados y desistidos:** no suman en el índice, pero siguen disponibles en el visor como referencia histórica.",
        "**Parques en evaluación, aprobados y en construcción:** el criterio de cercanía los sigue contando (efecto acumulado), igual que antes.",
        "**Medición al punto del parque:** la distancia se mide al centroide de los aerogeneradores de cada parque, no al aerogenerador más cercano "
        "ni al borde del área de 5 × diámetro de rotor. Para parques extensos el punto puede quedar lejos de los aerogeneradores; medir al "
        "aerogenerador más cercano o al borde del área es una mejora posible, que cambiaría los resultados.",
        "**Ranking:** la cercanía a parques es constante en el ranking (cada parque es el más cercano a sí mismo), por lo que el orden lo dan los demás criterios. "
        "Algunos parques en la capa por estado están reunidos o excluidos respecto del catastro anterior (sección 1), lo que explica entradas y salidas.",
        "**Ampliaciones y modificaciones:** la capa por estado excluye Eólica Lebu (ampliación), Campo Lindo (modificación) y el agregado de Malleco Sur; "
        "pendiente de confirmar con el proveedor de los datos.",
        "**Índice indicativo y regional:** ningún resultado de este documento es una evaluación en terreno.",
    ]:
        W(f"- {t}")
    W("")
    W("## 7. Reproducir\n")
    W("Las fotografías del índice salen de `npm run indice:snapshot` y `npm run potencial:clases` (carpeta `web/`) y este documento de "
      "`src/comparar_indice_estado.py`. Las mediciones del potencial se regeneran con `npm run precompute:potencial`. "
      "Detalle por punto en `docs/comparacion-indice-2026-10-21.csv`.\n")
    W("### Fuentes\n")
    W("- MINENERGIA, capas de aerogeneradores y áreas de 5 × diámetro de rotor por estado, corte 30-06-2026.")
    W("- MINENERGIA, catastro nacional de generación, junio 2026 (fuente anterior del motor).\n")

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
