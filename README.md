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
(nginx, Apache, IIS o un CDN). No requiere Node ni backend en el servidor.

- Es una sola página (sin rutas de cliente): no hacen falta reglas de reescritura.
- Sirve todo por **HTTPS**.

Para revisar el build localmente antes de subirlo: `npm run preview`.

## Actualizar los datos (opcional)

Los datos son un snapshot manual. Para regenerarlos, corre los scripts de `src/`
(requieren Python y, para eBird, una API key en `web/.env`, ya en `.gitignore`).
Esto reescribe `web/public/data/`; luego repite el build.

## Pendiente para producción

- **Tiles del mapa (OSM / Esri):** hoy usan servidores públicos (en fase de
  prueba). Para tráfico productivo real conviene un proveedor de teselas con API
  key o un proxy propio, configurable en `web/src/components/MapView.tsx`.

Las fuentes (Barlow / Barlow Condensed) ya están **auto-hospedadas** en
`web/src/assets/fonts/` (sin CDN externo).
