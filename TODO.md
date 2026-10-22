# Pendientes — Portal Cóndor andino y energía eólica

> Lista de trabajo pendiente. Antes de planificar un hito, revisar también
> `LOG_ERRORES.md` (tropiezos y decisiones previas).

## Navegación y experiencia de uso (plan del 2026-09-25, fases no ejecutadas)

- [ ] **Pesos editables sin «Activar consulta».** Hoy el tab Riesgo bloquea pesos y
      distancias hasta activar el modo clic-en-el-mapa; separar «configurar el
      índice» de «consultar un punto».
- [ ] **Aviso del modo activo sobre el mapa.** Consulta de riesgo, medición y dibujo
      de correcciones usan el clic; mostrar cuál está activo (p. ej. «Modo consulta:
      clic en el mapa · Esc para salir»), común a los tres.
- [ ] **Entrada guiada «¿Qué quieres hacer?».** 3–4 accesos para usuarios nuevos
      (consultar un punto, comparar parques, ver potencial eólico, revisar
      colisiones); descartable y recordado en el navegador.
- [ ] **Favicon.** Falta `favicon.ico` (error 404 en la consola).
- [ ] **Detalles de la revisión gráfica del 2026-10-21 (anteriores al cambio eólico):**
      a 375 px la escala de Leaflet tapa «Ver leyenda» y al pulsarlo la página salta ~800 px
      (marcar capas en la hoja también desplaza ~60 px); al cerrar la ficha «Punto
      seleccionado» con la × el modo consulta sigue activo; la ficha abierta desde el ranking
      dice «Punto consultado» en vez del nombre del parque; «Ver en el mapa» queda bajo la escala.

## Comentarios del cliente «Sitio Cóndor» (2026-09-29)

- [ ] **Registros eBird desde GBIF (`Vultur gryphus.tsv`).** El cliente lo menciona
      («registros de eBird descargados desde GBIF el año pasado») pero no llegó.
      Pedir el original (o fecha de descarga + DOI) a Don Bernardino: sería la fuente
      de los 75.111 registros de «Densidad de avistamientos», hoy ya agregada y sin
      script en el repo. Si no existe, descarga nueva desde GBIF (Occurrences ·
      *Vultur gryphus* · dataset EOD · Chile/Argentina · formato Simple) tratada como
      actualización de datos, con comparación antes/después del índice (criterio 5 %).
      Usos: reproducir la densidad con un script, descarga citada con DOI, contrastar
      nidos C3/C4 y ofrecer registros históricos.
- [ ] **Antenas de telecomunicaciones.** El HTML entregado no trae datos: es el
      criterio `user_antenas` (peso 0 %) alimentado solo por correcciones de campo.
      Si se quiere un catastro real, conseguir fuente (p. ej. SUBTEL).
- [x] **Aerogeneradores con estado** e incorporación al motor: HECHO 2026-10-21 con los
      16 KMZ de MINENERGIA (corte 30-06-2026); ver `docs/plan-capas-eolicas-2026-10-21.md` y
      `docs/comparacion-indice-2026-10-21.md`.
- [x] **Duplicados de las capas eólicas** (2026-10-22): el encargado corrigió el KMZ `05`
      (En Operación) quitando Eólica Lebu (Ampliación, PE_024) y Malleco Sur (PE_031); confirmó
      que Campo Lindo (Modificación, PE_079) debe aparecer aunque venga `Mapear = No` (campo
      interno de su base). Ahora 211 parques (180 vigentes, OPC 72) y 6.634 aerogeneradores.
      Colores por estado definidos por él, en `EOLICO_ESTADOS` (`web/src/data/portal.ts`).
- [ ] **Distancia del criterio de parques:** hoy al centroide de los aerogeneradores (bajó
      −2,1 pts en promedio los 30 parques de referencia frente al punto del catastro viejo).
      Variantes a evaluar: aerogenerador más cercano o borde del buffer 5 × D.
- [ ] **Veranadas y ganado** (tachados por el cliente) siguen puntuando en el motor.
- [ ] **Refrescar registros eBird** (`observaciones.json`): la capa dice «≤ 30 días»
      pero los datos son de agosto de 2026.
- [ ] **Dormideros y Viento** siguen como capas dummy: sin fuente.
- [ ] **Archivos sin uso tras el cambio del motor (2026-09-29):** `web/public/data/riesgo/habitat.geojson`
      (grilla digitalizada de 30 km, reemplazada por el raster de Estrada Pacheco) y
      `web/public/data/riesgo/wind.geojson` (30 parques 2018, reemplazado por
      `layers/parques_eolicos.geojson`). No borrar aún (decisión de José); `wind.geojson` sirve
      de línea base «antes» en `docs/comparacion-indice-2026-09-29.md`.
- [ ] **Peso de la abundancia (eBird S&T 2023):** criterio en 0 % en todos los perfiles hasta
      que se defina (normalización actual: valor / P99 de Chile = 2,37).

Decisiones tomadas (2026-09-29): idoneidad sin dato al norte de ~20°S se acepta; el criterio
de cercanía a parques usa los 180 (OPC · En SEIA · Otros, efecto acumulado); en el ranking de
75 OPC la cercanía a parques vale 1 en todos y el orden lo dan los demás criterios (aceptado).
Recordatorio: tras cambiar cualquier fuente del motor, `npm run precompute:potencial` (~20 min).

## Otros pendientes ya registrados

- [ ] **Subir a GitHub** los commits locales (desde `f2a60fd`), cuando José lo pida.
- [ ] **Comité:** ¿la lejanía del potencial eólico a los nidos conocidos (133 km de
      mediana) es real o un vacío del inventario de nidos? ¿Lectura relativa
      (quintiles) en vez de umbrales fijos? ¿Cercanía a parques en el perfil
      «Sensibilidad del sitio»: 0 % o 5–10 % (efecto acumulado)?
- [ ] **Editor de polígonos** (leaflet-draw) para correcciones de campo; hoy solo
      puntos por clic.
- [ ] **Capas conmutables de límites comunales/regionales** (hoy solo buscador de
      comuna que resalta el límite).
- [ ] **Deploy:** tiles OSM/Esri → proveedor con API key o proxy para tráfico
      productivo (`MapView.tsx`).
- [ ] Regenerar `comunas_centroides.json` con el `.venv` para que el disco quede
      idéntico al archivo servido (343 comunas).
- [ ] Limpieza: `MEASURES` (`data/portal.ts`) y `.measure-item` / `.measure-tag`
      (`app.css`) sin uso (`.measure-label` SÍ se usa: herramienta de medición).
