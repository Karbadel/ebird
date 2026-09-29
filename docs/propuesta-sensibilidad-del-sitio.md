# Propuesta: perfil «Sensibilidad del sitio» aplicado al potencial eólico bruto

**Portal:** Cóndor andino y energía eólica — Ministerio de Energía
**Ubicación en el portal:** Comité → pestaña *Potencial eólico* → selector *Perfil de pesos* → «Sensibilidad del sitio»
**Enlace directo:** https://condores.exploradorenergia.cl/#/comite/potencial?perfil=sensibilidad
**Estado:** propuesta técnica — **pendiente de validación del comité** (así rotulada en el portal y en el informe impreso)
**Fecha:** 25-09-2026

---

## 1. Qué pregunta responde

El índice de riesgo de colisión se puede calcular con distintos conjuntos de pesos («perfiles»). Cada perfil responde una pregunta distinta:

| Perfil | Pregunta | Uso |
|---|---|---|
| **Vigente** | ¿Qué tan riesgoso es este punto por la infraestructura que **ya existe**? | Parques en operación |
| **Sensibilidad del sitio** | Si se construyera un parque aquí, ¿qué tan **sensible** es el lugar para el cóndor? | Zonas sin parques, como el potencial eólico bruto |

## 2. Por qué hacía falta

- En el perfil Vigente, el **40 % del peso** es cercanía a parques eólicos y líneas de transmisión **existentes**.
- Las áreas de potencial eólico están, casi por definición, lejos de los parques actuales: esos criterios valen 0 y el índice sale bajo **porque no hay turbinas, no porque el sitio sea seguro** para el cóndor.
- Con el perfil Vigente, el 98 % del potencial quedaba en «Muy bajo» o «Bajo»: una cifra que podía leerse erróneamente como «zona apta para desarrollar».

## 3. Pesos: comparación entre perfiles

| Criterio | Vigente | Sensibilidad del sitio | Distancia de influencia |
|---|---|---|---|
| Cercanía a parques eólicos | 20 % | **0 %** | 3 km |
| Cercanía a líneas de transmisión | 20 % | **5 %** | 2 km |
| Idoneidad de hábitat | 20 % | **30 %** | — (valor de la celda) |
| Abundancia relativa de cóndor (eBird S&T 2023) | 0 % | 0 % | — (valor de la celda) |
| Cercanía a nidos de cóndor | 15 % | **25 %** | 8 km |
| Pendiente / rugosidad del terreno | 0 % | **10 %** | — (celda más cercana) |
| Cercanía a vertederos | 10 % | 10 % | 15 km |
| Cercanía a veranadas | 5 % | 5 % | 30 km |
| Carga ganadera regional | 5 % | 5 % | 30 km |
| Historial de colisiones cercanas | 5 % | 5 % | 10 km |
| Densidad de avistamientos (eBird) | 5 % | 5 % | — (valor de la celda) |
| Antenas de telecomunicaciones (correcciones de campo) | 0 % | 0 % | 5 km |

**No cambian entre perfiles:** las distancias de influencia, los datos, las fórmulas de cada criterio ni los umbrales de las categorías.

---

## 4. Cálculos y criterios de evaluación

### 4.1 Fuentes de datos por criterio

| Criterio | Fuente | Elementos |
|---|---|---|
| Parques eólicos | MINENERGIA, catastro de generación jun 2026: operativos (OPC), en SEIA y otros (aprobados o en construcción); efecto acumulado | 180 puntos (75 · 18 · 87) |
| Líneas de transmisión | Coordinador Eléctrico | 958 tramos |
| Idoneidad de hábitat | Estrada Pacheco et al. 2025, raster oficial (≈ 830 m) remuestreado a una grilla de 0,01° (≈ 1 km); sin dato al norte de ≈ 20° S | 751.632 celdas en Chile continental |
| Abundancia relativa (peso 0 %) | eBird Status and Trends 2023, abundancia anual, 3 km; normalizada por el percentil 99 de Chile | 68.066 celdas |
| Nidos y dormideros | eBird, códigos de nidificación C3 (probable) y C4 (confirmada) | 81 sitios |
| Vertederos | MMA (formales e ilegales) | 356 |
| Veranadas | Ganadería trashumante | 631 polígonos |
| Ganado | Cabezas por distrito (bovino, ovino, caprino), en el centroide del distrito | 5.531 puntos |
| Colisiones | Colisiones confirmadas de cóndor con aerogeneradores, 2019–2025 | 29 casos |
| Densidad eBird | eBird Basic Dataset, localidades distintas con registro por celda | 1.636 celdas |
| Terreno | DEM Copernicus GLO-30 procesado en Google Earth Engine, grilla de 3 km (cobertura ≈ Atacama a Maule, 25,5°–35° S) | 24.843 celdas |
| Potencial eólico bruto | MINENERGIA, Potencial Eólico Bruto SEN 2026 | 2.277 áreas · 2.434.585 ha · 121.727 MW |

### 4.2 Puntaje de cada criterio (0 a 1; 1 = máximo aporte al riesgo)

Todas las distancias son geodésicas (sobre la curvatura de la Tierra), en km.

- **Criterios de cercanía** (parques, líneas, nidos, vertederos, veranadas, colisiones, antenas):
  - *d* = distancia al elemento más cercano de la capa. Para polígonos (vertederos, veranadas), *d* = 0 si el punto está dentro; si no, la distancia al borde. Para líneas, la distancia al tramo más cercano.
  - **Puntaje = máx(0, 1 − d / distancia de influencia)**: vale 1 sobre el elemento y baja linealmente hasta 0 a la distancia de influencia.
  - Ejemplo: un nido a 2 km con influencia de 8 km → 1 − 2/8 = **0,75**.
- **Idoneidad de hábitat:** valor (0–1) del raster de idoneidad en la celda de ≈ 1 km que contiene el punto (el raster ya está en escala 0–1). Punto sin dato (norte de 20° S) → criterio excluido.
- **Abundancia relativa de cóndor (eBird S&T 2023):** **mín(1, abundancia / P99)**, con P99 el percentil 99 de la abundancia en Chile continental. Peso 0 % por defecto en todos los perfiles: no altera el índice hasta que se le asigne peso. Fuera del área de predicción de eBird → criterio excluido.
- **Densidad eBird:** **√(n / n_máx)**, donde *n* es el número de localidades con registro en la celda que contiene el punto y *n_máx* el máximo nacional. La raíz amortigua la fuerte concentración de observadores en pocos sitios. Fuera de celdas → 0.
- **Carga ganadera regional:** para cada especie (bovino, ovino, caprino) se toma el distrito más cercano. Si está dentro de 30 km, aporta **(1 − d/30) × (cabezas del distrito / máximo nacional de esa especie)**. El puntaje es el **promedio de los aportes de las especies que están dentro de 30 km** (0 si ninguna).
- **Pendiente / rugosidad del terreno:** celda de 3 km más cercana (si está a menos de ~5,5 km; si no, criterio excluido). **Puntaje = 0,65 × mín(1, pendiente / 35°) + 0,35 × mín(1, rugosidad / 350 m)**, donde la rugosidad es la desviación estándar de la altitud dentro de la celda.

### 4.3 Índice de riesgo (0 a 100)

**Índice = redondeo( 100 × Σ (puntaje_i × peso_i) / Σ peso_i )**

- La suma recorre solo los criterios **activos y con dato** en ese punto. Un criterio sin dato (hábitat sin valor, terreno fuera de cobertura) **se excluye y el resto de los pesos se renormaliza**; no cuenta como 0.
- Por eso los pesos no necesitan sumar 100: se normalizan sobre los criterios válidos.

**Categorías:**

| Categoría | Índice |
|---|---|
| Muy bajo | < 12 |
| Bajo | 12 – 29 |
| Medio | 30 – 49 |
| Alto | 50 – 69 |
| Muy alto | ≥ 70 |

### 4.4 Aplicación a las áreas de potencial eólico

1. **Punto evaluado por área:** para cada una de las 2.277 áreas se toma un **punto interior** del polígono (el mayor, si el área tiene varias partes): el centroide si cae dentro del polígono; si no (formas cóncavas), el centro del tramo interior más ancho de la línea horizontal que pasa por el centroide.
2. **Índice del área:** el índice (4.3) calculado en ese punto, con el perfil de pesos seleccionado.
3. **Potencia:** la fuente asigna una densidad fija de **20 ha/MW**, por lo que **MW = ha / 20** (la potencia es proporcional a la superficie).
4. **Agregación:** se suman los **MW, las ha y el número de áreas** por categoría de riesgo, a nivel nacional y por región (orden norte → sur).
5. **Cálculo técnico:** las distancias y valores de celda de cada área se precalculan una vez con el mismo motor de cálculo del portal (sin reimplementarlo), y el navegador aplica los pesos en vivo. Se verificó que el resultado es idéntico al cálculo directo punto a punto. Por eso cambiar de perfil o de pesos recalcula todo al instante.

---

## 5. Resultados sobre el potencial eólico (2.277 áreas · 121,7 GW)

| Categoría | Vigente | Sensibilidad del sitio |
|---|---|---|
| Muy bajo | 45,7 GW (37,6 %) | 25,5 GW (20,9 %) |
| Bajo | 74,6 GW (61,3 %) | 81,1 GW (66,6 %) |
| **Medio** | **1,4 GW (1,1 %)** | **15,1 GW (12,4 %)** |
| Alto / Muy alto | 0 | 0 |

- El perfil hace **visible la sensibilidad del lugar**: el potencial en categoría «Medio» pasa de 1,4 a 15,1 GW.
- **Ninguna área llega a «Alto»**: el índice máximo entre todas las áreas es **44** (Alto comienza en 50).

## 6. Por qué no aparece riesgo «Alto»

- Las áreas de potencial están a **133 km de mediana del nido conocido más cercano** (el 10 % más cercano, a 66 km). Con influencia de 8 km, solo **6 de 2.277 áreas** reciben puntaje por nidos.
- El índice es un promedio ponderado: con los criterios de cercanía en 0 en casi todas las áreas, el promedio no alcanza 50 aunque se cambien los pesos.
- Se evaluó alargar la influencia de nidos y colisiones: a 30–50 km solo 0,1–0,5 GW llegarían a «Alto». Hacerlo solo para que «aparezca riesgo» sería forzar el índice.
- **El límite está en los datos (inventario de 81 nidos de eBird), no en los pesos.**

## 7. Cautelas de interpretación

- **Potencial bruto no son proyectos:** es recurso de viento, sin descontar restricciones territoriales, ambientales ni de conexión.
- **Resultado indicativo y regional:** hábitat sin dato al norte de 20° S; terreno solo de Atacama a Maule; densidad eBird refleja esfuerzo de observación además de presencia.
- **Un punto por área:** en áreas extensas (hasta ~28.000 ha) el índice puede variar dentro de ellas.
- **No califica la aptitud de un sitio ni sustituye la evaluación ambiental** de cada proyecto.

## 8. Decisiones pendientes del comité

1. **Validar o ajustar los pesos** propuestos.
2. **Efecto acumulado:** la cercanía a parques existentes vale 0 %. ¿Se prefiere un peso bajo (5–10 %) para considerar el riesgo acumulado de sumar un parque junto a otros?
3. **Inventario de nidos:** ¿la lejanía a los nidos conocidos refleja la realidad o un vacío de información? ¿Hay fuentes adicionales (SAG, ROC, estudios de impacto ambiental)?
4. **Forma de lectura:** ¿umbrales fijos (Alto ≥ 50) o **lectura relativa** (p. ej., el 20 % de áreas más sensibles)?

## 9. Uso práctico en el portal

1. Abrir el enlace directo, o ir a Comité → Potencial eólico y elegir el perfil en el selector.
2. Marcar **«Colorear la capa en el mapa por índice»** para ver las áreas pintadas por categoría.
3. **CSV por región:** MW, ha y número de áreas por región y categoría. **CSV por área:** punto evaluado, índice y categoría de cada polígono.
4. **Imprimir / PDF:** informe con perfil, pesos activos y aviso metodológico.
5. Cambiar entre perfiles recalcula todo al instante: útil para comparar ambas lecturas.
