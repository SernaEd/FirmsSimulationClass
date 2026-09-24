# Tarea: Ecuaciones Lineales de Orden Superior
### Sesiones 9 y 10 — Cálculo III

**Qué cubre esta tarea:** integra la teoría de la Sesión 9 (existencia y unicidad, independencia lineal, PVI vs. PVF, $y=y_c+y_p$) con los cuatro métodos de solución de la Sesión 10 (ecuación característica, Cauchy-Euler, el anulador, y su aplicación a un sistema físico forzado).

**Cómo trabajar cada pregunta:**
1. Intenta resolverla por tu cuenta primero — aunque no llegues a la respuesta, escribe hasta dónde llegaste.
2. Si te atoras, o quieres verificar tu resultado, usa una IA **como tutora**, no como solucionario: copia el archivo `tarea_sesiones_9_10_prompt_tutor_ia.md` al inicio de una conversación nueva y pídele ayuda con la pregunta específica donde te trabaste. Está diseñada para darte pistas y hacerte preguntas, no para resolverte el problema de inmediato.
3. Llena la bitácora corta que aparece después de cada pregunta — es parte de la entrega.

**Tiempo estimado:** 90–120 minutos. **Formato:** entregable individual, en su cuaderno o documento — incluyan su procedimiento y la bitácora de cada pregunta.

---

## Parte 1 — Teoría y Fundamentos (Sesión 9)

**1. Existencia y Unicidad**

$$(x^2-9)y'' + \frac{1}{x-1}y' + y = 0,\qquad y(2)=1,\ y'(2)=0.$$

Determina el intervalo más grande que contiene a $x_0=2$ donde el teorema de existencia y unicidad garantiza que este PVI tiene una única solución. Justifica cada restricción que consideraste — incluida cualquiera que **no** haya terminado afectando tu respuesta.

> **Bitácora:** ¿La intentaste sola/o antes de usar la IA? ¿Qué le preguntaste (si la usaste)? ¿Qué te ayudó a entender? Confianza en el tema antes → después de usar la IA (1–5):

**2. Wronskiano e Independencia Lineal**

Las funciones $y_1=e^{-x}$ y $y_2=e^{4x}$ son ambas soluciones de $y''-3y'-4y=0$. Calcula su Wronskiano y determina si son linealmente independientes. Si lo son, ¿forman un conjunto fundamental de soluciones para esta ecuación? Justifica.

> **Bitácora:** ¿La intentaste sola/o antes de usar la IA? ¿Qué le preguntaste (si la usaste)? ¿Qué te ayudó a entender? Confianza antes → después (1–5):

**3. Problemas de Valores en la Frontera**

Considera la ecuación $y''+9y=0$.

(a) Encuentra su solución general.
(b) Con $y(0)=0$ y $y(\pi)=0$, ¿cuántas soluciones tiene este PVF?
(c) Con $y(0)=0$ y $y(\pi)=5$, ¿cuántas soluciones tiene?
(d) Con $y(0)=0$ y $y(\pi/6)=4$, ¿cuántas soluciones tiene?

En cada inciso, justifica con tu solución general — no basta con la respuesta.

> **Bitácora:** ¿La intentaste sola/o antes de usar la IA? ¿Qué le preguntaste (si la usaste)? ¿Qué te ayudó a entender? Confianza antes → después (1–5):

---

## Parte 2 — Coeficientes Constantes y Cauchy-Euler (Sesión 10)

**4. Raíces Reales Distintas**

Resuelve el PVI: $y''-y'-6y=0,\quad y(0)=1,\ y'(0)=8$.

> **Bitácora:** ¿La intentaste sola/o antes de usar la IA? ¿Qué le preguntaste (si la usaste)? ¿Qué te ayudó a entender? Confianza antes → después (1–5):

**5. Raíz Repetida**

Resuelve el PVI: $y''+8y'+16y=0,\quad y(0)=3,\ y'(0)=-13$.

> **Bitácora:** ¿La intentaste sola/o antes de usar la IA? ¿Qué le preguntaste (si la usaste)? ¿Qué te ayudó a entender? Confianza antes → después (1–5):

**6. Raíces Complejas Conjugadas**

Resuelve el PVI: $y''-2y'+5y=0,\quad y(0)=0,\ y'(0)=4$.

> **Bitácora:** ¿La intentaste sola/o antes de usar la IA? ¿Qué le preguntaste (si la usaste)? ¿Qué te ayudó a entender? Confianza antes → después (1–5):

**7. Cauchy-Euler**

Resuelve el PVI (para $x>0$): $x^2y''-2xy'-4y=0,\quad y(1)=3,\ y'(1)=2$.

> **Bitácora:** ¿La intentaste sola/o antes de usar la IA? ¿Qué le preguntaste (si la usaste)? ¿Qué te ayudó a entender? Confianza antes → después (1–5):

---

## Parte 3 — El Método del Anulador y Aplicación Real (Sesión 10)

**8. Anulador con Forzamiento Combinado**

Encuentra la solución general completa de: $y''-y'-2y=6e^{x}+4$.

Muestra explícitamente: $y_c$, el anulador que usaste (y por qué se combina de esa forma para los dos términos del forzamiento), la forma de $y_p$ antes de sustituir, y los coeficientes ya resueltos.

> **Bitácora:** ¿La intentaste sola/o antes de usar la IA? ¿Qué le preguntaste (si la usaste)? ¿Qué te ayudó a entender? Confianza antes → después (1–5):

**9. Aplicación Física — Sistema Forzado**

Un sistema masa-resorte-amortiguador tiene $m=1$ kg, constante de amortiguamiento $c=5$, constante de resorte $k=6$, y se le aplica una fuerza constante $F_0=18$ N. El sistema parte en reposo, en su posición de equilibrio natural: $x(0)=0$, $x'(0)=0$.

(a) A partir de la Segunda Ley de Newton, plantea la ecuación diferencial completa del sistema (no la den por hecho — muestren la suma de fuerzas).
(b) Resuélvela por completo usando las condiciones iniciales dadas.
(c) ¿Hacia qué posición se asienta el sistema a largo plazo? ¿Oscila en el camino, o se acerca sin oscilar? Relaciona tu respuesta con el tipo de raíces que obtuviste.

> **Bitácora:** ¿La intentaste sola/o antes de usar la IA? ¿Qué le preguntaste (si la usaste)? ¿Qué te ayudó a entender? Confianza antes → después (1–5):

---

**Lo que deben poder hacer después de esta tarea:**
- Determinar el intervalo de validez de un PVI y explicar por qué un PVF puede no comportarse igual.
- Verificar independencia lineal con el Wronskiano y reconocerla como condición para un conjunto fundamental.
- Resolver cualquier homogénea de coeficientes constantes o Cauchy-Euler, identificando el caso por el discriminante.
- Aplicar el algoritmo del anulador completo, incluyendo forzamientos con más de un término.
- Plantear y resolver un modelo físico real de principio a fin — de la física a la solución interpretada.
