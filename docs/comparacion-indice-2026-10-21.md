# Comparación del índice de riesgo antes y después de pasar el motor a la capa de parques por estado

Portal «Cóndores y Energía Eólica» · Ministerio de Energía · 2026-10-21

Este documento acompaña el cambio de fuente del motor: la capa de parques eólicos por estado de MINENERGIA (corte 30-06-2026) reemplaza al catastro de generación en el criterio «Cercanía a parques eólicos» y en el ranking del Motor. Los números del índice **cambian** levemente; aquí se mide cuánto y por qué.

## 1. Qué cambió en el motor

| Elemento | Antes | Después |
| --- | --- | --- |
| Fuente de parques | Catastro de generación (`parques_eolicos.geojson`), 180 parques | Capa por estado (`parques_eolicos_estado.geojson`), 210 parques, de los cuales 179 vigentes |
| Cercanía a parques eólicos (20 %, influencia 3 km) | 180 parques: OPC 75 · En SEIA 18 · Otros 87 | 179 parques vigentes: OPC 71 · En SEIA 18 · Otros 90. No suman los 31 no vigentes (9 caducado, 5 rechazado, 17 desistido) |
| Ranking del Motor («parques operativos») | 75 parques OPC | 71 parques OPC (en operación o en pruebas) |
| Medición de la distancia | Al punto del parque | Sin cambio: al punto del parque (centroide de sus aerogeneradores) |

Sin cambios: pesos de los dos perfiles, distancias de influencia y todos los demás criterios.

**Diferencias de nombres entre ambas fuentes (parques vigentes).** El catastro de generación separa algunos parques por etapas («etapa 1», «etapa 2») y la capa por estado los reúne en un solo parque (p. ej. Horizonte Norte y Sur → Horizonte); además la capa por estado nombra algunos parques con su condición («Modificación», «Sin construir»), lo que genera pares salida/entrada que son el mismo parque (Cardonal, Los Cerrillos, Manantiales). Se excluyen de la capa por estado los registros duplicados de ampliaciones o modificaciones marcados como «no mapear» por el proveedor.

- Solo en el catastro anterior (7): Campo Lindo Etapa 1; Cardonal; Horizonte Norte; Horizonte Sur; Los Cerrillos; Manantiales; PMGD Dalca.
- Solo en la capa por estado (8): Camarico; Cardonal (Modificación); Horizonte; Los Cerrillos (Modificación); Manantiales (Modificación); Monte Redondo (Sin construir); Punta Palmeras (Sin Construir); Talinay A.

## 2. Los 30 parques de referencia, antes y después

Se puntúan los mismos 30 puntos (catastro 2018) con el motor anterior y con el actual, perfil **Vigente**. «Δ» es la diferencia del índice en puntos; «Cercanía antes/después» es el puntaje (0–1) del criterio de parques.

| Parque | Antes | Clase antes | Después | Clase después | Δ | Cercanía antes | Cercanía después |
| --- | ---: | --- | ---: | --- | ---: | ---: | ---: |
| Eolica Punta Colorada | 46 | Medio | 40 | Medio | −6 | 1,00 | 0,66 |
| Eolica Talinay Oriente | 38 | Medio | 33 | Medio | −5 | 1,00 | 0,73 |
| Canela Ii | 55 | Alto | 51 | Alto | −4 | 1,00 | 0,78 |
| Eolica Los Buenos Aires | 32 | Medio | 28 | Bajo | −4 | 1,00 | 0,77 |
| Eolica San Pedro Ii | 25 | Bajo | 21 | Bajo | −4 | 1,00 | 0,83 |
| Eolica Talinay Poniente | 35 | Medio | 31 | Medio | −4 | 1,00 | 0,80 |
| Eolica Taltal | 20 | Bajo | 16 | Bajo | −4 | 1,00 | 0,76 |
| Canela | 46 | Medio | 43 | Medio | −3 | 1,00 | 0,82 |
| Eolica El Arrayan | 34 | Medio | 31 | Medio | −3 | 1,00 | 0,84 |
| Eolica Totoral | 51 | Alto | 48 | Medio | −3 | 1,00 | 0,86 |
| Parque Eolico La Esperanza | 27 | Bajo | 24 | Bajo | −3 | 1,00 | 0,87 |
| Eolica Lebu Iii | 28 | Bajo | 26 | Bajo | −2 | 1,00 | 0,94 |
| Eolica San Juan | 36 | Medio | 34 | Medio | −2 | 1,00 | 0,86 |
| Eolica San Pedro | 25 | Bajo | 23 | Bajo | −2 | 1,00 | 0,92 |
| Ucuquer 2 | 31 | Medio | 29 | Bajo | −2 | 1,00 | 0,90 |
| Valle De Los Vientos | 31 | Medio | 29 | Bajo | −2 | 1,00 | 0,89 |
| Alto Baguales 2 | 37 | Medio | 36 | Medio | −1 | 1,00 | 0,98 |
| Cabo Negro | 28 | Bajo | 27 | Bajo | −1 | 1,00 | 1,00 |
| El Toqui | 34 | Medio | 33 | Medio | −1 | 1,00 | 0,98 |
| Eolica Cuel | 30 | Medio | 29 | Bajo | −1 | 1,00 | 0,95 |
| Eolica Lebu | 27 | Bajo | 26 | Bajo | −1 | 1,00 | 0,93 |
| Eolica Los Cururos | 44 | Medio | 43 | Medio | −1 | 1,00 | 0,92 |
| Huajache | 23 | Bajo | 22 | Bajo | −1 | 1,00 | 0,92 |
| Monte Redondo | 40 | Medio | 39 | Medio | −1 | 1,00 | 0,94 |
| Parque Eolico Renaico | 31 | Medio | 30 | Medio | −1 | 1,00 | 0,92 |
| Ucuquer | 36 | Medio | 35 | Medio | −1 | 1,00 | 0,96 |
| Alto Baguales | 35 | Medio | 35 | Medio | 0 | 0,92 | 0,90 |
| Eolica Las Penas | 24 | Bajo | 24 | Bajo | 0 | 1,00 | 0,96 |
| Eolica Punta Palmeras | 37 | Medio | 37 | Medio | 0 | 1,00 | 0,97 |
| Raki | 23 | Bajo | 23 | Bajo | 0 | 1,00 | 1,00 |

El cambio de estos 30 puntos no es un efecto de «vigentes vs no vigentes», sino de la ubicación: en el catastro anterior cada uno de estos puntos coincidía con el punto de un parque del catastro (cercanía 1,00); en la capa por estado el punto de cada parque es el centroide de sus aerogeneradores, que queda a cierta distancia del punto antiguo, y la cercanía baja según el decaimiento de 3 km. El efecto es mayor en parques extensos (p. ej. Punta Colorada, Talinay, Taltal).

**Resumen (perfil Vigente):** de 30 parques, 26 bajan, 0 suben y 4 quedan igual; cambio medio −2,10 puntos (mediana −2,0; mínimo −6, máximo 0). 5 parques cambian de clase. Del cambio medio, −2,12 puntos vienen del criterio de cercanía a parques y 0,00 del resto (renormalización).

Perfil **Sensibilidad del sitio** (la cercanía a parques pesa 0 % en este perfil, por eso no se mueve): 0 bajan, 0 suben, 30 igual; cambio medio 0,00 puntos (mínimo 0, máximo 0); 0 parques cambian de clase. El detalle por parque está en el CSV.

## 3. Ranking del Motor: de 75 a 71 parques operativos

Perfil **Vigente**. Parques que salen del ranking (6) y que entran (4), por nombre normalizado (sin tildes y sin «etapa N»):

- Salen: Manantiales (puesto 2, índice 52); Los Cerrillos (puesto 7, índice 43); Cardonal (puesto 30, índice 32); Campo Lindo Etapa 1 (puesto 53, índice 24); Horizonte Norte (puesto 70, índice 20); Horizonte Sur (puesto 71, índice 20).
- Entran: Los Cerrillos (Modificación) (puesto 1, índice 52); Manantiales (Modificación) (puesto 5, índice 51); Cardonal (Modificación) (puesto 30, índice 32); Horizonte (puesto 70, índice 19).

De los 67 parques presentes en ambos, el índice cambia en promedio +0,30 puntos (mínimo −4, máximo +6); 4 cambian de clase.

Cambios de puesto de 5 o más lugares (los puestos se desplazan también porque cambia el número de parques):

| Parque | Puesto antes | Puesto después | Índice antes | Índice después |
| --- | ---: | ---: | ---: | ---: |
| Malleco Sur | 59 | 38 | 24 | 29 |
| Eólica San Pedro II | 49 | 36 | 25 | 29 |
| Eólica Los Buenos Aires | 31 | 43 | 32 | 28 |
| Llanos del Viento | 56 | 45 | 24 | 28 |
| Mesamávida | 9 | 18 | 41 | 37 |
| Pemuco | 28 | 19 | 34 | 37 |
| Tolpán Sur | 21 | 14 | 36 | 39 |
| San Gabriel (Modificación) | 14 | 8 | 38 | 44 |
| Renaico I | 33 | 39 | 31 | 29 |
| Cuel | 36 | 31 | 30 | 31 |
| La Flor | 32 | 37 | 32 | 29 |
| Piloto H2V HIF | 41 | 46 | 28 | 28 |
| Pampa Fidelia | 73 | 68 | 20 | 20 |
| Antofagasta | 74 | 69 | 19 | 19 |

Diez parques con mayor índice (Vigente, después):

| # | Parque | Región | MW | Índice | Clase | Puesto antes |
| ---: | --- | --- | ---: | ---: | --- | ---: |
| 1 | Los Cerrillos (Modificación) | O'Higgins | 47,2 | 52 | Alto | — |
| 2 | Canela II | Coquimbo | 59,4 | 51 | Alto | 1 |
| 3 | Eólica Punta Colorada | Coquimbo | 20,0 | 51 | Alto | 5 |
| 4 | Eólica Totoral | Coquimbo | 45,5 | 51 | Alto | 3 |
| 5 | Manantiales (Modificación) | O'Higgins | 29,5 | 51 | Alto | — |
| 6 | Canela | Coquimbo | 18,0 | 44 | Medio | 4 |
| 7 | Eólica Los Cururos | Coquimbo | 107,7 | 44 | Medio | 6 |
| 8 | San Gabriel (Modificación) | Araucanía | 180,0 | 44 | Medio | 14 |
| 9 | Punta Sierra | Coquimbo | 81,2 | 42 | Medio | 8 |
| 10 | Negrete | Biobío | 35,3 | 41 | Medio | 11 |

Distribución por clase:

| Clase | Vigente antes (75) | Vigente después (71) | Sensibilidad antes (75) | Sensibilidad después (71) |
| --- | ---: | ---: | ---: | ---: |
| Muy bajo | 0 | 0 | 33 | 29 |
| Bajo | 38 | 37 | 32 | 31 |
| Medio | 34 | 29 | 10 | 11 |
| Alto | 3 | 5 | 0 | 0 |
| Muy alto | 0 | 0 | 0 | 0 |

## 4. Puntos de control repartidos por Chile

26 puntos fijos, mismos antes y después.

| Punto | Cercanía a parques | Índice Vigente | Índice Sensibilidad |
| --- | ---: | ---: | ---: |
| Arica, precordillera | 0,00 → 0,00 | 1 → 1 (0) | 1 → 1 (0) |
| Pozo Almonte | 0,00 → 0,00 | 24 → 24 (0) | 11 → 11 (0) |
| Valle de los Vientos (parque) | 0,87 → 0,76 | 30 → 27 (−3) | 18 → 18 (0) |
| Calama, desierto alejado | 0,00 → 0,00 | 10 → 10 (0) | 14 → 14 (0) |
| Taltal (parque) | 0,91 → 0,68 | 18 → 14 (−4) | 2 → 2 (0) |
| Taltal, costa alejada | 0,00 → 0,00 | 16 → 16 (0) | 25 → 25 (0) |
| Copiapó | 0,00 → 0,00 | 19 → 19 (0) | 23 → 23 (0) |
| San Juan (parque) | 0,92 → 0,81 | 34 → 32 (−2) | 26 → 26 (0) |
| Freirina (nido) | 0,00 → 0,00 | 30 → 30 (0) | 52 → 52 (0) |
| Punta Colorada (parque) | 0,91 → 0,65 | 44 → 39 (−5) | 28 → 28 (0) |
| Laguna El Cepo (nido) | 0,00 → 0,00 | 35 → 35 (0) | 64 → 64 (0) |
| Talinay (parque) | 0,00 → 0,07 | 32 → 33 (+1) | 33 → 33 (0) |
| Ovalle, interior alejado | 0,00 → 0,00 | 18 → 18 (0) | 33 → 33 (0) |
| Canela (parque) | 0,88 → 0,79 | 47 → 46 (−1) | 35 → 35 (0) |
| Farellones (nido) | 0,00 → 0,00 | 38 → 38 (0) | 67 → 67 (0) |
| Santiago, ciudad | 0,00 → 0,00 | 20 → 20 (0) | 28 → 28 (0) |
| Ucuquer (parque) | 0,84 → 0,84 | 29 → 29 (0) | 21 → 21 (0) |
| Curicó, cordillera | 0,00 → 0,00 | 21 → 21 (0) | 36 → 36 (0) |
| Cuel, Los Ángeles (parque) | 0,85 → 0,90 | 29 → 30 (+1) | 11 → 11 (0) |
| Lebu (parque) | 0,81 → 0,75 | 24 → 23 (−1) | 13 → 13 (0) |
| Temuco | 0,00 → 0,00 | 11 → 11 (0) | 10 → 10 (0) |
| Antillanca (nido) | 0,00 → 0,00 | 27 → 27 (0) | 50 → 50 (0) |
| Chiloé, San Pedro (parque) | 0,94 → 0,82 | 24 → 21 (−3) | 10 → 10 (0) |
| Cerro Castillo (nido) | 0,00 → 0,00 | 32 → 32 (0) | 58 → 58 (0) |
| Laguna Sofía (nido) | 0,00 → 0,00 | 33 → 33 (0) | 59 → 59 (0) |
| Cabo Negro (parque) | 0,97 → 0,97 | 27 → 27 (0) | 15 → 15 (0) |

Perfil Vigente: cambio medio −0,65 puntos (mínimo −5, máximo +1; 2 suben, 7 bajan, 2 cambian de clase). Perfil Sensibilidad del sitio: 0,00 puntos (mínimo 0, máximo 0; 0 suben, 0 bajan, 0 cambian de clase).

## 5. Vista de potencial eólico (MW por clase de riesgo)

Las 2.277 áreas de potencial eólico bruto se puntúan en un punto interior de cada una; se recalcularon las mediciones con la nueva capa de parques.

**Perfil Vigente**

| Clase | GW antes | GW después | Δ GW | Áreas antes | Áreas después |
| --- | ---: | ---: | ---: | ---: | ---: |
| Muy bajo | 97,24 | 97,66 | +0,43 | 1540 | 1540 |
| Bajo | 24,05 | 23,67 | −0,38 | 715 | 712 |
| Medio | 0,44 | 0,40 | −0,05 | 22 | 25 |
| Alto | 0,00 | 0,00 | 0,00 | 0 | 0 |
| Muy alto | 0,00 | 0,00 | 0,00 | 0 | 0 |

2277 áreas: cambio medio del índice +0,01 puntos (mediana 0,0; mínimo −13, máximo +13; 60 suben, 71 bajan, 2146 sin cambio); 23 áreas cambian de clase.

**Perfil Sensibilidad del sitio**

| Clase | GW antes | GW después | Δ GW | Áreas antes | Áreas después |
| --- | ---: | ---: | ---: | ---: | ---: |
| Muy bajo | 70,26 | 70,26 | 0,00 | 1165 | 1165 |
| Bajo | 47,54 | 47,54 | 0,00 | 928 | 928 |
| Medio | 3,93 | 3,93 | 0,00 | 184 | 184 |
| Alto | 0,00 | 0,00 | 0,00 | 0 | 0 |
| Muy alto | 0,00 | 0,00 | 0,00 | 0 | 0 |

2277 áreas: cambio medio del índice 0,00 puntos (mediana 0,0; mínimo 0, máximo 0; 0 suben, 0 bajan, 2277 sin cambio); 0 áreas cambian de clase.

## 6. Limitaciones y puntos a validar

- **Parques caducados, rechazados y desistidos:** no suman en el índice, pero siguen disponibles en el visor como referencia histórica.
- **Parques en evaluación, aprobados y en construcción:** el criterio de cercanía los sigue contando (efecto acumulado), igual que antes.
- **Medición al punto del parque:** la distancia se mide al centroide de los aerogeneradores de cada parque, no al aerogenerador más cercano ni al borde del área de 5 × diámetro de rotor. Para parques extensos el punto puede quedar lejos de los aerogeneradores; medir al aerogenerador más cercano o al borde del área es una mejora posible, que cambiaría los resultados.
- **Ranking:** la cercanía a parques es constante en el ranking (cada parque es el más cercano a sí mismo), por lo que el orden lo dan los demás criterios. Algunos parques en la capa por estado están reunidos o excluidos respecto del catastro anterior (sección 1), lo que explica entradas y salidas.
- **Ampliaciones y modificaciones:** la capa por estado excluye Eólica Lebu (ampliación), Campo Lindo (modificación) y el agregado de Malleco Sur. La corrección del proveedor del 22-10-2026 confirmó como duplicados a Eólica Lebu (ampliación) y Malleco Sur, y los quitó de la fuente; El encargado confirmó además que Campo Lindo (modificación) sí debe aparecer, por lo que desde esa fecha se publica: 211 parques (180 vigentes) y el ranking del Motor pasa de 71 a 72 parques OPC. Las cifras de esta comparación corresponden a la versión del 21-10-2026, sin Campo Lindo.
- **Índice indicativo y regional:** ningún resultado de este documento es una evaluación en terreno.

## 7. Reproducir

Las fotografías del índice salen de `npm run indice:snapshot` y `npm run potencial:clases` (carpeta `web/`) y este documento de `src/comparar_indice_estado.py`. Las mediciones del potencial se regeneran con `npm run precompute:potencial`. Detalle por punto en `docs/comparacion-indice-2026-10-21.csv`.

### Fuentes

- MINENERGIA, capas de aerogeneradores y áreas de 5 × diámetro de rotor por estado, corte 30-06-2026.
- MINENERGIA, catastro nacional de generación, junio 2026 (fuente anterior del motor).
