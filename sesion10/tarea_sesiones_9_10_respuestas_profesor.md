# Respuestas de Referencia — Solo para el Profesor
### Tarea: Ecuaciones de Orden Superior (Sesiones 9 y 10)

**No distribuir a los alumnos.** Este archivo no se manda ni se pega en el prompt de tutoría — el prompt que reciben los alumnos (`tarea_sesiones_9_10_prompt_tutor_ia.md`) no incluye esta clave a propósito, para que no puedan leerla directamente abriendo el archivo. Todas las respuestas se verificaron con cálculo simbólico (sympy), no solo a mano.

1. **Existencia y Unicidad.** Restricciones: $a_2=x^2-9=0$ en $x=\pm3$; $1/(x-1)$ discontinuo en $x=1$. Con $x_0=2$, el intervalo más grande donde el teorema garantiza solución única es $(1,3)$ — $x=-3$ no afecta la respuesta, es la restricción que no debería terminar importando.
2. **Wronskiano.** $W=y_1y_2'-y_2y_1'=4e^{3x}+e^{3x}=5e^{3x}\neq0$ para toda $x$ → independientes → sí forman conjunto fundamental (2 soluciones independientes de una ecuación de orden 2).
3. **PVF.** (a) $y=C_1\cos3x+C_2\sin3x$. (b) $y(0)=0\Rightarrow C_1=0$; $y(\pi)=C_2\sin3\pi=0=0$ para cualquier $C_2$ → **infinitas** soluciones. (c) Misma condición en $\pi$ pero igualada a 5: $0=5$, imposible → **ninguna** solución. (d) $y(\pi/6)=C_2\sin(\pi/2)=C_2=4$ → **solución única**.
4. **Raíces reales distintas.** $r=3,-2$. $y=2e^{3x}-e^{-2x}$.
5. **Raíz repetida.** Raíz doble $r=-4$. $y=(3-x)e^{-4x}$.
6. **Raíces complejas.** Raíces $1\pm2i$. $y=2e^{x}\sin2x$.
7. **Cauchy-Euler.** Ecuación auxiliar $m^2-3m-4=0\Rightarrow m=4,-1$. $y=x^4+2x^{-1}$.
8. **Anulador combinado.** $y_c=C_1e^{2x}+C_2e^{-x}$ (raíces $2,-1$). Anulador: $D$ para el 4, $(D-1)$ para $6e^x$ → combinado $D(D-1)$. Forma de $y_p=A+Be^x$ (sin duplicar $y_c$). Sustituyendo: $-2A=4\Rightarrow A=-2$; $-2B=6\Rightarrow B=-3$. $y=C_1e^{2x}+C_2e^{-x}-3e^{x}-2$.
9. **Aplicación física.** (a) $mx''=-kx-cx'+F_0\Rightarrow x''+5x'+6x=18$. (b) Raíces $-2,-3$ (reales distintas). $x_p=3$. Con $x(0)=0,\ x'(0)=0$: $x(t)=-9e^{-2t}+6e^{-3t}+3$. (c) Se asienta en $x=3$; **no oscila** — raíces reales distintas, sistema sobreamortiguado.
