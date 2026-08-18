# Proyecto de análisis de datos eBird (Chile)

Análisis de datos de aves de [eBird](https://ebird.org) para Chile.

## Estructura

```
ebird/
├── src/
│   ├── ebird_api.py   # Cliente mínimo de la API 2.0 de eBird
│   └── explorar.py    # Script de exploración inicial (obs. recientes)
├── data/              # Aquí irá el EBD (no versionado)
├── .env               # API key (NO se sube a git)
├── .env.example       # Plantilla para el .env
├── requirements.txt
└── README.md
```

## Puesta en marcha

```powershell
# 1. Crear entorno virtual
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Verificar que el .env tiene tu EBIRD_API_KEY (ver .env.example)

# 4. Ejecutar la exploración
python src/explorar.py
```

## Fuentes de datos

1. **API 2.0 de eBird** — datos recientes / tiempo real. Requiere API key
   ([generar aquí](https://ebird.org/api/keygen)).
2. **eBird Basic Dataset (EBD)** — base histórica completa. Se solicita en
   [ebird.org/data/download](https://ebird.org/data/download). Ver el manual
   `Manual-de-uso-base-de-datos-eBird-Chile-version-agosto-2025.pdf`.

## Notas sobre el EBD (según el manual eBird Chile)

- Cada fila = un registro de una especie en un lugar, fecha y hora.
- Deduplicar listas compartidas usando `GROUP IDENTIFIER`.
- Para análisis de presencia/ausencia, filtrar `ALL SPECIES REPORTED = 1`.
- `OBSERVATION COUNT` puede ser `"X"` (presencia sin conteo).
- En Chile los filtros de revisión son automáticos: posibles errores locales.
