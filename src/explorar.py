"""
Script de exploración inicial: trae observaciones recientes de Chile
desde la API de eBird y las muestra como tabla con pandas.

Uso:
    python src/explorar.py
"""

import pandas as pd

from ebird_api import recent_observations


def main() -> None:
    print("Consultando observaciones recientes en Chile (últimos 7 días)...")
    obs = recent_observations(region_code="CL", back=7)

    if not obs:
        print("No se recibieron observaciones.")
        return

    df = pd.DataFrame(obs)
    print(f"\nTotal de registros recibidos: {len(df)}")
    print(f"Especies distintas: {df['comName'].nunique()}\n")

    # Columnas más útiles para una primera mirada
    cols = ["comName", "sciName", "locName", "obsDt", "howMany", "lat", "lng"]
    cols = [c for c in cols if c in df.columns]
    print("Primeras observaciones:")
    print(df[cols].head(15).to_string(index=False))


if __name__ == "__main__":
    main()
