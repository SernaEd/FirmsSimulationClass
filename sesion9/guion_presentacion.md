# Guión de Presentación: Sesión 9 - Cálculo III

**Tono:** Técnico, con el mismo espíritu de "detective de patrones" de las sustituciones — pero ahora el patrón no es un cambio de variable, es adivinar la *forma* de la solución antes de resolver nada. El caso real (masa-resorte-amortiguador) debe sentirse como el motivo de todo: los tres casos algebraicos de la ecuación característica no son una curiosidad matemática, son tres comportamientos físicos distintos y observables.

---

### Diapositiva 1: Portada y Enganche
*(La pantalla muestra el título "Ecuaciones Lineales de Orden Superior: La Ecuación Característica")*

**Lo que debes decir:**
"¡Bienvenidos! La sesión pasada cerramos con dos compartimentos en su caja de herramientas: álgebra exacta y aproximación numérica. Hoy abrimos un capítulo nuevo dentro del álgebra exacta — pero para un tipo de ecuación que no hemos tocado: aquellas donde aparece la segunda derivada, la tercera, o más. Van a aprender un truco que parece casi mágico: adivinar la forma de la solución sin haber resuelto nada todavía, y de ahí derivar todo lo demás con álgebra pura, del tipo que ya dominan desde la prepa."

---

### Diapositiva 2: Repaso Relámpago — De Euler a Orden Superior
*(La pantalla muestra los dos compartimentos de la Sesión 8: Álgebra Exacta y Aproximación Numérica)*

**Lo que debes decir:**
"Recuerden el cierre de la sesión pasada: álgebra exacta cuando hay fórmula cerrada, Euler cuando no la hay. Todo lo que resolvimos con álgebra exacta hasta ahora —separables, lineales, exactas, homogéneas, Bernoulli— comparte algo: son ecuaciones de **primer orden**. Solo aparece $y'$. Hoy subimos un escalón: ecuaciones donde aparece $y''$, y vamos a ver que, lejos de ser más difíciles, tienen una de las técnicas de solución más elegantes y mecánicas de todo el curso."

---

### Diapositiva 3: Clasificación — Ecuaciones de Orden Superior
*(La pantalla muestra la forma general $a_n y^{(n)} + \dots + a_1 y' + a_0 y = g(x)$, con las palabras "orden", "lineal" y "homogénea" resaltadas)*

**Lo que debes decir:**
"Una ecuación diferencial es de orden $n$ cuando la derivada más alta que aparece es la $n$-ésima. Hoy nos concentramos en las **lineales**: $y$ y todas sus derivadas aparecen a la primera potencia, sin productos entre ellas ni dentro de funciones raras como seno o logaritmo. Y dentro de esas, en las **homogéneas de coeficientes constantes**: el lado derecho es cero, y las $a_i$ son números, no funciones de $x$. Una propiedad clave de la linealidad es el **principio de superposición**: si $y_1$ y $y_2$ son soluciones, entonces $C_1y_1 + C_2y_2$ también lo es, para cualquier constante. Esto no es un detalle técnico — es la razón por la que, en un momento, vamos a poder combinar dos soluciones simples para construir la solución general completa."

---

### Diapositiva 4: La Apuesta Exponencial
*(La pantalla muestra la sustitución $y=e^{rx}$ y sus derivadas)*

**Lo que debes decir:**
"Aquí viene el truco. Para resolver $ay''+by'+cy=0$, apostamos a que la solución tiene la forma $y=e^{rx}$, para algún número $r$ todavía desconocido. ¿Por qué esa apuesta y no otra? Porque el exponencial es la única función cuya derivada es proporcional a sí misma: $y'=re^{rx}$, $y''=r^2e^{rx}$. Si sustituimos en la ecuación, cada término se convierte en un múltiplo de $e^{rx}$: $ar^2e^{rx}+bre^{rx}+ce^{rx}=0$. Factorizamos $e^{rx}$, que nunca es cero, y lo que queda es puro álgebra: $ar^2+br+c=0$. A esto se le llama la **ecuación característica** — resolverla en $r$ es resolver la ecuación diferencial completa."

---

### Diapositiva 5: Los Tres Caminos
*(La pantalla muestra un diagrama de árbol: discriminante $b^2-4ac$ → tres ramas)*

**Lo que debes decir:**
"La ecuación característica es una cuadrática ordinaria, así que solo hay tres posibilidades, exactamente como en la prepa: **raíces reales distintas**, cuando el discriminante $b^2-4ac$ es positivo — la solución general es $y=C_1e^{r_1x}+C_2e^{r_2x}$. **Raíz repetida**, cuando el discriminante es cero — aquí no basta con $e^{rx}$ solo, porque perderíamos una constante; la segunda solución independiente es $xe^{rx}$, así que $y=(C_1+C_2x)e^{rx}$. Y **raíces complejas conjugadas**, cuando el discriminante es negativo, $r=\alpha\pm\beta i$ — usando la fórmula de Euler, la solución se reescribe sin números imaginarios como $y=e^{\alpha x}(C_1\cos\beta x+C_2\sin\beta x)$. Tres casos, tres familias de comportamiento. Analistas: memoricen las tres formas, porque las van a reconocer constantemente en ingeniería."

---

### Diapositiva 6: El Caso Real — Masa-Resorte-Amortiguador
*(La pantalla muestra $m x'' + c x' + kx = 0$ y una animación conceptual de una masa oscilando sobre un resorte con amortiguador)*

**Lo que debes decir:**
"Esto no es álgebra abstracta. El sistema masa-resorte-amortiguador —una masa $m$, un resorte de rigidez $k$, un amortiguador viscoso $c$— se modela exactamente con $mx''+cx'+kx=0$, donde $x$ es el desplazamiento desde el equilibrio. Su ecuación característica es $mr^2+cr+k=0$, y el discriminante es $c^2-4mk$. Miren la coincidencia: los tres casos algebraicos de hace un momento son, literalmente, los tres regímenes de amortiguamiento que ven en cualquier suspensión de auto o amortiguador de puerta. Raíces reales distintas: **sobreamortiguado** — regresa al equilibrio sin oscilar, lento. Raíz repetida: **críticamente amortiguado** — regresa sin oscilar, en el menor tiempo posible; el punto óptimo de diseño. Raíces complejas: **subamortiguado** — oscila mientras la amplitud decae exponencialmente. Nada de esto es coincidencia: es la misma matemática, vista desde la física."

---

### Diapositiva 7: Ejemplo — Planteamiento (Raíces Reales Distintas)
*(La pantalla muestra únicamente $y''-5y'+6y=0$, $y(0)=1$, $y'(0)=0$, sin pasos ni respuesta)*

**Lo que debes decir:**
"Vamos con el primer caso, y lo resolvemos juntos en el pizarrón: $y''-5y'+6y=0$, con $y(0)=1$ y $y'(0)=0$. Antes de que yo toque el gis: ¿cuál es la ecuación característica? [Esperen la respuesta] Exacto, $r^2-5r+6=0$. Factorícenla, encuentren las dos raíces, escriban la solución general, y luego usen las dos condiciones iniciales para encontrar $C_1$ y $C_2$ — recuerden que necesitan derivar la solución general antes de aplicar la segunda condición. Denle unos minutos, yo los voy guiando en el pizarrón."

---

### Diapositiva 8: Ejemplo — Solución (Raíces Reales Distintas)
*(La pantalla muestra los pasos completos y la solución final: $y=3e^{2x}-2e^{3x}$)*

**Lo que debes decir:**
"Recapitulemos. La ecuación característica $r^2-5r+6=0$ factoriza como $(r-2)(r-3)=0$, así que $r_1=2$, $r_2=3$ — raíces reales distintas. La solución general es $y=C_1e^{2x}+C_2e^{3x}$. Derivamos: $y'=2C_1e^{2x}+3C_2e^{3x}$. Aplicamos $y(0)=1$: $C_1+C_2=1$. Aplicamos $y'(0)=0$: $2C_1+3C_2=0$. Resolviendo el sistema: de la primera, $C_1=1-C_2$; sustituyendo, $2(1-C_2)+3C_2=0$, es decir $2+C_2=0$, así que $C_2=-2$ y $C_1=3$. La solución particular es $y=3e^{2x}-2e^{3x}$. Verifiquen ustedes mismos que $y(0)=3-2=1$ y que $y'(0)=6-6=0$ — así es como confirman, sin dudar, que no se les perdió un signo en el camino."

---

### Diapositiva 9: Raíz Repetida — La Segunda Solución Perdida
*(La pantalla muestra $y''-6y'+9y=0$ y la pregunta "¿por qué no basta con $y=e^{3x}$?")*

**Lo que debes decir:**
"Segundo caso: $y''-6y'+9y=0$, con $y(0)=2$, $y'(0)=1$. La ecuación característica es $r^2-6r+9=0$, que es $(r-3)^2=0$ — una raíz doble, $r=3$. Aquí está la trampa: si escriben $y=C_1e^{3x}$ nada más, tienen una sola constante para satisfacer dos condiciones iniciales — es matemáticamente imposible en general. Necesitan una segunda solución independiente, y resulta ser $xe^{3x}$ — pueden verificar sustituyéndola que sí cumple la ecuación original. La solución general completa es $y=(C_1+C_2x)e^{3x}$. Aplicando las condiciones iniciales: $y(0)=C_1=2$. Derivando, $y'=C_2e^{3x}+3(C_1+C_2x)e^{3x}$, y $y'(0)=C_2+3C_1=1$, así que $C_2=1-6=-5$. La solución particular es $y=(2-5x)e^{3x}$. Regla de oro: raíz repetida siempre implica multiplicar por $x$ en la segunda solución — nunca escriban dos veces la misma exponencial con dos constantes distintas, porque en realidad es una sola constante disfrazada."

---

### Diapositiva 10: Raíces Complejas — La Fórmula de Euler
*(La pantalla muestra $y''+4y'+13y=0$ y la fórmula de Euler $e^{i\theta}=\cos\theta+i\sin\theta$)*

**Lo que debes decir:**
"Tercer caso: $y''+4y'+13y=0$, con $y(0)=0$, $y'(0)=3$. La ecuación característica es $r^2+4r+13=0$; con la fórmula general, $r=\dfrac{-4\pm\sqrt{16-52}}{2}=\dfrac{-4\pm\sqrt{-36}}{2}=-2\pm3i$. Tienen raíces complejas: $\alpha=-2$, $\beta=3$. Aquí es donde entra la fórmula de Euler, $e^{i\theta}=\cos\theta+i\sin\theta$ — permite reescribir $e^{(\alpha+\beta i)x}$ sin números imaginarios como $e^{\alpha x}(\cos\beta x+i\sin\beta x)$, y combinando las dos raíces conjugadas, la parte imaginaria se cancela y queda una solución real: $y=e^{\alpha x}(C_1\cos\beta x+C_2\sin\beta x)$. Con $\alpha=-2$, $\beta=3$: $y=e^{-2x}(C_1\cos3x+C_2\sin3x)$. Aplicando $y(0)=0$: $C_1=0$. Derivando y aplicando $y'(0)=3$, se obtiene $C_2=1$. La solución particular es $y=e^{-2x}\sin(3x)$ — una oscilación cuya amplitud decae exponencialmente. Reconocen esa forma, ¿verdad? Es exactamente el subamortiguado de hace un momento."

---

### Diapositiva 11: Los Tres Regímenes, Uno al Lado del Otro
*(La pantalla muestra la gráfica comparativa: tres curvas de desplazamiento vs. tiempo — sobreamortiguado, críticamente amortiguado, subamortiguado — para la misma masa y el mismo resorte, variando solo el amortiguamiento $c$)*

**Lo que debes decir:**
"Cerramos el círculo. Aquí tienen las tres soluciones graficadas juntas, para la misma masa y el mismo resorte, cambiando solo el amortiguador. En **sobreamortiguado**, dos exponenciales reales negativas, ninguna oscilación, regreso lento. En **críticamente amortiguado**, el regreso más rápido posible sin oscilar — por eso es el punto que buscan los ingenieros de suspensiones. En **subamortiguado**, la masa cruza el equilibrio varias veces antes de asentarse, con la amplitud decayendo dentro de una envolvente exponencial. Las tres curvas nacen de la misma ecuación diferencial y del mismo procedimiento algebraico — lo único que cambió fue el signo de un discriminante."

---

### Diapositiva 12: Ojo de Analista — Errores Comunes
*(La pantalla muestra las trampas típicas de ecuaciones de orden superior)*

**Lo que debes decir:**
"Cuatro advertencias antes de que salgan a aplicar esto. Uno: raíz repetida sin el factor $x$ — si escriben $y=C_1e^{rx}+C_2e^{rx}$, en realidad solo tienen una constante, $(C_1+C_2)$, y no van a poder satisfacer dos condiciones iniciales independientes. Dos: en raíces complejas, olvidar el factor $e^{\alpha x}$ — la parte real de la raíz no desaparece, controla la envolvente de crecimiento o decaimiento; sin ella, describen una oscilación que nunca cambia de amplitud, y eso casi nunca es físicamente cierto. Tres: aplicar la segunda condición inicial sobre la solución general sin derivar primero — $y'(0)$ es una condición sobre la derivada, no sobre $y$; es el error más común de esta técnica. Cuatro: para una ecuación de orden $n$ necesitan exactamente $n$ condiciones iniciales para fijar las $n$ constantes — dos para orden 2, tres para orden 3, y así sucesivamente."

---

### Diapositiva 13: Cierre y Próximo Paso
*(La pantalla muestra la conclusión y el gancho hacia Ecuaciones No Homogéneas)*

**Lo que debes decir:**
"Con esto, su arsenal de orden superior tiene ya los tres casos completos: raíces reales distintas, raíz repetida, raíces complejas. Pero hoy trabajamos exclusivamente con el lado derecho igual a cero — el sistema masa-resorte-amortiguador **libre**, sin ninguna fuerza externa empujándolo. ¿Qué pasa cuando alguien sí empuja el sistema — una fuerza periódica, como el paso sincronizado de miles de peatones sobre un puente? Ahí la ecuación deja de ser homogénea, y la solución que encontraron hoy se vuelve solo una pieza de una respuesta más grande. Esa es exactamente la puerta que abrimos la próxima sesión."

---
