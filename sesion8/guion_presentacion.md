# Guión de Presentación: Sesión 8 - Cálculo III

**Tono:** Técnico, con un dejo de "por fin usamos la computadora". El mensaje central: el rigor analítico no se abandona, se complementa con una herramienta nueva para cuando el álgebra se rinde. Cada ejemplo debe encadenarse con un caso que ya se resolvió exactamente en la Sesión 6, para que la comparación sea honesta y verificable.

---

### Diapositiva 1: Portada y Enganche
*(La pantalla muestra el título "Métodos Numéricos: El Método de Euler")*

**Lo que debes decir:**
"¡Bienvenidos! La sesión pasada cerramos con una confesión incómoda: hay ecuaciones diferenciales para las que ninguna sustitución conocida —separable, lineal, exacta, homogénea o Bernoulli— produce una fórmula cerrada. Y no es una excepción rara: es la norma en ingeniería real. Hoy van a aprender qué hace un ingeniero cuando el álgebra se rinde: aproximar la respuesta, paso a paso, con aritmética pura. Se llama el Método de Euler, y es la puerta de entrada a todo el análisis numérico que usarán el resto de su carrera."

---

### Diapositiva 2: Repaso Relámpago — Sesiones 1 a 6
*(La pantalla muestra los tres casos del Taller de Modelado: Carbono-14, forense, paracaidista)*

**Lo que debes decir:**
"Recuerden el Taller de Modelado: datación por Carbono-14, la hora de la muerte de un forense, la velocidad terminal de un paracaidista. Los tres los resolvimos **exactamente**, con fórmula cerrada. Hoy vamos a tomar dos de esos mismos casos y fingir, por un momento, que no conocemos el atajo algebraico — para poder comparar la aproximación numérica contra la respuesta exacta que ya tienen en su cuaderno. Así sabremos, con certeza, qué tan buena es esta nueva herramienta."

---

### Diapositiva 3: La Idea Geométrica — Sigan la Brújula
*(La pantalla muestra un campo de pendientes con una poligonal de Euler dibujada sobre la curva exacta)*

**Lo que debes decir:**
"Olvídense del álgebra un segundo y piensen geométricamente. Una ecuación diferencial $y'=f(x,y)$ les da, en cada punto del plano, la pendiente de la curva solución que pasa por ahí — es literalmente una brújula que apunta hacia dónde va la trayectoria. La idea de Euler es brutalmente simple: párense en su punto inicial, lean la brújula, caminen en línea recta un paso pequeño $h$ en esa dirección, y al llegar, **vuelvan a leer la brújula** desde el nuevo punto. Repitan. La curva poligonal que van dejando es su aproximación."

---

### Diapositiva 4: Derivación desde Taylor
*(La pantalla muestra la serie de Taylor truncada a primer orden)*

**Lo que debes decir:**
"Formalicemos esa brújula. La serie de Taylor nos dice que $y(x+h) \\approx y(x) + h\\,y'(x) + \\dfrac{h^2}{2}y''(x) + \\dots$. Euler se queda solo con los primeros dos términos: $y(x+h) \\approx y(x) + h\\,y'(x)$. Y como la ecuación diferencial nos regala $y'(x) = f(x,y(x))$ gratis, sustituimos directamente. Todo lo que estamos tirando a la basura es el término $h^2/2\\,y''(x)$ en adelante — ahí es exactamente donde va a vivir nuestro error, y por eso decimos que Euler es un método de **primer orden**: el error local es $O(h^2)$, y el error acumulado después de muchos pasos es $O(h)$."

---

### Diapositiva 5: El Algoritmo de Euler
*(La pantalla muestra la fórmula de recurrencia y el pseudocódigo)*

**Lo que debes decir:**
"Con eso, el algoritmo completo cabe en dos líneas. Dado un punto inicial $(x_0,y_0)$ y un tamaño de paso $h$: $x_{n+1} = x_n + h$, y $y_{n+1} = y_n + h\\,f(x_n,y_n)$, para $n=0,1,2,\\dots$ hasta llegar al punto que les interesa. Eso es todo. No hay integrales, no hay sustituciones ingeniosas — solo evaluar $f$ y sumar, una y otra vez. Es mecánico, es repetitivo, y por eso es perfecto para una computadora."

---

### Diapositiva 6: El Paracaidista, Otra Vez
*(La pantalla muestra el PVI del Caso 4 de la Sesión 6: dv/dt = 9.8 − 0.25v, v(0)=0)*

**Lo que debes decir:**
"Tomemos el paracaidista de 80 kg de la Sesión 6: $dv/dt = 9.8 - 0.25v$, $v(0)=0$. Ya conocen la solución exacta: $v(t) = 39.2(1-e^{-0.25t})$, con velocidad terminal de 39.2 m/s. Hoy vamos a fingir que esa fórmula no existe, y vamos a construir la trayectoria de velocidad paso a paso, con $h=1$ segundo."

---

### Diapositiva 7: Aplicando Euler Paso a Paso (h = 1)
*(La pantalla muestra la tabla de iteración completa, t=0 a t=5)*

**Lo que debes decir:**
"Aquí está la cadena completa. Empezamos en $v_0=0$. Paso 1: $v_1 = 0 + 1\\times(9.8-0.25\\times0) = 9.8$. Paso 2: $v_2 = 9.8 + 1\\times(9.8-0.25\\times9.8) = 17.15$. Paso 3: $v_3 = 17.15+1\\times(9.8-0.25\\times17.15) = 22.66$. Paso 4: $v_4=22.66+1\\times(9.8-0.25\\times22.66)=26.80$. Paso 5: $v_5=26.80+1\\times(9.8-0.25\\times26.80)=29.90$. Noten que **cada paso solo necesita el resultado del paso anterior** — así que vamos a resolverlo juntos, paso a paso, en el pizarrón. Al llegar al quinto paso tendremos la velocidad estimada a los 5 segundos."

---

### Diapositiva 8: Comparación — Euler vs. Solución Exacta
*(La pantalla muestra la tabla comparativa con columnas: t, Euler, Exacta, Error)*

**Lo que debes decir:**
"Ahora el momento de la verdad. Comparen contra la fórmula exacta $v(t)=39.2(1-e^{-0.25t})$: en $t=1$, exacta es 8.67 contra 9.80 de Euler — error de +1.13. En $t=2$, 15.43 contra 17.15 — error +1.72. En $t=3$, 20.68 contra 22.66 — error +1.98. En $t=4$, 24.78 contra 26.80 — error +2.02. En $t=5$, 27.97 contra 29.90 — error +1.93. Miren el patrón: Euler **siempre sobreestima** en este problema, y el error crece antes de estabilizarse. Ingenieros, ¿por qué creen que pasa esto? La curva $v(t)$ es cóncava hacia abajo — se va aplanando conforme se acerca a la velocidad terminal. La recta tangente de Euler, al ser recta, siempre se escapa por **arriba** de una curva cóncava hacia abajo. El signo del error no es casualidad: está directamente ligado a la segunda derivada que descartamos en Taylor."

---

### Diapositiva 9: El Precio de la Precisión — Efecto de h
*(La pantalla muestra dos poligonales de Euler sobrepuestas: h=1 vs h=0.25)*

**Lo que debes decir:**
"¿Cómo reducimos ese error? La respuesta ingenua es 'usen un paso más chico'. Y funciona: como el error acumulado es $O(h)$, si reducen $h$ a la mitad, el error se reduce aproximadamente a la mitad también. Pero eso tiene un costo: la mitad de $h$ significa el doble de pasos, el doble de aritmética. Si quieren un error diez veces más pequeño, necesitan aproximadamente diez veces más pasos. Ese es exactamente el trade-off costo-precisión que van a enfrentar toda su carrera: nadie les regala precisión infinita gratis."

---

### Diapositiva 10: El Solver Interactivo — A Jugar
*(La pantalla muestra la herramienta de la plataforma: selector de modelo, h, número de pasos, gráfica y tabla en vivo)*

**Lo que debes decir:**
"Y aquí es donde dejamos de hacerlo a mano. En la plataforma tienen un solver interactivo de Euler: eligen un modelo preconstruido —el paracaidista, el caso forense, o su propia ecuación $f(x,y)$—, ajustan $x_0$, $y_0$, el paso $h$ y el número de pasos, y el sistema les dibuja en vivo la poligonal de Euler contra la curva exacta cuando existe, junto con la tabla completa y el error en cada paso. Su reto: encuentren el valor de $h$ **más grande** que mantenga el error por debajo del 1%, gastando el menor número de pasos posible. No hay una sola respuesta correcta — hay un balance, y quiero que lo encuentren experimentando, no adivinando."

---

### Diapositiva 11: Ojo de Analista — Errores Comunes
*(La pantalla muestra las trampas típicas de métodos numéricos)*

**Lo que debes decir:**
"Cuatro advertencias antes de que se enamoren de su calculadora. Uno: Euler nunca es gratis — cada paso arrastra un poquito de error, y esos errores se acumulan; un resultado numérico sin saber su orden de magnitud de error no es confiable, es una adivinanza con más decimales. Dos: $h$ grande es rápido pero impreciso, $h$ chico es preciso pero caro — repórtenme siempre con qué $h$ obtuvieron su resultado. Tres: Euler es, a propósito, el método más simple que existe; en la práctica profesional casi nadie lo usa solo — existen primos mejorados, como Euler Mejorado o Runge-Kutta, que verán asomarse en el solver, aunque hoy no los derivamos. Cuatro: un método numérico **nunca sustituye** verificar existencia y unicidad de la Sesión 2 — si el PVI no garantiza solución única, tampoco tiene sentido aproximarla."

---

### Diapositiva 12: Ejercicio de Cierre — El Caso Forense, Versión Numérica
*(La pantalla muestra el Caso 2 de la Sesión 6: T' = k(T−20), T(0)=34.8, k≈−0.0994)*

**Lo que debes decir:**
"Cerramos con el caso forense de la Sesión 6: $T' = -0.0994(T-20)$, $T(0)=34.8°C$. Ya saben, por álgebra exacta, que a la hora $t=1$ la temperatura es $T(1)=33.4°C$ — ese dato viene directo de su tabla de la sesión pasada. Su tarea: usando Euler con $h=0.25$ —cuatro pasos hasta $t=1$—, calculen $T_4$ a mano o con el solver, y compárenlo contra los 33.4°C exactos. Si lo hacen bien, verán que el error es minúsculo, de centésimas de grado. ¿Por qué tan preciso esta vez, si con el paracaidista el error fue mucho más grande con el mismo número de pasos? Esa pregunta es su boleto de salida: piénsenla antes de irse — la respuesta tiene que ver con qué tan curvada es cada función. Tráiganla lista para la próxima sesión."

---

### Diapositiva 13: Cierre y Próximo Paso
*(La pantalla muestra la conclusión y el gancho hacia Ecuaciones de Orden Superior)*

**Lo que debes decir:**
"Con esto, su caja de herramientas tiene dos compartimentos: el álgebra exacta, para cuando existe fórmula cerrada, y la aproximación numérica, para cuando no la hay. Ambos son ingeniería real — un buen ingeniero sabe cuál usar y, sobre todo, sabe cuánto confiar en cada uno. La siguiente frontera son las ecuaciones de orden superior: cuando el fenómeno ya no depende solo de la primera derivada, sino de la aceleración, la vibración o el torque. Ahí las reglas cambian, y van a necesitar una teoría nueva para saber cuántas soluciones independientes buscar. Nos vemos en la próxima sesión."

---
