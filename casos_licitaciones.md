# Banco de Casos para Licitaciones — Casos reales de empresas

> **Origen de este documento:** una propuesta inicial (brainstorm externo) planteaba una campaña de ciencia ficción — una "ciudad mecánica" llamada Aegis alimentada por un "Aether-Core" — como marco narrativo para las licitaciones. Se conserva de esa propuesta lo que sí es útil pedagógicamente (la estructura de tres crisis alineadas a los tres bloques de ecuaciones diferenciales del temario, la idea de una herramienta web con simulación numérica y visualización en vivo, y una mecánica de puntuación por presupuesto). **Se descarta el marco fantástico** y se sustituye cada crisis por un incidente real, documentado y con fuente, ocurrido en una empresa real — consistente con el enfoque de "consultoría de ingeniería aplicada" de la plataforma (§1 de `implementation_plan_v2.md`).
>
> Este documento resuelve el pendiente de Fase 0 "Redactar 3-5 casos para licitaciones iniciales" (`implementation_plan_v2.md` §15) con 3 casos completos; quedan 2 casos adicionales por redactar antes de Fase 5. Cada caso está pensado para una sesión de licitación con el formato ya definido en §10 (presentación del caso 5-8 min → planteo 10-15 min → resolución 10-15 min → revisión 5-7 min), y la puntuación por podio de Tokens de esa misma sección aplica sin cambios.

---

## Caso 1 — Contaminación viral en un biorreactor farmacéutico

**Módulo / tema:** Módulo 1 — ecuaciones separables y lineales de primer orden (mezcla en tanques).

### El caso real

En junio de 2009, Genzyme Corporation detectó contaminación por **Vesivirus 2117** (un calicivirus) en uno de los seis biorreactores de su planta de Allston Landing (Boston, MA), usada para producir **Cerezyme** (enfermedad de Gaucher), **Fabrazyme** (enfermedad de Fabry), **Myozyme** (enfermedad de Pompe) y **Thyrogen** (diagnóstico de cáncer de tiroides). Genzyme detuvo la producción y cerró la planta varias semanas para descontaminarla por completo; casi todo el material en proceso para Cerezyme tuvo que desecharse y miles de pacientes con estas enfermedades raras quedaron con acceso limitado a su tratamiento durante meses. Una inspección posterior de la FDA (oct–nov 2009) encontró fallas adicionales de control de calidad, y en 2010 la agencia impuso un decreto de consentimiento con **$175 millones en utilidades cedidas**; estimaciones de la época hablaban de hasta **$300 millones en ventas perdidas** por el cierre.

**Fuentes:**
- [Genzyme Plant Shutdown Could Mean up to $300M in Lost Sales — GEN (Genetic Engineering & Biotechnology News)](https://www.genengnews.com/insights/genzyme-plant-shutdown-could-mean-up-to-300m-in-lost-sales/)
- [Genzyme faces $175m FDA fines — Chemistry & Industry (SCI)](https://www.soci.org/en/chemistry-and-industry/cni-data/2010/9/genzyme-faces-175m-fda-fines)
- [Supply shortages of Cerezyme and Fabrazyme — European Medicines Agency](https://www.ema.europa.eu/en/news/supply-shortages-cerezyme-fabrazyme-priority-access-patients-most-need-treatment-recommended)
- [More contamination troubles for Genzyme — The Boston Globe](http://archive.boston.com/business/healthcare/articles/2009/11/14/more_contamination_troubles_for_genzyme/)

### El modelo

La descontaminación de un tanque o biorreactor es exactamente el problema de mezcla de primer orden que ya cubre el temario (1.3–1.4): un proceso real de **Cleaning-In-Place (CIP)**, estándar en biomanufactura, se valida calculando cuánto tiempo y qué caudal de purga se necesitan para bajar la concentración de un contaminante por debajo de un umbral regulatorio antes de una fecha límite.

$$ \frac{dA}{dt} = (\text{concentración de entrada}) \cdot Q - \frac{A(t)}{V} \cdot Q $$

donde $A(t)$ es la cantidad de contaminante en el tanque, $V$ el volumen del biorreactor y $Q$ el caudal de purga/reposición.

**Parámetros que reciben las firmas** (valores ilustrativos para el ejercicio, en el orden de magnitud real de biorreactores industriales de manufactura de biológicos, típicamente 2,000–25,000 L):
- Volumen del biorreactor $V$.
- Concentración inicial de contaminante $A_0$ (equivalente a la carga viral detectada).
- Concentración máxima aceptable para reanudar producción $A_{max}$ (el equivalente ficticio-pero-realista de un criterio de liberación de lote).
- Ventana de tiempo antes de que el lote en proceso deba desecharse (como en el caso real, donde el material de Cerezyme se perdió).

**Lo que deben calcular:** el caudal mínimo de purga $Q$ que cumple el plazo. Como bono, el caudal que minimiza el consumo de agua-para-inyección o solución de sanitización (recurso con costo, ligado a la mecánica de presupuesto de la sección final) sin exceder un límite de presión de la línea de purga — igual que en la planta real, donde purgar más rápido de lo debido puede dañar el equipo.

### Formato de la licitación

Igual al formato general de §10. Visualización sugerida: tanque animado que se vacía/llena + gráfica de concentración de contaminante vs. tiempo (equivalente directo a la idea original de "animated tank + line graph", solo que aplicada a un biorreactor real en vez de un reservorio de refrigerante de ciudad voladora).

---

## Caso 2 — Resonancia peatonal en el Millennium Bridge de Londres

**Módulo / tema:** Módulo 1 (ecuaciones lineales de orden superior) y Módulo 2 (Laplace / función de transferencia) — sistema masa-resorte-amortiguador forzado.

### El caso real

El **10 de junio de 2000** abrió el Millennium Bridge en Londres. Entre 80,000 y 100,000 peatones lo cruzaron el primer día y provocaron vibraciones laterales de hasta 70 mm por un fenómeno llamado **excitación lateral sincrónica**: los peatones ajustan inconscientemente su paso a la frecuencia natural lateral del puente (medida en **0.93 Hz**, muy cercana a la cadencia lateral natural al caminar), actuando como un "amortiguador negativo" que anula el amortiguamiento estructural efectivo. El puente cerró a los tres días. La firma de ingeniería **Arup** lo modeló como un sistema masa-resorte-amortiguador forzado y diseñó un retrofit con **37 amortiguadores viscosos** + **52 amortiguadores de masa sintonizada**, elevando el amortiguamiento modal de un **~0.5–1% del crítico a más de 20%**. El retrofit costó **£5 millones**, tomó de mayo 2001 a enero 2002, y el puente reabrió el **22 de febrero de 2002**.

**Fuentes:**
- [Stabilising the London Millennium Bridge — Ingenia, Royal Academy of Engineering](https://www.ingenia.org.uk/articles/stabilising-the-london-millennium-bridge/)
- [Synchronous lateral excitation — Wikipedia (referenciando Dallard et al. 2001)](https://en.wikipedia.org/wiki/Synchronous_lateral_excitation)
- [Damper Retrofit of the London Millennium Footbridge — Taylor Devices, ficha técnica](https://www.taylordevices.com/custom/pdf/tech-papers/66-DamperRetrofit-London.pdf)
- Dallard, P. et al. (2001). "The London Millennium Footbridge." *The Structural Engineer*, 79(22), pp. 17–33.

### El modelo

$$ m \frac{d^2x}{dt^2} + c \frac{dx}{dt} + kx = F_0 \cos(\omega t) $$

$x$ = desplazamiento lateral del tablero, $\omega \approx$ frecuencia de paso lateral peatonal (cercana a 0.93 Hz, el valor real medido en el puente), $F_0$ proporcional al número de peatones sincronizados cruzando.

**Lo que reciben las firmas:** $m$ y $k$ (o directamente la frecuencia natural $\omega_n = \sqrt{k/m}$, fijada en 0.93 Hz como en el caso real), $F_0$ como función del número de peatones, y un límite de amplitud de servicio.

**Lo que deben calcular:** el coeficiente de amortiguamiento $c$ (o el % de amortiguamiento crítico) necesario para que la amplitud en estado estable no cruce el umbral — igual que Arup, que tuvo que llevar el amortiguamiento de ~0.5% a 20% del crítico. El componente de presupuesto (cada unidad de amortiguamiento cuesta créditos) refleja que Arup instaló 89 amortiguadores por £5 millones: no se trata de maximizar el amortiguamiento a cualquier costo, sino de encontrar el mínimo que resuelve el problema.

### Formato de la licitación

Igual al formato general de §10. Visualización sugerida: onda senoidal en vivo del desplazamiento lateral; si la amplitud supera el umbral, la interfaz señala la falla (equivalente directo a la idea original, sin necesidad de lenguaje de "struts" ni ciudad mecánica).

---

## Caso 3 — Apagón de la interconexión eléctrica del oeste de EUA (10 de agosto de 1996)

**Módulo / tema:** Módulo 3 — sistemas de ecuaciones diferenciales, valores propios, plano fase (el temario oficial ya incluye "plano fase" e "interpretación del plano fase", §8.2).

### El caso real

El 10 de agosto de 1996, líneas de transmisión de 500 kV que se combaron sobre árboles cerca de Hillsboro, Oregon, dispararon una cascada de fallas en la red interconectada del oeste de Norteamérica (entonces WSCC, hoy WECC). La causa dinámica de fondo fue una **oscilación de baja frecuencia (~0.25 Hz) entre los generadores del Pacífico Noroeste y las cargas del suroeste/sur de California** que quedó prácticamente sin amortiguamiento — clasificada formalmente como una **inestabilidad de señal pequeña** (small-signal instability): los valores propios del sistema linealizado perdieron su parte real negativa. El análisis post-mortem de referencia en la industria eléctrica (Kosterev, Taylor y Mittelstadt, 1999 — ver fuentes) reconstruyó el evento con un programa de estabilidad transitoria y documentó ese modo de 0.25 Hz. La red se fragmentó en **cuatro islas eléctricas** y hasta **7.5 millones de personas en 11 estados del oeste** se quedaron sin electricidad.

**Fuentes:**
- Kosterev, D.N., Taylor, C.W., Mittelstadt, W. (1999). "Model Validation for the August 10, 1996 WSCC System Outage." *IEEE Transactions on Power Systems*, 14(3), pp. 967–979. DOI: [10.1109/59.780909](https://ieeexplore.ieee.org/document/780909).
- [1996 Western North America blackouts — Wikipedia](https://en.wikipedia.org/wiki/1996_Western_North_America_blackouts)
- [Blackout of 1996 — Northwest Power and Conservation Council](https://www.nwcouncil.org/history/Blackout/)

### El modelo

Un modelo simplificado de dos áreas interconectadas (análogo pedagógico al sistema de referencia "two-area, four-machine" usado en la literatura de estabilidad de sistemas de potencia — ver Kundur, P., *Power System Stability and Control*, McGraw-Hill, 1994 — para estudiar precisamente oscilaciones inter-área como la de 1996):

$$ \frac{dx}{dt} = ax + by, \qquad \frac{dy}{dt} = cx + dy $$

$x, y$ representan desviaciones de frecuencia/ángulo entre las dos áreas de la red.

**Lo que reciben las firmas:** una matriz inicial (el "grid split" del caso real, con acoplamiento fuerte y amortiguamiento casi nulo — el equivalente matemático del modo de 0.25 Hz sin amortiguar de 1996).

**Lo que deben calcular:** ajustes a los parámetros $a, b, c, d$ (interpretables como límites de transferencia de potencia entre áreas) que devuelvan al sistema valores propios con parte real negativa. Visualización sugerida: plano fase en vivo (coherente con el temario del Módulo 3) — las firmas sueltan una "condición inicial" y observan si converge a un nodo estable o diverge, y una matriz con valor propio positivo se presenta como lo que fue en la realidad: **una cascada de apagones**, no una explosión de fantasía.

### Formato de la licitación

Igual al formato general de §10.

---

## Mecánica de incertidumbre (sustituye los dados de la propuesta original)

La propuesta original usaba mecánica de dados d20 estilo juego de rol de mesa (tiradas de "diagnóstico de sensores" y "salvaguardas estructurales") para introducir ruido ambiental. Esa idea de introducir variabilidad es legítima y común en la práctica real de ingeniería, pero el lenguaje de rol de mesa no lo es — se reformula en términos que cualquier firma consultora reconocería:

- **Incertidumbre de instrumentación:** al abrir cada licitación, un sorteo (dado físico o generador aleatorio en la herramienta web) determina si las lecturas iniciales que recibe la firma (carga de contaminante, número de peatones, o el estado de la matriz de red) están dentro de tolerancia normal o traen un sesgo de calibración — exactamente lo que ocurre con instrumentación de campo real, que siempre tiene error de calibración. No requiere marco narrativo adicional; es un dato de entrada con ruido.
- **Margen de seguridad:** si una firma entrega una solución incorrecta pero dentro de una tolerancia razonable del valor correcto, aplica (a discreción del profesor) una reducción de penalización — análogo al **factor de seguridad** con el que se diseñan estructuras y procesos reales (un puente o un biorreactor no fallan catastróficamente ante el primer error de cálculo; están sobrediseñados para absorber cierto margen).

Esta mecánica es una herramienta pedagógica genérica y no requiere ni admite una cita de un caso real específico — a diferencia de los tres casos anteriores, que sí están documentados.

---

## Resumen

| Licitación | Módulo / tema | Empresa / evento real | Año |
|---|---|---|---|
| Purga del biorreactor | 1 — ED separables/lineales de 1er orden | Genzyme, planta de Allston Landing | 2009 |
| Resonancia peatonal | 1/2 — ED lineales de 2º orden / Laplace | Millennium Bridge, Londres (Arup) | 2000–2002 |
| Oscilación de red eléctrica | 3 — Sistemas de ED, valores propios, plano fase | Apagón WSCC, oeste de EUA | 1996 |

Quedan pendientes 2 casos adicionales (para completar el rango de 3-5 de la Fase 0) — candidatos naturales: un caso de Laplace/función de transferencia dedicado (Módulo 2) y un caso de EDP/separación de variables (Módulo 4, ecuación de onda o de calor — ej. modelos reales de transferencia de calor en manufactura).

## Nota de alcance: visualizador numérico en vivo

La propuesta original describía una herramienta con simulación numérica (Runge-Kutta / RK4) corriendo en el backend y graficando el resultado en tiempo real conforme cada firma prueba parámetros (tanque animándose, onda oscilando, plano fase actualizándose). Es una buena idea y encaja con el stack ya definido (§12.1: FastAPI + Recharts/Chart.js), pero **no está en el alcance actual del MVP**: la Fase 5 / Iteración 2 (`plan_de_tareas_mvp.md`) solo contempla el motor de licitaciones por WebSocket con captura de respuesta y podio de Tokens, sin simulación numérica en vivo. Se documenta aquí como candidato para una iteración futura, no como trabajo comprometido.
