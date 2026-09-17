# Guión de Presentación: Sesión 11 - Cálculo III

**Tono:** Esta es la sesión que cierra el Capítulo 4 completo. Dos ideas nuevas —variación de parámetros y sistemas por eliminación— pero ambas son extensiones directas de herramientas que ya dominan (el anulador, el Wronskiano, tratar $D$ como operador), no técnicas desconectadas. El caso real de los tanques de mezcla debe sentirse como la razón de ser de los sistemas: hay fenómenos que ninguna ecuación aislada puede describir.

---

### Diapositiva 1: Portada y Enganche
*(La pantalla muestra el título "Variación de Parámetros y Sistemas Lineales")*

**Lo que debes decir:**
"¡Bienvenidos! La sesión pasada cerramos con una advertencia: el método del anulador es poderoso, pero tiene un límite — solo funciona cuando existe un anulador, y funciones como $\tan x$, $\sec x$ o $\ln x$ simplemente no tienen uno. Hoy aprenden el método que **sí** funciona siempre, sin excepción. Y como segundo tema, van a dar el salto de una ecuación a **varias ecuaciones acopladas** — porque muchos fenómenos reales no se pueden describir con una sola. Con esto cerramos el Capítulo 4 completo."

---

### Diapositiva 2: Repaso Relámpago — Los Límites del Anulador
*(La pantalla muestra la tabla de anuladores de la Sesión 10, con un tache sobre $\tan x$, $\sec x$, $\ln x$)*

**Lo que debes decir:**
"Recuerden: el anulador funciona con polinomios, exponenciales, senos y cosenos — porque esas funciones, al derivarlas repetidamente, regresan a un conjunto finito de términos que un operador puede cancelar. $\tan x$ no tiene esa propiedad: derívenla las veces que quieran, nunca colapsa a una familia finita. Para esos casos necesitamos un método que no dependa de adivinar una forma — que funcione por fuerza bruta, a partir de la solución homogénea que ya saben construir."

---

### Diapositiva 3: Variación de Parámetros — La Idea
*(La pantalla muestra $y_p=u_1(x)y_1+u_2(x)y_2$, con $y_1,y_2$ el conjunto fundamental de la homogénea)*

**Lo que debes decir:**
"La idea, atribuida a Lagrange: en vez de multiplicar $y_1$ y $y_2$ por constantes $C_1$, $C_2$ como en la función complementaria, los dejamos ser **funciones** de $x$: $u_1(x)$ y $u_2(x)$. Proponemos $y_p=u_1y_1+u_2y_2$. Para que esto funcione con solo dos funciones desconocidas resolviendo una ecuación de segundo orden, necesitamos imponer una condición extra —de otro modo el álgebra se vuelve un desastre—: exigimos que $u_1'y_1+u_2'y_2=0$. Esa exigencia no pierde generalidad, solo simplifica las cuentas."

---

### Diapositiva 4: Variación de Parámetros — Las Fórmulas
*(La pantalla muestra el sistema resultante para $u_1', u_2'$ y su solución en términos del Wronskiano)*

**Lo que debes decir:**
"Sustituyendo la condición extra y la ecuación original —ya puesta en la forma estándar $y''+Py'+Qy=f(x)$, con coeficiente 1 en $y''$—, se llega a un sistema lineal de dos ecuaciones para $u_1'$ y $u_2'$. Resolviéndolo: $u_1'=\dfrac{-y_2f(x)}{W}$, $u_2'=\dfrac{y_1f(x)}{W}$, donde $W$ es exactamente el Wronskiano de $y_1$ y $y_2$ de la Sesión 9. Ahí está la conexión: el mismo número que usaban para **verificar** independencia ahora aparece en el **denominador** de la fórmula — y por eso nunca es cero. Integran $u_1'$ y $u_2'$ para obtener $u_1$, $u_2$, y arman $y_p=u_1y_1+u_2y_2$."

---

### Diapositiva 5: Ejemplo — Planteamiento
*(La pantalla muestra únicamente $y''+y=\tan x$, sin pasos ni respuesta)*

**Lo que debes decir:**
"$y''+y=\tan x$, en el intervalo $-\pi/2<x<\pi/2$ donde $\tan x$ es continua —recuerden el teorema de existencia y unicidad de la Sesión 9, que exige continuidad—. Antes de que yo continúe: ¿cuál es $y_c$? [Esperen la respuesta: la característica es $r^2+1=0$, raíces $r=\pm i$, así que $y_1=\cos x$, $y_2=\sin x$]. Calculen el Wronskiano de $y_1,y_2$, y luego $u_1'$ y $u_2'$ con las fórmulas de la diapositiva anterior. No se preocupen si la integral de $u_1'$ los sorprende — es un repaso de Cálculo 2. Resuélvanlo en su cuaderno."

---

### Diapositiva 6: Ejemplo — Solución
*(La pantalla muestra los pasos completos y la solución final)*

**Lo que debes decir:**
"El Wronskiano: $W=y_1y_2'-y_2y_1'=\cos x\cos x-\sin x(-\sin x)=\cos^2x+\sin^2x=1$. Entonces $u_1'=-\sin x\tan x=-\dfrac{\sin^2x}{\cos x}$ y $u_2'=\cos x\tan x=\sin x$. Integrando: $u_2=-\cos x$. Para $u_1$, reescriban $-\sin^2x/\cos x=-(1-\cos^2x)/\cos x=\cos x-\sec x$, e integren usando $\int\sec x\,dx=\ln|\sec x+\tan x|+C$ —recuerden esta fórmula de Cálculo 2—: $u_1=\sin x-\ln|\sec x+\tan x|$. Armando $y_p=u_1y_1+u_2y_2$, los términos $\sin x\cos x$ se cancelan, y queda $y_p=-\cos x\ln|\sec x+\tan x|$. La solución general: $y=C_1\cos x+C_2\sin x-\cos x\ln|\sec x+\tan x|$ — algo que el anulador jamás podría haber producido."

---

### Diapositiva 7: De una Ecuación a un Sistema
*(La pantalla muestra dos ecuaciones acopladas, cada una dependiendo de ambas variables)*

**Lo que debes decir:**
"Segundo tema de hoy. Hasta ahora, cada problema ha sido una sola ecuación con una sola función desconocida. Pero muchos fenómenos reales involucran **varias cantidades que cambian juntas y se afectan mutuamente**: la concentración de sal en dos tanques conectados, la corriente en dos mallas de un circuito, la posición de dos masas unidas por resortes. En esos casos, el modelo no es una ecuación — es un **sistema** de ecuaciones diferenciales, y las variables no se pueden despejar una a la vez porque cada ecuación mezcla ambas."

---

### Diapositiva 8: Sistemas Lineales — El Método de Eliminación
*(La pantalla muestra el sistema escrito con el operador $D$, y los pasos del método de eliminación)*

**Lo que debes decir:**
"La solución: tratar $D$ como símbolo algebraico —igual que en el anulador— y aplicar eliminación, exactamente como resolverían un sistema algebraico de dos ecuaciones y dos incógnitas. Escriben ambas ecuaciones en términos de $D$, despejan una variable de una ecuación, o combinan ambas para cancelarla, y llegan a una sola ecuación de orden superior en la variable restante. La resuelven con las técnicas que ya dominan. Ojo con una sutileza: al sustituir de regreso para encontrar la segunda variable, **no** introduzcan constantes nuevas — las constantes ya quedaron fijadas al resolver la primera ecuación; la segunda variable se obtiene sustituyendo directamente, no resolviendo un problema aparte."

---

### Diapositiva 9: El Caso Real — Mezcla en Dos Tanques (Planteamiento)
*(La pantalla muestra dos tanques conectados por tuberías, con $x_1(t)$ y $x_2(t)$ como la sal en cada uno)*

**Lo que debes decir:**
"Dos tanques de igual volumen, conectados por un par de bombas que intercambian salmuera al mismo ritmo en ambas direcciones —el volumen de cada tanque se mantiene constante—. Con las tasas de flujo dadas, el modelo se reduce a $\dfrac{dx_1}{dt}=x_2-x_1$, $\dfrac{dx_2}{dt}=x_1-x_2$, donde $x_1,x_2$ son la cantidad de sal en cada tanque. El Tanque 1 arranca con 50 libras de sal disuelta; el Tanque 2, con agua pura. Antes de resolver: ¿qué esperarían que pase después de mucho tiempo, físicamente? [Esperen la respuesta: la sal debería repartirse por igual]. Vamos a comprobarlo con el método de eliminación."

---

### Diapositiva 10: El Caso Real — Mezcla en Dos Tanques (Solución)
*(La pantalla muestra los pasos de eliminación y la solución final para $x_1(t)$ y $x_2(t)$)*

**Lo que debes decir:**
"En operadores: $(D+1)x_1-x_2=0$, $-x_1+(D+1)x_2=0$. De la primera, $x_2=(D+1)x_1=x_1'+x_1$. Sustituyendo en la segunda: $-x_1+(D+1)(x_1'+x_1)=0$, que se simplifica a $x_1''+2x_1'=0$ — factoriza como $D(D+2)x_1=0$, así que $x_1=C_1+C_2e^{-2t}$. Sustituyendo de regreso, sin constantes nuevas: $x_2=x_1'+x_1=C_1-C_2e^{-2t}$. Con $x_1(0)=50$ y $x_2(0)=0$: $C_1+C_2=50$ y $C_1-C_2=0$, así que $C_1=C_2=25$. Las soluciones son $x_1(t)=25+25e^{-2t}$ y $x_2(t)=25-25e^{-2t}$. Cuando $t\to\infty$, ambas tienden a 25 libras — exactamente la mitad de las 50 libras totales, repartidas por igual entre los dos tanques, tal como predijeron."

---

### Diapositiva 11: Errores Comunes
*(La pantalla muestra las trampas típicas de variación de parámetros y sistemas)*

**Lo que debes decir:**
"Cuatro advertencias. Uno: en variación de parámetros, olvidar poner la ecuación en forma estándar —coeficiente 1 en $y''$— antes de identificar $f(x)$; si dividen mal, $f(x)$ sale incorrecta y todo el resto se arrastra mal. Dos: variación de parámetros siempre funciona, pero es más laboriosa — si el anulador aplica, úsenlo primero, es más rápido. Tres: en sistemas, después de eliminar, olvidar que el número de constantes arbitrarias en la solución completa lo determina el **orden de la ecuación eliminada**, no la suma ingenua de órdenes de cada variable. Cuatro: al sustituir de regreso para la segunda variable, introducir constantes nuevas por accidente — no hay ninguna libertad extra ahí, todo ya quedó fijado."

---

### Diapositiva 12: Cierre de Sesión — El Capítulo 4 Completo
*(La pantalla muestra el mapa de las tres sesiones: Teoría (9) → Métodos (10) → Métodos Avanzados y Sistemas (11), y el gancho hacia Laplace)*

**Lo que debes decir:**
"Con esto, el capítulo completo de ecuaciones de orden superior está cerrado. En la Sesión 9 construyeron la teoría: existencia, unicidad, independencia lineal, $y=y_c+y_p$. En la Sesión 10, fabricaron soluciones: reducción de orden, la ecuación característica, Cauchy-Euler, y el anulador. Hoy, en la Sesión 11, llenaron el último hueco: variación de parámetros para cuando no hay anulador, y sistemas completos de ecuaciones acopladas. Pero todavía hay una frontera pendiente: ¿qué pasa cuando la fuerza externa no es constante ni periódica simple, sino un impulso repentino, o una fuerza que se enciende y se apaga? Ahí es donde la Transformada de Laplace entra — y con ella, van a poder resolver el caso del puente Millennium de Londres que quedó pendiente desde hace varias sesiones. Nos vemos la próxima clase."

---
