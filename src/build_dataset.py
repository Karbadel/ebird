"""
Pipeline de datos eBird -> JSON para la web.

Genera, a partir de la API 2.0 de eBird, los archivos que consume la app React:
  - especies.json       catálogo de especies (ES + EN + taxonomía)
  - observaciones.json  observaciones recientes de Chile (mapeadas a `Observation`)
  - hotspots.json       localidades presentes en las observaciones
  - regiones.json       regiones de Chile (subnacional 1)

Uso:
    python src/build_dataset.py            # todo Chile, últimos 30 días
    python src/build_dataset.py CL-LL 14   # una región, 14 días

Los JSON se escriben en web/public/data/ (listos para fetch desde la app).
"""

import json
import sys
from pathlib import Path

from ebird_api import (
    recent_observations,
    notable_observations,
    subnational1_regions,
    taxonomy,
)

OUT_DIR = Path(__file__).resolve().parent.parent / "web" / "public" / "data"

# --- Clasificación en grupos (para el color de los pins) ----------------------
# Se resuelve por orden taxonómico; algunos órdenes se afinan por familia.
GROUP_BY_ORDER: dict[str, str] = {
    "Passeriformes": "passer",
    "Psittaciformes": "loro",
    "Accipitriformes": "rapaz",
    "Falconiformes": "rapaz",
    "Cathartiformes": "rapaz",
    "Strigiformes": "rapaz",
    "Anseriformes": "acuatica",
    "Podicipediformes": "acuatica",
    "Phoenicopteriformes": "acuatica",
    "Gruiformes": "acuatica",
    "Sphenisciformes": "marina",
    "Procellariiformes": "marina",
    "Suliformes": "marina",
    "Charadriiformes": "marina",
    "Pelecaniformes": "marina",
}


def group_for(order: str, family: str) -> str:
    """Asigna un grupo (acuatica/marina/rapaz/passer/loro/otra) a una especie."""
    grp = GROUP_BY_ORDER.get(order, "otra")
    # Pelecaniformes mezcla costeras (pelícanos) con terrestres (garzas, bandurrias)
    if order == "Pelecaniformes" and family in {"Ardeidae", "Threskiornithidae"}:
        return "otra"
    return grp


def date_of(obs_dt: str) -> str:
    """'2026-08-14 14:51' -> '2026-08-14'."""
    return obs_dt.split(" ", 1)[0]


def is_exotic(o: dict) -> bool:
    """Marca exótica según el código de eBird (Naturalized/Provisional/Escapee)."""
    return bool(o.get("exoticCategory"))


def build() -> None:
    region_arg = sys.argv[1] if len(sys.argv) > 1 else "CL"
    back = int(sys.argv[2]) if len(sys.argv) > 2 else 30

    # Regiones de Chile (subnacional 1).
    print("→ Regiones de Chile…")
    regiones_raw = subnational1_regions("CL")
    regiones = [{"code": r["code"], "nombre": r["name"]} for r in regiones_raw]
    region_name = {r["code"]: r["name"] for r in regiones_raw}

    # Para tener la región de cada registro, se consulta por región y se etiqueta.
    if region_arg == "CL":
        targets = [r["code"] for r in regiones_raw]
    else:
        targets = [region_arg]

    print(f"→ Observaciones recientes (últimos {back} días) en {len(targets)} región(es)…")
    obs: list[dict] = []
    for code in targets:
        try:
            rows = recent_observations(code, back=back)
        except Exception as e:  # noqa: BLE001
            print(f"  (aviso {code}: {e})")
            continue
        for o in rows:
            o["_region"] = region_name.get(code, "")
        obs.extend(rows)
        print(f"  {code} {region_name.get(code, code):<40} {len(rows):>4}")
    print(f"  total: {len(obs)} observaciones")

    codes = sorted({o["speciesCode"] for o in obs})
    print(f"→ Taxonomía para {len(codes)} especies (ES + EN)…")
    tax_es = {t["speciesCode"]: t for t in taxonomy(codes, locale="es")}
    tax_en = {t["speciesCode"]: t for t in taxonomy(codes, locale="en")}

    # --- especies.json --------------------------------------------------------
    especies = []
    for code in codes:
        te = tax_en.get(code, {})
        ts = tax_es.get(code, {})
        especies.append(
            {
                "speciesCode": code,
                "nombreEs": ts.get("comName", te.get("comName", code)),
                "nombreEn": te.get("comName", code),
                "sciName": te.get("sciName", ""),
                "orden": te.get("order", ""),
                "familia": te.get("familySciName", ""),
                "taxonOrder": te.get("taxonOrder"),
                "category": te.get("category", "species"),
            }
        )

    # --- notables (para marcar `notable`) -------------------------------------
    print("→ Observaciones notables (para marcar rarezas)…")
    try:
        notable_codes = {
            n["speciesCode"] for n in notable_observations(region_arg, back=back)
        }
    except Exception as e:  # noqa: BLE001 — si falla, seguimos sin notables
        print(f"  (aviso: no se pudieron obtener notables: {e})")
        notable_codes = set()

    # --- observaciones.json ---------------------------------------------------
    observaciones = []
    for o in obs:
        code = o["speciesCode"]
        te = tax_en.get(code, {})
        ts = tax_es.get(code, {})
        order = te.get("order", "")
        family = te.get("familySciName", "")
        exo = is_exotic(o)
        count = o.get("howMany")
        observaciones.append(
            {
                "es": ts.get("comName", o.get("comName", code)),
                "en": te.get("comName", o.get("comName", code)),
                "sci": o.get("sciName", te.get("sciName", "")),
                "grp": group_for(order, family),
                "order": order,
                "family": family,
                "cat": "exótica" if exo else "especie",
                "lat": o.get("lat"),
                "lng": o.get("lng"),
                "region": o.get("_region", ""),
                "loc": o.get("locName", ""),
                "date": date_of(o.get("obsDt", "")),
                "count": count if isinstance(count, int) else 1,
                "obs": o.get("userDisplayName", "—"),
                "valid": bool(o.get("obsValid", True)),
                "rev": bool(o.get("obsReviewed", False)),
                "exo": exo,
                "sub": o.get("subId", ""),
                "notable": code in notable_codes,
            }
        )

    # --- hotspots.json (localidades presentes en las observaciones) -----------
    locs: dict[str, dict] = {}
    for o in obs:
        loc_id = o.get("locId")
        if loc_id and loc_id not in locs:
            locs[loc_id] = {
                "locId": loc_id,
                "nombre": o.get("locName", ""),
                "lat": o.get("lat"),
                "lng": o.get("lng"),
                "region": o.get("_region", ""),
            }
    hotspots = list(locs.values())

    # --- escribir -------------------------------------------------------------
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    _write("especies.json", especies)
    _write("observaciones.json", observaciones)
    _write("hotspots.json", hotspots)
    _write("regiones.json", regiones)

    print("\n✓ Listo. Resumen:")
    print(f"  especies       {len(especies):>5}")
    print(f"  observaciones  {len(observaciones):>5}")
    print(f"  hotspots       {len(hotspots):>5}")
    print(f"  regiones       {len(regiones):>5}")
    print(f"  → {OUT_DIR}")


def _write(name: str, data: list) -> None:
    path = OUT_DIR / name
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    build()
