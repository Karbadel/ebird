# Cóndor andino y energía eólica — Portal de riesgo

Visor geoespacial de riesgo de colisión de cóndores (*Vultur gryphus*) con
parques eólicos, para el comité técnico del Ministerio de Energía de Chile.

Aplicación **100 % estática** (sin backend): React + Vite + TypeScript, con los
datos servidos como snapshots en `web/public/data/`.

## Estructura

- `web/` — aplicación web (frontend). **Es lo que se despliega.**
- `src/` — pipeline Python (`build_*.py`) que genera los datos. Solo se usa para
  **actualizar** los datasets; no forma parte del despliegue.

## Requisitos

- Node.js 18 o superior.

## Build de producción

```powershell
cd web
npm install
npm run build
```

Genera la carpeta **`web/dist/`** con todo el sitio estático.

### Despliegue en subcarpeta

Si el portal NO va en la raíz del dominio, define la ruta pública antes del build:

```powershell
# Ejemplo: https://mi-servidor/condores/
$env:BASE_PATH = '/condores/'
npm run build
```

(En Linux/macOS: `BASE_PATH=/condores/ npm run build`.)

## Despliegue

Copia el contenido de `web/dist/` a cualquier servidor de archivos estáticos
(nginx, Apache, IIS o un CDN).

**En el servidor no corre nada de este proyecto:** ni Node, ni Python, ni venv,
ni backend. Son solo archivos estáticos, así que **convive con otros proyectos
del mismo servidor sin conflicto** de dependencias ni de versiones — basta un
`location`/vhost que sirva la carpeta.

- Es una sola página (sin rutas de cliente): no hacen falta reglas de reescritura.
- Sirve todo por **HTTPS**.

Para revisar el build localmente antes de subirlo: `npm run preview`.

## Actualizar los datos (opcional)

Los datos son un snapshot manual. Solo se regeneran en una máquina de desarrollo
(nunca en el servidor). Con Python, en un entorno virtual aislado:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Luego corre los scripts de `src/` (para eBird, una API key en `web/.env`, ya en
`.gitignore`). Esto reescribe `web/public/data/`; después repite el build.

## Pendiente para producción

- **Tiles del mapa (OSM / Esri):** hoy usan servidores públicos (en fase de
  prueba). Para tráfico productivo real conviene un proveedor de teselas con API
  key o un proxy propio, configurable en `web/src/components/MapView.tsx`.

Las fuentes (Barlow / Barlow Condensed) ya están **auto-hospedadas** en
`web/src/assets/fonts/` (sin CDN externo).
