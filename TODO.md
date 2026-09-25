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
