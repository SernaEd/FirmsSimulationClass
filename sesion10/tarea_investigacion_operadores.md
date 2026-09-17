# Tarea de Investigación: Operadores Diferenciales
### Preparación para la Sesión 10 — Cálculo III

**Por qué esta tarea existe:** en la Sesión 10 van a aprender el método del anulador para resolver ecuaciones no homogéneas. Ese método trata a $D=\dfrac{d}{dx}$ **como si fuera un número que se puede sumar, multiplicar y factorizar** — no solo como una instrucción de "derivar". Si esa idea es nueva para ustedes, la Sesión 10 va a sentirse como álgebra desconocida en vez de una herramienta más. Esta tarea cierra esa brecha *antes* de la clase, para que en la Sesión 10 puedan concentrarse en el método y no en la notación.

**Tiempo estimado:** 30–40 minutos. **Formato:** entregable individual, en su cuaderno o documento — el profesor lo revisa al inicio de la Sesión 10, no se califica con rúbrica detallada, se revisa como visto/no visto.

---

## Parte 1 — D como operador (investiguen y expliquen con sus palabras)

1. Investiguen qué significa que $D$ sea un **operador diferencial**: $D[f](x) = f'(x)$. Dado $f(x)=x^3$, calculen $D[f]$, $D^2[f]$ (aplicar $D$ dos veces) y $D^3[f]$.
2. Investiguen qué significa un **operador polinomial** como $D^2-3D+2$. Aplíquenlo a $f(x)=e^{x}$: calculen $D^2[f]-3D[f]+2f$ y simplifiquen.
3. Verifiquen, con un ejemplo numérico propio (elijan su propia $f(x)$), que $D^2-3D+2$ se puede **factorizar** como $(D-1)(D-2)$ — es decir, que aplicar $(D-1)(D-2)$ a su función da el mismo resultado que aplicar $D^2-3D+2$ directamente. (Pista: apliquen primero $(D-2)$, y al resultado apliquen $(D-1)$.)

## Parte 2 — Por qué un operador "aniquila" una función

4. Calculen $(D-3)[e^{3x}]$, es decir, $D[e^{3x}] - 3e^{3x}$. ¿Qué obtienen? Expliquen con sus palabras por qué **cualquier** exponencial $e^{rx}$ desaparece bajo el operador $(D-r)$, pero no bajo $(D-s)$ si $s\neq r$.
5. Calculen $(D-3)^2[xe^{3x}]$ (apliquen $(D-3)$ dos veces seguidas al mismo resultado). Confirmen que da cero. ¿Por qué $(D-3)$ una sola vez **no** es suficiente para $xe^{3x}$, pero sí lo es para $e^{3x}$ solo?
6. Calculen $D^3[x^2]$ (tres derivadas sucesivas). Expliquen por qué, en general, $D^{k+1}$ siempre "aniquila" (convierte en cero) cualquier polinomio de grado $k$.

## Parte 3 — Conectando con lo que ya saben

7. En la Sesión 9 vieron el principio de superposición para ecuaciones no homogéneas: si $y_{p_1}$ resuelve el problema con $g_1(x)$ y $y_{p_2}$ con $g_2(x)$, entonces $y_{p_1}+y_{p_2}$ resuelve el problema con $g_1(x)+g_2(x)$. Con lo que investigaron en las partes 1 y 2, propongan (sin resolver del todo) qué operador podría "aniquilar" la función $g(x) = 3x + e^{2x}$ — una suma de dos términos distintos. Justifiquen su propuesta en una o dos líneas.

---

**Lo que deben poder responder de memoria al entrar a la Sesión 10:**
- ¿Qué operador aniquila un polinomio de grado $k$?
- ¿Qué operador aniquila $e^{rx}$?
- ¿Qué hacen cuando necesitan aniquilar una suma de varios términos distintos?

Si alguna de las tres no la tienen clara, relean la Parte correspondiente antes de clase — la Sesión 10 va a asumir que ya la dominan.
