# Guión de Presentación: Sesión 10 - Cálculo III

**Tono:** Ahora sí, manos a la obra — la sesión pasada construimos las reglas del juego (existencia, unicidad, independencia lineal, $y_c+y_p$); hoy fabricamos soluciones de forma mecánica. Encadenar todo con la Sesión 9: cada técnica nueva es una manera concreta de construir el conjunto fundamental o la solución particular que la teoría prometió que existía.

---

### Diapositiva 1: Portada y Enganche
*(La pantalla muestra el título "Métodos de Solución: Coeficientes Constantes y Cauchy-Euler")*

**Lo que debes decir:**
"¡Bienvenidos! La sesión pasada construimos la teoría: existencia, unicidad, independencia lineal, conjuntos fundamentales, $y=y_c+y_p$. Hoy esa teoría deja de ser abstracta — vamos a fabricar, de forma completamente mecánica, las soluciones que el teorema prometía que existían. Cuatro técnicas en 90 minutos: reducción de orden, la ecuación característica, la ecuación de Cauchy-Euler, y el método del anulador para las no homogéneas. Al final, las vamos a usar todas juntas en un caso real."

---

### Diapositiva 2: Revisión de Tarea — Preguntas al Azar
*(La pantalla muestra el título "Revisión: Operadores Diferenciales" con las cuatro preguntas — sin las respuestas, que solo el profesor conoce)*

**Lo que debes decir:**
"Antes de arrancar, reviso la tarea de operadores diferenciales — la que cierra la brecha para el anulador de hoy. Voy a elegir al azar a tres o cuatro personas, por lista, así que nadie se relaja pensando que ya le tocó.

[Elijan a un alumno al azar] ¿Qué operador aniquila un polinomio de grado $k$? [Esperen la respuesta: $D^{k+1}$].

[Elijan a otro alumno al azar] ¿Qué operador aniquila $e^{rx}$? [Esperen la respuesta: $(D-r)$].

[Elijan a otro alumno al azar] Si en vez de $e^{rx}$ tengo $xe^{rx}$, ¿por qué $(D-r)$ ya no alcanza, y qué operador sí lo aniquila? [Esperen la respuesta: $(D-r)$ elimina la parte $e^{rx}$, pero no el factor $x$ adicional; hace falta aplicarlo dos veces, $(D-r)^2$].

[Elijan a un cuarto alumno al azar] Si $g(x)$ tiene varios términos distintos, como $3x+e^{2x}$, ¿qué hacen para encontrar el operador que aniquila toda la suma? [Esperen la respuesta: combinan —multiplican— los anuladores de cada término por separado: $D^2$ para $3x$, y $(D-2)$ para $e^{2x}$, dando el anulador combinado $D^2(D-2)$].

Si alguien se traba, no lo dejen ahí — pregúntenle al grupo, que alguien más complete la idea. Pero si nadie en el salón puede contestar ninguna, es una señal clara: hay que repasar la tarea antes de seguir, porque todo lo de hoy —empezando por el anulador— la da por sabida."

---

### Diapositiva 3: Repaso Relámpago — De la Teoría al Método
*(La pantalla muestra los tres pilares de la Sesión 9: Existencia y Unicidad, Independencia Lineal, y=yc+yp)*

**Lo que debes decir:**
"Tres ideas de la sesión pasada van a trabajar hoy sin descanso. Uno: para que una combinación $C_1y_1+\dots+C_ny_n$ sea la solución general, necesitamos $n$ soluciones **linealmente independientes** — el Wronskiano nos deja verificarlo. Dos: la solución general de una no homogénea es $y=y_c+y_p$. Tres: si el forzamiento tiene varios términos, resolvemos cada uno por separado y sumamos. Hoy convertimos estas tres ideas en algoritmos concretos."

---

### Diapositiva 4: De una Solución a Todas — Reducción de Orden y la Apuesta Exponencial
*(La pantalla muestra la fórmula de reducción de orden y, al lado, la sustitución $y=e^{rx}$)*

**Lo que debes decir:**
"Primera pregunta: si ya conocen **una** solución $y_1$ de $y''+P(x)y'+Q(x)y=0$, ¿cómo consiguen una segunda, independiente? La técnica general se llama **reducción de orden**: proponen $y_2=u(x)y_1$, sustituyen, y siempre llegan a $y_2=y_1\displaystyle\int\frac{e^{-\int P\,dx}}{y_1^2}\,dx$. Funciona siempre, pero es laboriosa. Para coeficientes **constantes**, hay un atajo total: en vez de buscar una segunda solución a partir de la primera, **adivinamos todas a la vez** con $y=e^{rx}$. Sustituyendo en $ay''+by'+cy=0$ y factorizando $e^{rx}$ —que nunca es cero— queda pura álgebra: la **ecuación característica**, $ar^2+br+c=0$."

---

### Diapositiva 5: La Ecuación Característica — Los Tres Casos
*(La pantalla muestra las tres familias de solución según el signo del discriminante $b^2-4ac$)*

**Lo que debes decir:**
"La ecuación característica es una cuadrática ordinaria: solo hay tres posibilidades. Raíces reales distintas, cuando el discriminante es positivo: $y=C_1e^{r_1x}+C_2e^{r_2x}$ — dos exponenciales, y el Wronskiano de la sesión pasada confirma que son independientes. Raíz repetida, discriminante cero: una sola exponencial no basta —perderían una constante—, así que la segunda solución independiente es $xe^{rx}$: $y=(C_1+C_2x)e^{rx}$. Raíces complejas conjugadas, discriminante negativo, $r=\alpha\pm\beta i$: usando la fórmula de Euler, $y=e^{\alpha x}(C_1\cos\beta x+C_2\sin\beta x)$. Ingenieros: memoricen las tres formas — las van a usar el resto del curso."

---

### Diapositiva 6: Ejemplo — Raíces Reales Distintas
*(La pantalla muestra $y''-5y'+6y=0$, $y(0)=1$, $y'(0)=0$, con la solución completa)*

**Lo que debes decir:**
"$y''-5y'+6y=0$, con $y(0)=1$, $y'(0)=0$. Ecuación característica: $r^2-5r+6=0$, que factoriza como $(r-2)(r-3)=0$ — raíces $r_1=2$, $r_2=3$. Solución general: $y=C_1e^{2x}+C_2e^{3x}$. Derivando y aplicando las condiciones iniciales: $C_1+C_2=1$ y $2C_1+3C_2=0$. Resolviendo el sistema, $C_1=3$, $C_2=-2$. La solución particular es $y=3e^{2x}-2e^{3x}$ — verifiquen ustedes que $y(0)=1$ y $y'(0)=0$."

---

### Diapositiva 7: Ejemplos Directos — Raíz Repetida y Raíces Complejas
*(La pantalla muestra, en dos columnas, $y''-6y'+9y=0$ y $y''+4y'+13y=0$, cada una con su solución)*

**Lo que debes decir:**
"Los otros dos casos, más rápido. Izquierda: $y''-6y'+9y=0$, $y(0)=2$, $y'(0)=1$. Característica: $(r-3)^2=0$, raíz doble $r=3$. Solución general $y=(C_1+C_2x)e^{3x}$; con las condiciones iniciales, $C_1=2$, $C_2=-5$, así que $y=(2-5x)e^{3x}$. Derecha: $y''+4y'+13y=0$, $y(0)=0$, $y'(0)=3$. Característica: $r^2+4r+13=0$, raíces $r=-2\pm3i$. Solución general $y=e^{-2x}(C_1\cos3x+C_2\sin3x)$; con las condiciones iniciales, $C_1=0$, $C_2=1$, así que $y=e^{-2x}\sin(3x)$. Guarden esta última ecuación en la memoria — va a reaparecer."

---

### Diapositiva 8: Cauchy-Euler — La Misma Idea, Otra Apuesta
*(La pantalla muestra la forma general $ax^2y''+bxy'+cy=0$ y la sustitución $y=x^m$)*

**Lo que debes decir:**
"Cambiemos de familia de ecuaciones, pero no de estrategia. Una ecuación de Cauchy-Euler tiene la forma $ax^2y''+bxy'+cy=0$ — el coeficiente de cada derivada es una potencia de $x$ que coincide con el orden de la derivada. La apuesta ya no es $e^{rx}$, es $y=x^m$. Sustituyendo: $x^2\cdot m(m-1)x^{m-2}+bx\cdot mx^{m-1}+cx^m=0$, que se simplifica a $[am(m-1)+bm+c]\,x^m=0$. Factorizando $x^m$ —nunca cero para $x>0$—, queda otra vez una cuadrática pura: la **ecuación auxiliar** $am(m-1)+bm+c=0$. Los mismos tres casos de siempre reaparecen, ahora con potencias y logaritmos de $x$ en vez de exponenciales."

---

### Diapositiva 9: Cauchy-Euler — Ejemplo
*(La pantalla muestra $x^2y''+xy'+4y=0$ con la solución completa)*

**Lo que debes decir:**
"$x^2y''+xy'+4y=0$. Ecuación auxiliar: $m(m-1)+m+4=0$, es decir $m^2+4=0$ — raíces complejas, $m=\pm2i$. Para Cauchy-Euler con raíces complejas $m=\alpha\pm\beta i$, la solución general es $y=x^\alpha[C_1\cos(\beta\ln x)+C_2\sin(\beta\ln x)]$; aquí $\alpha=0$, $\beta=2$, así que $y=C_1\cos(2\ln x)+C_2\sin(2\ln x)$. Con $y(1)=1$ y $y'(1)=4$ —noten que $\ln1=0$, así que evaluar en $x=1$ simplifica todo—, se obtiene $C_1=1$, $C_2=2$: $y=\cos(2\ln x)+2\sin(2\ln x)$."

---

### Diapositiva 10: El Método del Anulador — ¿Por Qué No Basta con Adivinar?
*(La pantalla muestra una ecuación no homogénea y la pregunta de qué forma debería tener $y_p$)*

**Lo que debes decir:**
"Cambiemos de problema: ecuaciones **no homogéneas**. Ya saben, desde la sesión pasada, que $y=y_c+y_p$. Ya saben construir $y_c$. Falta $y_p$. Podrían adivinar su forma a ojo —si $g(x)$ es un polinomio, prueben un polinomio; si es una exponencial, prueben una exponencial— pero adivinar a ojo falla en cuanto el forzamiento se complica. El **método del anulador** convierte ese tanteo en álgebra pura: tratamos $D=d/dx$ como un símbolo algebraico, y buscamos un operador que **aniquile** —convierta en cero— la función $g(x)$ del lado derecho."

---

### Diapositiva 11: Operadores D y la Tabla de Anuladores
*(La pantalla muestra la tabla: función → operador que la aniquila)*

**Lo que debes decir:**
"Tres bloques básicos, y con ellos construyen cualquier combinación. Un polinomio de grado $k$ —hasta $x^k$— lo aniquila $D^{k+1}$. Una exponencial $e^{rx}$ la aniquila $(D-r)$. Un seno o coseno de la forma $e^{\alpha x}\cos\beta x$ o $e^{\alpha x}\sin\beta x$ lo aniquila $D^2-2\alpha D+(\alpha^2+\beta^2)$. Para una suma de términos, multiplican —componen— los operadores de cada uno; y aquí es donde regresa el principio de superposición para no homogéneas de la sesión pasada: cada anulador se encarga de su propio término."

---

### Diapositiva 12: El Algoritmo del Anulador, Paso a Paso
*(La pantalla muestra los pasos numerados del método completo)*

**Lo que debes decir:**
"El algoritmo completo, en cuatro pasos. Uno: encuentren $y_c$, la solución de la homogénea asociada —ya saben hacerlo—. Dos: encuentren un operador anulador para $g(x)$, y aplíquenlo a **ambos lados** de la ecuación completa; esto produce una ecuación homogénea de orden mayor. Tres: resuelvan esa ecuación de orden mayor, y **eliminen** de su solución los términos que ya son parte de $y_c$ —esos no aportan nada nuevo—. Lo que sobra es la forma de $y_p$, con coeficientes todavía desconocidos. Cuatro: sustituyan esa forma en la ecuación **original** no homogénea para despejar los coeficientes."

---

### Diapositiva 13: Ejemplo — Anulador (Planteamiento)
*(La pantalla muestra únicamente $y''-y'-2y=4x^2$, sin pasos ni respuesta)*

**Lo que debes decir:**
"Vamos con un caso completo: $y''-y'-2y=4x^2$. Antes de que yo continúe: ¿cuál es $y_c$? [Esperen la respuesta: la característica es $(r-2)(r+1)=0$, así que $y_c=C_1e^{2x}+C_2e^{-x}$]. Ahora, ¿qué operador aniquila $4x^2$? [Esperen la respuesta: $D^3$, porque $x^2$ es un polinomio de grado 2]. Apliquen $D^3$ a ambos lados, identifiquen qué términos de la solución resultante ya están en $y_c$, y propongan la forma de $y_p$ con coeficientes por determinar. Resuélvanlo en su cuaderno — la solución completa está en la siguiente diapositiva."

---

### Diapositiva 14: Ejemplo — Anulador (Solución)
*(La pantalla muestra los cuatro pasos completos y la solución final)*

**Lo que debes decir:**
"Recapitulemos. $y_c=C_1e^{2x}+C_2e^{-x}$. El anulador de $4x^2$ es $D^3$; aplicándolo a ambos lados, la ecuación combinada es de orden 5, con solución $A+Bx+Cx^2+C_1e^{2x}+C_2e^{-x}$. Los términos exponenciales ya están en $y_c$, así que la forma de $y_p$ es $y_p=A+Bx+Cx^2$. Sustituyendo en la ecuación original y agrupando por potencias de $x$: de $x^2$, $-2C=4$, así que $C=-2$; de $x^1$, $-2C-2B=0$, así que $B=2$; de $x^0$, $2C-B-2A=0$, así que $A=-3$. La solución particular es $y_p=-3+2x-2x^2$, y la solución general completa es $y=C_1e^{2x}+C_2e^{-x}-3+2x-2x^2$."

---

### Diapositiva 15: El Caso Real — Masa-Resorte-Amortiguador, Ahora Forzado
*(La pantalla muestra $x''+4x'+13x=26$, comparándola con la $y''+4y'+13y=0$ de la Diapositiva 7)*

**Lo que debes decir:**
"¿Reconocen esta estructura? Es la misma ecuación característica de hace un momento — solo que ahora el sistema masa-resorte-amortiguador tiene una fuerza constante empujándolo: $x''+4x'+13x=26$, como si de repente colgaran un peso adicional. Ya saben que $x_c=e^{-2t}(C_1\cos3t+C_2\sin3t)$. El anulador de la constante 26 es $D$; aplicando el algoritmo completo, la forma de $x_p$ es simplemente una constante, y sustituyendo se obtiene $x_p=2$. La solución general es $x(t)=e^{-2t}(C_1\cos3t+C_2\sin3t)+2$. Sin importar las condiciones iniciales —sin importar $C_1$ y $C_2$—, el término exponencial decae a cero cuando $t\to\infty$, dejando solamente $x_p=2$: el sistema termina oscilando cada vez menos, hasta asentarse en un **nuevo equilibrio**, desplazado 2 unidades del original. Eso es exactamente lo que $y_c$ y $y_p$ significan físicamente: $y_c$ es la respuesta transitoria que se apaga, $y_p$ es hacia dónde se dirige el sistema a largo plazo."

---

### Diapositiva 16: Errores Comunes
*(La pantalla muestra las trampas típicas de los métodos de hoy)*

**Lo que debes decir:**
"Cuatro advertencias. Uno: en Cauchy-Euler, la sustitución es $y=x^m$, no $y=e^{rx}$ — son ecuaciones distintas, con trucos distintos; no las mezclen. Dos: en el anulador, olvidar revisar si algún término de la solución de orden mayor **ya está en $y_c$** — si lo dejan sin eliminar, van a proponer una forma de $y_p$ que en realidad ya es solución de la homogénea, y el sistema de ecuaciones para sus coeficientes no va a tener solución. Tres: aplicar el anulador solo al lado derecho y olvidar aplicarlo también a la ecuación completa —el anulador debe aplicarse a ambos lados de la igualdad—. Cuatro: en Cauchy-Euler, olvidar que la fórmula asume $x>0$ — para $x<0$ se necesitan ajustes con $|x|$ que no cubrimos hoy."

---

### Diapositiva 17: Cierre y Próximo Paso
*(La pantalla muestra la conclusión y el gancho hacia variación de parámetros y sistemas)*

**Lo que debes decir:**
"Con esto, su arsenal de orden superior ya fabrica soluciones completas: homogéneas con coeficientes constantes, Cauchy-Euler, y no homogéneas cuando el forzamiento es un polinomio, una exponencial, un seno o coseno —o una combinación de esos—. Pero el anulador tiene un límite: solo funciona cuando existe un anulador, y funciones como $\tan x$ o $\ln x$ simplemente no tienen uno. ¿Qué hacen entonces? La próxima sesión aprenden **variación de parámetros** —un método que funciona para *cualquier* forzamiento— y cómo resolver sistemas completos de ecuaciones diferenciales lineales. Ahí es donde estos métodos se van a encontrar con modelos reales todavía más ricos. Nos vemos en la Sesión 11."

---
