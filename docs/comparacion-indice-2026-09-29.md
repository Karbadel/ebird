# Comparación del índice de riesgo antes y después de actualizar las fuentes del motor

Portal «Cóndores y Energía Eólica» · Ministerio de Energía · 2026-09-29

Este documento acompaña el cambio del motor de cálculo pedido por el cliente («el motor debe leer las nuevas capas») y sirve para su validación. Los números del índice **cambian** con esta actualización; aquí se mide cuánto y por qué.

## 1. Qué cambió en el motor

| Criterio | Antes | Después |
| --- | --- | --- |
| Idoneidad de hábitat (20 %) | Grilla de 30 × 30 km digitalizada de forma provisional desde la figura publicada (1.149 celdas, 148 sin dato) | Raster oficial de Estrada Pacheco et al. (2025), ≈ 830 m, remuestreado a 0,01° (≈ 1 km): 751.632 celdas en Chile continental. El valor del raster (0–1) en el punto es el puntaje, igual que antes. Sin dato al norte de ≈ 20° S |
| Cercanía a parques eólicos (20 %, influencia 3 km) | 30 parques operativos del catastro 2018 | 180 parques del catastro MINENERGIA de junio 2026: 75 operativos (OPC) + 18 en SEIA + 87 aprobados o en construcción. Incluye proyectos en evaluación y aprobados (efecto acumulado) |
| Abundancia relativa de cóndor (eBird S&T 2023) | No existía | Criterio nuevo, **peso 0 % en todos los perfiles**: disponible y editable, pero no altera ningún resultado mientras no se le asigne peso. Puntaje = abundancia / percentil 99 de Chile (tope 1) |
| Ranking del Motor («parques operativos») | 30 parques (catastro 2018) | 75 parques operativos (OPC) del catastro 2026 |

Sin cambios: pesos por defecto de los dos perfiles, distancias de influencia, líneas de transmisión, nidos, vertederos, veranadas, ganado, colisiones, densidad eBird, terreno y antenas de campo.

## 2. Los 30 parques originales, antes y después

Se puntúan los mismos 30 puntos (catastro 2018) con el motor anterior y con el actual, perfil **Vigente**. «Δ» es la diferencia del índice en puntos; «Motivo» es el criterio que más explica el cambio.

| Parque | Antes | Clase antes | Después | Clase después | Δ | Motivo |
| --- | ---: | --- | ---: | --- | ---: | --- |
| Eolica Cuel | 38 | Medio | 30 | Medio | −8 | idoneidad de hábitat (0,68 → 0,25) |
| Eolica Los Buenos Aires | 40 | Medio | 32 | Medio | −8 | idoneidad de hábitat (0,68 → 0,24) |
| Eolica San Pedro | 33 | Medio | 25 | Bajo | −8 | idoneidad de hábitat (0,72 → 0,30) |
| Eolica San Pedro Ii | 33 | Medio | 25 | Bajo | −8 | idoneidad de hábitat (0,72 → 0,30) |
| Parque Eolico La Esperanza | 35 | Medio | 27 | Bajo | −8 | idoneidad de hábitat (0,68 → 0,26) |
| Ucuquer | 43 | Medio | 36 | Medio | −7 | idoneidad de hábitat (0,91 → 0,54) |
| Ucuquer 2 | 38 | Medio | 31 | Medio | −7 | idoneidad de hábitat (0,91 → 0,54) |
| Eolica San Juan | 41 | Medio | 36 | Medio | −5 | idoneidad de hábitat (0,95 → 0,73) |
| Eolica Talinay Oriente | 43 | Medio | 38 | Medio | −5 | idoneidad de hábitat (0,96 → 0,72) |
| Eolica Talinay Poniente | 40 | Medio | 35 | Medio | −5 | idoneidad de hábitat (0,96 → 0,74) |
| Eolica El Arrayan | 38 | Medio | 34 | Medio | −4 | idoneidad de hábitat (0,98 → 0,79) |
| Eolica Punta Colorada | 50 | Alto | 46 | Medio | −4 | idoneidad de hábitat (0,94 → 0,75) |
| Eolica Totoral | 54 | Alto | 51 | Alto | −3 | idoneidad de hábitat (0,99 → 0,85) |
| Alto Baguales | 37 | Medio | 35 | Medio | −2 | cercanía a parques |
| Canela | 48 | Medio | 46 | Medio | −2 | idoneidad de hábitat (0,99 → 0,89) |
| Canela Ii | 57 | Alto | 55 | Alto | −2 | idoneidad de hábitat (0,99 → 0,88) |
| Eolica Lebu | 29 | Bajo | 27 | Bajo | −2 | cercanía a parques |
| Eolica Los Cururos | 46 | Medio | 44 | Medio | −2 | idoneidad de hábitat (0,96 → 0,85) |
| Eolica Punta Palmeras | 39 | Medio | 37 | Medio | −2 | idoneidad de hábitat (0,96 → 0,90) |
| Parque Eolico Renaico | 33 | Medio | 31 | Medio | −2 | idoneidad de hábitat (0,58 → 0,46) |
| Valle De Los Vientos | 33 | Medio | 31 | Medio | −2 | idoneidad de hábitat (0,38 → 0,29) |
| Monte Redondo | 41 | Medio | 40 | Medio | −1 | idoneidad de hábitat (0,96 → 0,89) |
| El Toqui | 34 | Medio | 34 | Medio | 0 | sin cambio relevante |
| Alto Baguales 2 | 37 | Medio | 37 | Medio | 0 | idoneidad de hábitat (0,82 → 0,79) |
| Eolica Las Penas | 24 | Bajo | 24 | Bajo | 0 | sin cambio relevante |
| Eolica Taltal | 20 | Bajo | 20 | Bajo | 0 | idoneidad de hábitat (0,03 → 0,06) |
| Huajache | 23 | Bajo | 23 | Bajo | 0 | sin cambio relevante |
| Raki | 23 | Bajo | 23 | Bajo | 0 | sin cambio relevante |
| Eolica Lebu Iii | 27 | Bajo | 28 | Bajo | +1 | sin cambio relevante |
| Cabo Negro | 26 | Bajo | 28 | Bajo | +2 | idoneidad de hábitat (0,34 → 0,40) |

**Resumen (perfil Vigente):** de 30 parques, 22 bajan, 2 suben y 6 quedan igual; el cambio medio es −3,1 puntos (mediana −2,0; rango −8 a +2). 4 parques cambian de clase. De ese cambio medio, −2,9 puntos vienen de la idoneidad de hábitat, −0,2 de la cercanía a parques y 0,0 del resto (renormalización cuando un criterio pasa de «sin dato» a tener dato).

En el perfil **Sensibilidad del sitio** (propuesta; hábitat pesa 30 %) el efecto es mayor: 22 bajan, 4 suben, 4 igual; cambio medio −4,7 puntos (rango −15 a +5); 13 parques cambian de clase. El detalle por parque de ambos perfiles está en el CSV.

## 3. Nuevo ranking del Motor: 75 parques operativos

Perfil **Vigente**. Diez parques con mayor índice:

| # | Parque | Región | MW | Índice | Clase |
| ---: | --- | --- | ---: | ---: | --- |
| 1 | Canela II | Coquimbo | 59,4 | 55 | Alto |
| 2 | Manantiales | O'Higgins | 26,5 | 52 | Alto |
| 3 | Eólica Totoral | Coquimbo | 45,5 | 51 | Alto |
| 4 | Canela | Coquimbo | 18,0 | 46 | Medio |
| 5 | Eólica Punta Colorada | Coquimbo | 20,0 | 46 | Medio |
| 6 | Eólica Los Cururos | Coquimbo | 107,7 | 44 | Medio |
| 7 | Los Cerrillos | O'Higgins | 44,7 | 43 | Medio |
| 8 | Punta Sierra | Coquimbo | 81,2 | 42 | Medio |
| 9 | Mesamávida | Biobío | 60,0 | 41 | Medio |
| 10 | Monte Redondo | Coquimbo | 47,5 | 40 | Medio |

Distribución por clase (75 parques):

| Clase | Vigente | Sensibilidad del sitio |
| --- | ---: | ---: |
| Muy bajo | 0 | 33 |
| Bajo | 38 | 32 |
| Medio | 34 | 10 |
| Alto | 3 | 0 |
| Muy alto | 0 | 0 |

Perfil Vigente: índice mínimo 19, mediana 29, máximo 55. Hay 14 parques sin dato de abundancia (fuera del área de predicción de eBird, sobre todo en el desierto del norte); no influye porque el criterio pesa 0 %.

## 4. Puntos de control repartidos por Chile

26 puntos fijos (norte, centro y sur; cerca y lejos de parques y de nidos), mismos antes y después.

| Punto | Idoneidad antes | Idoneidad después | Índice Vigente | Índice Sensibilidad |
| --- | ---: | ---: | ---: | ---: |
| Arica, precordillera | s/d | s/d | 1 → 1 (0) | 1 → 1 (0) |
| Pozo Almonte | 0,09 | 0,03 | 25 → 24 (−1) | 13 → 11 (−2) |
| Valle de los Vientos (parque) | 0,38 | 0,31 | 31 → 30 (−1) | 21 → 18 (−3) |
| Calama, desierto alejado | 0,54 | 0,28 | 15 → 10 (−5) | 23 → 14 (−9) |
| Taltal (parque) | 0,03 | 0,06 | 18 → 18 (0) | 1 → 2 (+1) |
| Taltal, costa alejada | 0,07 | 0,59 | 6 → 16 (+10) | 8 → 25 (+17) |
| Copiapó | 0,44 | 0,59 | 16 → 19 (+3) | 19 → 23 (+4) |
| San Juan (parque) | 0,95 | 0,70 | 39 → 34 (−5) | 33 → 26 (−7) |
| Freirina (nido) | 0,86 | 0,79 | 31 → 30 (−1) | 54 → 52 (−2) |
| Punta Colorada (parque) | 0,94 | 0,75 | 47 → 44 (−3) | 33 → 28 (−5) |
| Laguna El Cepo (nido) | 0,79 | 0,95 | 32 → 35 (+3) | 60 → 64 (+4) |
| Talinay (parque) | 0,96 | 0,74 | 36 → 32 (−4) | 40 → 33 (−7) |
| Ovalle, interior alejado | 0,62 | 0,94 | 12 → 18 (+6) | 23 → 33 (+10) |
| Canela (parque) | 0,99 | 0,88 | 49 → 47 (−2) | 38 → 35 (−3) |
| Farellones (nido) | 0,99 | 0,99 | 38 → 38 (0) | 67 → 67 (0) |
| Santiago, ciudad | 0,97 | 0,60 | 27 → 20 (−7) | 39 → 28 (−11) |
| Ucuquer (parque) | 0,91 | 0,54 | 36 → 29 (−7) | 32 → 21 (−11) |
| Curicó, cordillera | 0,77 | 0,89 | 19 → 21 (+2) | 33 → 36 (+3) |
| Cuel, Los Ángeles (parque) | 0,68 | 0,25 | 37 → 29 (−8) | 25 → 11 (−14) |
| Lebu (parque) | s/d | 0,22 | 25 → 24 (−1) | 8 → 13 (+5) |
| Temuco | 0,66 | 0,26 | 18 → 11 (−7) | 24 → 10 (−14) |
| Antillanca (nido) | 0,85 | 0,64 | 31 → 27 (−4) | 57 → 50 (−7) |
| Chiloé, San Pedro (parque) | 0,72 | 0,30 | 32 → 24 (−8) | 24 → 10 (−14) |
| Cerro Castillo (nido) | 0,68 | 0,90 | 28 → 32 (+4) | 51 → 58 (+7) |
| Laguna Sofía (nido) | 0,62 | 0,84 | 29 → 33 (+4) | 51 → 59 (+8) |
| Cabo Negro (parque) | 0,34 | 0,42 | 26 → 27 (+1) | 12 → 15 (+3) |

Perfil Vigente: cambio medio −1,2 puntos (8 suben, 15 bajan, 9 cambian de clase). Perfil Sensibilidad del sitio: −1,8 puntos (10 suben, 14 bajan, 11 cambian de clase).

## 5. Vista de potencial eólico (MW por clase de riesgo)

Las 2.277 áreas de potencial eólico bruto (121,7 GW) se puntúan en un punto interior de cada una. Se recalcularon las mediciones con el motor nuevo.

**Perfil Vigente**

| Clase | GW antes | GW después | Δ GW | Áreas antes | Áreas después |
| --- | ---: | ---: | ---: | ---: | ---: |
| Muy bajo | 45,7 | 97,2 | +51,5 | 613 | 1540 |
| Bajo | 74,6 | 24,0 | −50,6 | 1594 | 715 |
| Medio | 1,4 | 0,4 | −0,9 | 70 | 22 |
| Alto | 0,0 | 0,0 | 0,0 | 0 | 0 |
| Muy alto | 0,0 | 0,0 | 0,0 | 0 | 0 |

2277 áreas: cambio medio del índice −4,9 puntos (mediana −6,0; 420 suben, 1650 bajan); 1101 áreas cambian de clase.

**Perfil Sensibilidad del sitio**

| Clase | GW antes | GW después | Δ GW | Áreas antes | Áreas después |
| --- | ---: | ---: | ---: | ---: | ---: |
| Muy bajo | 25,5 | 70,3 | +44,8 | 327 | 1165 |
| Bajo | 81,1 | 47,5 | −33,6 | 1471 | 928 |
| Medio | 15,1 | 3,9 | −11,2 | 479 | 184 |
| Alto | 0,0 | 0,0 | 0,0 | 0 | 0 |
| Muy alto | 0,0 | 0,0 | 0,0 | 0 | 0 |

2277 áreas: cambio medio del índice −9,3 puntos (mediana −10,0; 397 suben, 1770 bajan); 1246 áreas cambian de clase.

## 6. Limitaciones y puntos a validar

- **Idoneidad al norte de 20° S:** el raster oficial cubre «la mitad sur» de la distribución y no llega a Arica y Parinacota ni al norte de Tarapacá. Allí el criterio queda «sin dato» y se excluye del promedio (el resto de criterios se renormaliza). Antes tampoco había dato confiable en esa zona (celdas sin dato en la grilla provisional).
- **Cambio de resolución:** de celdas de 30 km a ≈ 1 km. Es una mejora real, pero cambia el puntaje de muchos puntos: la grilla anterior era una digitalización de la figura publicada, no el raster. Se verificó contra el raster original en 8 puntos (p. ej. Cuel 0,25; Temuco 0,27; Farellones 0,99): la grilla nueva reproduce el raster. Las mayores diferencias con la grilla anterior (hasta ±0,5 de idoneidad) están en el sur de Biobío a Los Lagos y en el norte chico, y explican casi todo el cambio del índice; en el potencial eólico esto empuja muchas áreas de «Bajo» a «Muy bajo».
- **Parques en evaluación y aprobados:** el criterio de cercanía cuenta los 180 parques, no solo los operativos. Para los puntos de control y los 30 parques originales el efecto es nulo o mínimo (la cercanía a parques solo aporta cerca de un parque y cada parque del ranking ya es el más cercano a sí mismo); el efecto acumulado aparece en zonas con proyectos nuevos y en el potencial. Si se prefiere acotarlo, el filtro por categoría es una constante del código (`PARQUES_CATEGORIAS_INDICE`).
- **Abundancia eBird S&T:** peso 0 %, informativa. Es abundancia relativa de observación (esfuerzo estandarizado), no población. Fuera del área de predicción de eBird no hay dato. Normalización por percentil 99 de Chile continental; un valor sobre el P99 se recorta a 1.
- **Ranking con 75 parques:** incluye parques de tamaño muy distinto y ubicaciones sin cercanía a nidos conocidos; la cercanía a parques es constante (todos valen 1), por lo que el orden lo dan idoneidad, nidos, vertederos, ganado y demás criterios. No sustituye la evaluación ambiental de cada proyecto.
- **Índice indicativo y regional:** ningún resultado de este documento es una evaluación en terreno.

## 7. Reproducir

Los archivos de datos se generan con `src/build_idoneidad.py`, `src/build_abundancia.py` y `src/build_rango_condor.py` (leen los archivos del cliente por ruta; no se copian al repositorio). Las fotografías del índice salen de `npm run indice:snapshot` y `npm run potencial:clases` (carpeta `web/`), y este documento de `src/comparar_indice.py`. Detalle por punto en `docs/comparacion-indice-2026-09-29.csv`.

### Fuentes

- Estrada Pacheco, R., N.L. Jácome, C.E. Borghi, V. Astore, C.I. Piña & R. Cavia. 2025. Mapping environmental suitability for Andean condor conservation in the southern half of its range. Journal for Nature Conservation 87: 126970. (Facilitado por los autores.)
- Fink, D., T. Auer, A. Johnston, M. Strimas-Mackey, S. Ligocki, O. Robinson, W. Hochachka, L. Jaromczyk, C. Crowley, K. Dunham, A. Stillman, C. Davis, M. Stokowski, V. Ruiz-Gutierrez, C. Wood & A. Rodewald. 2025. eBird Status and Trends, Data Version: 2023. Cornell Lab of Ornithology. https://science.ebird.org/en/status-and-trends/data-access/ebird-status-data-version-2023 (acceso 25/09/2025).
- MINENERGIA, catastro nacional de generación, junio 2026 (parques eólicos por estado).
