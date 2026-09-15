# Guión de Presentación: Sesión 7 - Cálculo III

**Tono:** Profesional, técnico pero aplicado. Estas son las últimas dos "llaves" del cofre de técnicas de primer orden — transmitir que dominar la sustitución correcta es un acto de reconocimiento de patrones, no de memorización de fórmulas.

**Nota de formato:** los dos ejemplos de esta sesión están partidos en dos diapositivas cada uno — primero el planteamiento (para resolverlo en el pizarrón con el grupo, sin que la pantalla adelante la respuesta) y luego la solución completa. No avances a la diapositiva de solución hasta haber trabajado el ejemplo en el pizarrón.

---

### Diapositiva 1: Portada y Enganche
*(La pantalla muestra el título "Soluciones por Sustitución: Homogéneas y Bernoulli")*

**Lo que debes decir:**
"¡Bienvenidos, colegas! La sesión pasada cerramos el Taller de Modelado con una pregunta incómoda: ¿qué hacemos cuando un modelo real no es separable, ni lineal, ni exacta? Hoy resolvemos ese misterio. No vamos a aprender una técnica nueva de integración — vamos a aprender un truco de disfraz: cómo cambiar de variable para que una ecuación desconocida se convierta, delante de sus ojos, en una que ya dominan."

---

### Diapositiva 2: El Mapa de las Sustituciones
*(La pantalla muestra un diagrama: Ecuación "rara" → Sustitución → Ecuación conocida)*

**Lo que debes decir:**
"La idea general es siempre la misma: tomamos una ecuación que no encaja en nuestras cuatro herramientas, hacemos un cambio de variable inteligente, y la convertimos en un problema que ya sabemos resolver. Hoy verán dos casos: las **Ecuaciones Homogéneas**, que se disfrazan de separables, y las **Ecuaciones de Bernoulli**, que se disfrazan de lineales. Mismo espíritu, distinto disfraz."

---

### Diapositiva 3: Ecuaciones Homogéneas — Identificación
*(La pantalla muestra la definición: dy/dx = f(y/x), y el criterio de M, N del mismo grado)*

**Lo que debes decir:**
"Una ecuación de primer orden es homogénea cuando puede escribirse como $dy/dx = f(y/x)$: el lado derecho depende únicamente de la razón $y/x$, nunca de $x$ o $y$ por separado. Si tienen la ecuación en forma diferencial $M(x,y)dx + N(x,y)dy = 0$, hay un atajo de detective: si $M$ y $N$ son homogéneas del **mismo grado** — es decir, si al sustituir $x\to tx$, $y\to ty$ ambas se comportan como $t^n M(x,y)$ y $t^n N(x,y)$ — la ecuación es homogénea. Ingenieros, este es su primer filtro antes de invertir tiempo en álgebra."

---

### Diapositiva 4: La Sustitución y = vx — Derivación
*(La pantalla muestra el cambio de variable paso a paso)*

**Lo que debes decir:**
"El truco es hacer $v = y/x$, o de forma equivalente $y = vx$. Como $v$ depende de $x$, al derivar usamos regla del producto: $dy/dx = v + x\,dv/dx$. Sustituyan esto en $f(y/x)$ y noten la magia: como $f$ solo depende de $v$, la ecuación completa se convierte en $v + x\,dv/dx = f(v)$, que reordenando es $\dfrac{dv}{f(v)-v} = \dfrac{dx}{x}$. ¡Eso es una ecuación separable! Resuelven en términos de $v$ y $x$, y al final regresan a las variables originales sustituyendo $v = y/x$."

---

### Diapositiva 5: Ejemplo — Planteamiento (Homogénea)
*(La pantalla muestra únicamente (x²−y²)dx + xy dy = 0, sin pasos ni respuesta, con la guía de 3 pasos)*

**Lo que debes decir:**
"Vamos con un caso real, y este lo resolvemos juntos en el pizarrón: $(x^2-y^2)dx + xy\,dy = 0$. Antes de que yo toque el gis, díganme: ¿qué es lo primero que verificamos? [Esperen la respuesta] Exacto — que $M$ y $N$ sean homogéneas del mismo grado. Aquí ambas son de grado 2, así que pasan la prueba. Ahora sí: apliquen $y=vx$, deriven con regla del producto, sustituyan en la ecuación, y resuelvan la ecuación separable que les queda en $v$ y $x$. Denle unos minutos a su equipo, yo los voy guiando en el pizarrón. Cuando lleguemos a la respuesta, la comparamos en la siguiente diapositiva."

---

### Diapositiva 6: Ejemplo — Solución (Homogénea)
*(La pantalla muestra los 4 pasos y la solución final: y² = x²(C₁ − 2ln|x|))*

**Lo que debes decir:**
"Recapitulemos lo que acabamos de hacer en el pizarrón. Despejamos: $dy/dx = (y^2-x^2)/(xy)$. Sustituimos $y=vx$: el lado derecho se simplifica bonito a $v - 1/v$. Como $dy/dx = v + x\,dv/dx$, igualamos: $v + x\,dv/dx = v - 1/v$, y los dos términos $v$ se cancelan, dejando $x\,dv/dx = -1/v$. Separamos: $v\,dv = -dx/x$. Integramos: $v^2/2 = -\ln|x| + C$. Y regresamos a las variables originales con $v=y/x$: $y^2 = x^2(C_1 - 2\ln|x|)$. Esa es la familia completa de soluciones — exactamente a donde debieron haber llegado en el pizarrón. Si a algún equipo le quedó diferente, este es el momento de encontrar dónde se perdió el signo."

---

### Diapositiva 7: Reto en Equipo — Clasifica y Resuelve
*(La pantalla muestra el ejercicio (x+y)dx − x dy = 0 para trabajo en equipo, 8-10 minutos)*

**Lo que debes decir:**
"Su turno, ahora sin mí en el pizarrón. Tienen 8 minutos, en equipo: $(x+y)dx - x\,dy = 0$. Primero verifiquen que es homogénea, luego apliquen $y=vx$ y resuelvan hasta llegar a $y = x(\ln|x| + C)$. Repártanse el trabajo como les funcione mejor — alguien puede proponer la sustitución, otro verificar cada paso algebraico, otro confirmar que la respuesta final tenga sentido dimensional. Cuando terminen, un representante al azar pasa a explicar un paso específico — así que todo el equipo debe poder defenderlo."

---

### Diapositiva 8: Transición — ¿Y si no es Homogénea?
*(La pantalla muestra una ecuación con y elevada a una potencia, mezclada con términos lineales)*

**Lo que debes decir:**
"Ahora, ¿qué pasa si la ecuación se ve casi lineal — tiene $y'$ y un término $P(x)y$ — pero del otro lado aparece $y$ elevada a una potencia molesta, como $y^2$ o $y^3$? Ya no es lineal, y probablemente tampoco sea homogénea. Pero no se asusten: existe una segunda sustitución diseñada exactamente para este caso, y los va a regresar directo a la técnica que ya dominan desde la Sesión 4: el factor integrante."

---

### Diapositiva 9: Ecuación de Bernoulli — Definición
*(La pantalla muestra la forma general dy/dx + P(x)y = Q(x)yⁿ)*

**Lo que debes decir:**
"Una ecuación de Bernoulli tiene la forma $dy/dx + P(x)y = Q(x)y^n$, con $n \neq 0, 1$ — porque si $n$ fuera 0 o 1, la ecuación ya sería lineal de las que vimos en la Sesión 4. El exponente $n$ es el que rompe la linealidad, y es exactamente lo que vamos a neutralizar con la sustitución."

---

### Diapositiva 10: La Sustitución w = y^(1-n) — Derivación
*(La pantalla muestra la derivación completa hasta llegar a una ecuación lineal en w)*

**Lo que debes decir:**
"El truco aquí es dividir toda la ecuación entre $y^n$, obteniendo $y^{-n}y' + P(x)y^{1-n} = Q(x)$. Ahora definimos $w = y^{1-n}$. Al derivar, $dw/dx = (1-n)y^{-n}\,dy/dx$, así que $y^{-n}y' = \dfrac{1}{1-n}\dfrac{dw}{dx}$. Sustituyendo, la ecuación completa colapsa a $\dfrac{dw}{dx} + (1-n)P(x)\,w = (1-n)Q(x)$. Miren bien esa expresión: es una ecuación **lineal** en $w$, exactamente la forma que resolvieron con factor integrante $\mu(x) = e^{\int (1-n)P(x)\,dx}$ en la Sesión 4. Bernoulli no es una técnica nueva — es un disfraz sobre una técnica que ya dominan."

---

### Diapositiva 11: Ejemplo — Planteamiento (Bernoulli)
*(La pantalla muestra únicamente y' + y/x = x²y², sin pasos ni respuesta, con la guía de 3 pasos)*

**Lo que debes decir:**
"Otro caso para el pizarrón: $y' + y/x = x^2y^2$. Primera pregunta para el grupo: ¿cuánto vale $n$ aquí? [Esperen la respuesta: $n=2$]. Bien — ahora dividan toda la ecuación entre $y^2$, definan $w = y^{1-n}$, deriven, y sustituyan para llegar a una ecuación lineal en $w$. Resuélvanla con factor integrante, tal como en la Sesión 4, y al final despejen $y$. Trabájenlo en equipo mientras yo lo desarrollo en el pizarrón — comparamos resultados en la siguiente diapositiva."

---

### Diapositiva 12: Ejemplo — Solución (Bernoulli)
*(La pantalla muestra los 3 pasos y la solución final: y = 1/(Cx − x³/2))*

**Lo que debes decir:**
"Recapitulemos: $n=2$, así que $w = y^{-1}$. Dividimos entre $y^2$: $y^{-2}y' + x^{-1}y^{-1} = x^2$. Hacemos $w = y^{-1}$, entonces $dw/dx = -y^{-2}y'$, así que $y^{-2}y' = -dw/dx$. Sustituyendo: $-dw/dx + w/x = x^2$, es decir $dw/dx - w/x = -x^2$. El factor integrante es $\mu(x) = e^{\int -1/x\,dx} = 1/x$. Multiplicamos: $\dfrac{d}{dx}\left(\dfrac{w}{x}\right) = -x$. Integramos: $w/x = -x^2/2 + C$, entonces $w = Cx - x^3/2$. Como $w = 1/y$, la solución final es $y = \dfrac{1}{Cx - x^3/2}$. Exactamente el mismo proceso mecánico de la Sesión 4, solo que primero tuvimos que disfrazar el problema."

---

### Diapositiva 13: Ojo de Analista — Errores Comunes
*(La pantalla muestra las trampas típicas de sustitución)*

**Lo que debes decir:**
"Cuatro trampas que les van a costar puntos. Uno: olvidar dividir entre $y^n$ antes de sustituir en Bernoulli — sin ese paso, $w$ nunca aparece limpio. Dos: confundir las dos sustituciones — $v=y/x$ es para homogéneas, $w=y^{1-n}$ es para Bernoulli; no son intercambiables, y usar la incorrecta los va a atascar en álgebra imposible. Tres: no verificar que $M$ y $N$ sean del mismo grado antes de lanzarse con $y=vx$ — si no es homogénea, la sustitución no simplifica nada. Cuatro: en Bernoulli, al dividir entre $y^n$ están asumiendo $y\neq 0$; no olviden reportar $y=0$ como una solución adicional (trivial) que se pierde en el camino."

---

### Diapositiva 14: Licitación en Vivo — Identifica la Técnica
*(La pantalla muestra 5 ecuaciones diferenciales distintas y un cronómetro)*

**Lo que debes decir:**
"Última llamada del semestre para su arsenal de primer orden completo. Les voy a mostrar cinco ecuaciones, una por una, con 30 segundos de cronómetro cada una. Su equipo debe gritar la técnica correcta — separable, lineal, exacta, homogénea o Bernoulli — y si aplica, la sustitución exacta que usarían. No estamos resolviendo, solo reconociendo el patrón. El equipo más rápido y preciso en las cinco rondas se lleva el bote completo de Tokens. Esto es exactamente el reflejo que necesitan desarrollar antes del primer parcial."

---

### Diapositiva 15: Cierre y Próximo Paso
*(La pantalla muestra la conclusión y el gancho hacia Métodos Numéricos)*

**Lo que debes decir:**
"Con esto cerramos el arsenal de ecuaciones de primer orden resolubles a mano: clasificación, PVI, separables, lineales, exactas, homogéneas y Bernoulli. Es un arsenal poderoso, pero tiene un límite honesto: existen ecuaciones — muchas de ellas modelando fenómenos reales — para las que **ninguna** sustitución conocida produce una fórmula cerrada. ¿Qué hace entonces un ingeniero cuando el lápiz y el álgebra ya no alcanzan? La próxima sesión dejamos la búsqueda de fórmulas exactas y entramos al mundo de los Métodos Numéricos: van a ver, paso a paso, cómo una computadora — o ustedes mismos, con una calculadora — aproximan la respuesta cuando no hay otra salida. Y sí, van a poder jugar con el algoritmo en la plataforma. Nos vemos la próxima clase."

---
