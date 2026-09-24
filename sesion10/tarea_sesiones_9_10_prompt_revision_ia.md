# Prompt de Revisión — Tarea de Ecuaciones de Orden Superior (Sesiones 9 y 10)

Copien **todo** este archivo y péguenlo al inicio de una conversación nueva con la inteligencia artificial que estén usando (Claude, ChatGPT, Gemini, etc.). Al final hay una sección "MI PROCEDIMIENTO" — peguen ahí su procedimiento resuelto, pregunta por pregunta, antes de enviar el mensaje.

---

## Instrucciones para la IA

Eres un asistente de Cálculo III revisando la tarea de un estudiante sobre ecuaciones lineales de orden superior: existencia y unicidad, Wronskiano, problemas de valores en la frontera, ecuación característica (coeficientes constantes), Cauchy-Euler, el método del anulador, y un caso físico forzado (masa-resorte-amortiguador).

Abajo tienes el enunciado exacto de las 9 preguntas, y una sección de **respuestas de referencia** para que verifiques el trabajo del estudiante sin tener que resolver todo desde cero. El estudiante pegó su procedimiento en "MI PROCEDIMIENTO", al final de este documento.

**Tu trabajo:**
1. Para cada pregunta, compara el procedimiento del estudiante contra la respuesta de referencia — no solo el resultado final, revisa los pasos intermedios (¿plantearon bien la ecuación característica/auxiliar?, ¿identificaron el caso correcto por el discriminante?, ¿aplicaron bien las condiciones iniciales o de frontera?, ¿el anulador y la forma de $y_p$ son correctos?, ¿los signos de la física en la pregunta 9 son correctos?).
2. Si el procedimiento llega a una respuesta distinta a la de referencia pero el método está bien planteado, identifica en qué paso específico se desvió — no asumas que la referencia siempre tiene razón sin revisar el argumento del estudiante, pero repórtalo como error si tú confirmas que el paso está mal.
3. Da tu retroalimentación **exactamente** en el formato de la sección "FORMATO DE RESPUESTA" — nada más, nada antes.

## Reglas de brevedad (muy importantes — no las rompas)

- **Máximo un renglón (una línea) por pregunta.** Si el estudiante lo hizo bien, dilo en menos de eso.
- No repitas el enunciado del problema. No repitas la solución completa ni el procedimiento de referencia. No expliques la teoría general del método — el estudiante ya la vio en clase.
- Si hay un error, nombra el error **específico** (ej. "signo equivocado al aplicar la condición inicial", "el anulador debería ser D(D−1), no solo D", "olvidaste que x=−3 no afecta el intervalo") — nunca una frase genérica como "revisa tu procedimiento".
- Si está correcto, dilo en tres o cuatro palabras y, solo si aplica, una sugerencia de una frase para mejorar (notación más clara, verificar por sustitución, etc.) — nunca más de un renglón en total, ni siquiera sumando ambas cosas.
- Nada de encabezados, viñetas anidadas, ni párrafos. Una línea por pregunta, punto.
- Si el estudiante no respondió una pregunta, dilo en una frase corta ("No entregada.") y sigue — no la resuelvas tú en su lugar.

## FORMATO DE RESPUESTA

Responde así, y solo así — nueve líneas, una por pregunta, sin nada antes ni después salvo la línea final de total:

```
Pregunta 1: [✅ o ❌] — [retroalimentación de un renglón o menos]
Pregunta 2: [✅ o ❌] — [retroalimentación de un renglón o menos]
Pregunta 3: [✅ o ❌] — [retroalimentación de un renglón o menos]
Pregunta 4: [✅ o ❌] — [retroalimentación de un renglón o menos]
Pregunta 5: [✅ o ❌] — [retroalimentación de un renglón o menos]
Pregunta 6: [✅ o ❌] — [retroalimentación de un renglón o menos]
Pregunta 7: [✅ o ❌] — [retroalimentación de un renglón o menos]
Pregunta 8: [✅ o ❌] — [retroalimentación de un renglón o menos]
Pregunta 9: [✅ o ❌] — [retroalimentación de un renglón o menos]
Total: X/9 correctas.
```

---

## Las 9 Preguntas de la Tarea

1. **Existencia y Unicidad.** $(x^2-9)y'' + \dfrac{1}{x-1}y' + y = 0,\quad y(2)=1,\ y'(2)=0$. Determina el intervalo más grande que contiene a $x_0=2$ donde el teorema garantiza solución única.
2. **Wronskiano.** $y_1=e^{-x}$, $y_2=e^{4x}$, ambas soluciones de $y''-3y'-4y=0$. Calcula el Wronskiano y determina si forman un conjunto fundamental.
3. **PVF.** $y''+9y=0$. (a) Solución general. (b) Con $y(0)=0,\ y(\pi)=0$: ¿cuántas soluciones? (c) Con $y(0)=0,\ y(\pi)=5$: ¿cuántas? (d) Con $y(0)=0,\ y(\pi/6)=4$: ¿cuántas?
4. **Raíces reales distintas.** $y''-y'-6y=0,\ y(0)=1,\ y'(0)=8$.
5. **Raíz repetida.** $y''+8y'+16y=0,\ y(0)=3,\ y'(0)=-13$.
6. **Raíces complejas.** $y''-2y'+5y=0,\ y(0)=0,\ y'(0)=4$.
7. **Cauchy-Euler.** $x^2y''-2xy'-4y=0,\ y(1)=3,\ y'(1)=2$ (para $x>0$).
8. **Anulador combinado.** $y''-y'-2y=6e^{x}+4$. Encuentra la solución general completa.
9. **Aplicación física.** Masa-resorte-amortiguador: $m=1$, $c=5$, $k=6$, $F_0=18$, $x(0)=0$, $x'(0)=0$. (a) Plantea la ecuación desde la Segunda Ley de Newton. (b) Resuélvela completa. (c) ¿A qué posición se asienta a largo plazo? ¿Oscila?

## Respuestas de referencia (úsalas para verificar — no las copies textualmente en tu respuesta salvo para señalar un error puntual)

1. Restricciones: $a_2=0$ en $x=\pm3$; $1/(x-1)$ discontinuo en $x=1$. Con $x_0=2$, el intervalo más grande es $(1,3)$ — $x=-3$ no afecta la respuesta.
2. $W=y_1y_2'-y_2y_1'=4e^{3x}+e^{3x}=5e^{3x}\neq0$ para toda $x$ → independientes → sí forman conjunto fundamental (son 2 soluciones independientes de una ecuación de orden 2).
3. (a) $y=C_1\cos3x+C_2\sin3x$. (b) $y(0)=0\Rightarrow C_1=0$; $y(\pi)=C_2\sin3\pi=0=0$ para cualquier $C_2$ → **infinitas** soluciones. (c) Misma condición en $\pi$ pero igualada a 5: $0=5$, imposible → **ninguna** solución. (d) $y(\pi/6)=C_2\sin(\pi/2)=C_2=4$ → **solución única**.
4. Raíces $r=3,-2$. $y=2e^{3x}-e^{-2x}$.
5. Raíz doble $r=-4$. $y=(3-x)e^{-4x}$.
6. Raíces $1\pm2i$. $y=2e^{x}\sin2x$.
7. Ecuación auxiliar $m^2-3m-4=0\Rightarrow m=4,-1$. $y=x^4+2x^{-1}$.
8. $y_c=C_1e^{2x}+C_2e^{-x}$ (raíces $2,-1$). Anulador: $D$ para el 4, $(D-1)$ para $6e^x$ → combinado $D(D-1)$. Forma de $y_p=A+Be^x$ (sin duplicar $y_c$). Sustituyendo: $-2A=4\Rightarrow A=-2$; $-2B=6\Rightarrow B=-3$. $y=C_1e^{2x}+C_2e^{-x}-3e^{x}-2$.
9. (a) $mx''=-kx-cx'+F_0\Rightarrow x''+5x'+6x=18$. (b) Raíces $-2,-3$ (reales distintas). $x_p=3$. Con $x(0)=0,\ x'(0)=0$: $x(t)=-9e^{-2t}+6e^{-3t}+3$. (c) Se asienta en $x=3$; **no oscila** — raíces reales distintas, sistema sobreamortiguado.

---

## MI PROCEDIMIENTO

*(Peguen aquí su procedimiento resuelto, pregunta por pregunta, antes de enviar este mensaje a la IA.)*
