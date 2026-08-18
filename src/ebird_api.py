"""
Cliente mínimo para la API 2.0 de eBird.

Doc oficial: https://documenter.getpostman.com/view/664302/S1ENwy59
La API key se lee desde la variable de entorno EBIRD_API_KEY (archivo .env).
"""

import os

import requests
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://api.ebird.org/v2"


def _get(endpoint: str, params: dict | None = None) -> list | dict:
    """Hace un GET a la API de eBird incluyendo el header de autenticación."""
    api_key = os.getenv("EBIRD_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Falta EBIRD_API_KEY. Crea un archivo .env con tu API key "
            "(ver .env.example)."
        )
    url = f"{BASE_URL}{endpoint}"
    resp = requests.get(url, headers={"X-eBirdApiToken": api_key}, params=params)
    resp.raise_for_status()
    return resp.json()


def recent_observations(
    region_code: str = "CL",
    back: int = 7,
    detail: str = "simple",
    max_results: int | None = None,
) -> list[dict]:
    """
    Observaciones recientes en una región (una por especie, la más reciente).

    region_code: código de región (ej. 'CL' Chile, 'CL-VS' Valparaíso).
    back: cuántos días hacia atrás (1-30).
    detail: 'simple' o 'full' ('full' agrega observador, región, comuna, etc.).
    max_results: tope opcional de resultados.
    """
    params: dict = {"back": back, "detail": detail}
    if max_results:
        params["maxResults"] = max_results
    return _get(f"/data/obs/{region_code}/recent", params=params)


def notable_observations(region_code: str = "CL", back: int = 7) -> list[dict]:
    """Observaciones notables/raras recientes en una región."""
    return _get(f"/data/obs/{region_code}/recent/notable", params={"back": back})


def hotspots(region_code: str = "CL") -> list[dict]:
    """Hotspots de una región (devuelve CSV crudo -> lo pedimos como JSON)."""
    return _get(f"/ref/hotspot/{region_code}", params={"fmt": "json"})


def species_list(region_code: str = "CL") -> list[str]:
    """Lista de códigos de especies observadas alguna vez en la región."""
    return _get(f"/product/spplist/{region_code}")


def location_observations(loc_id: str, back: int = 30) -> list[dict]:
    """
    Observaciones recientes en una ubicación específica (hotspot o localidad).

    loc_id: ID de la localidad/hotspot (ej. 'L1234567').
    back: cuántos días hacia atrás (1-30).
    """
    return _get(f"/data/obs/{loc_id}/recent", params={"back": back})


def hotspot_info(loc_id: str) -> dict:
    """Información de un hotspot (nombre, coordenadas, nº de especies, etc.)."""
    return _get(f"/ref/hotspot/info/{loc_id}")


def taxonomy(
    species_codes: list[str] | None = None, locale: str | None = None
) -> list[dict]:
    """
    Taxonomía de eBird. Si se pasan species_codes, filtra a esas especies;
    si no, devuelve la taxonomía completa.

    locale: idioma de los nombres comunes (ej. 'es', 'en'). Por defecto inglés.
    """
    params: dict = {"fmt": "json"}
    if species_codes:
        params["species"] = ",".join(species_codes)
    if locale:
        params["locale"] = locale
    return _get("/ref/taxonomy/ebird", params=params)


def subnational1_regions(country: str = "CL") -> list[dict]:
    """Lista de regiones (subnacional 1) de un país. Devuelve code + name."""
    return _get(f"/ref/region/list/subnational1/{country}", params={"fmt": "json"})
