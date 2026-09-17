# Guión de Presentación: Sesión 9 - Cálculo III

**Tono:** Deliberadamente más teórico que las sesiones anteriores — el mensaje central es que antes de fabricar soluciones (eso es la Sesión 10), hay que entender qué garantiza que una solución exista, sea única, y por qué combinar soluciones simples produce la solución general. Nada de esto se resuelve hoy con álgebra pesada; hoy se construyen las reglas del juego.

---

### Diapositiva 1: Portada y Enganche
*(La pantalla muestra el título "Teoría Preliminar: Ecuaciones Lineales de Orden Superior")*

**Lo que debes decir:**
"¡Bienvenidos! La sesión pasada cerramos el capítulo de métodos numéricos. Hoy abrimos un tema nuevo — ecuaciones donde aparece la segunda derivada, la tercera, o más — pero todavía no vamos a resolver ninguna. Eso es la próxima sesión. Hoy contestamos preguntas más finas: ¿cuándo existe una solución? ¿cuándo es única? ¿qué significa exactamente una 'solución general'? Sin estas reglas, resolver ecuaciones de orden superior sería solo álgebra a ciegas."

---

### Diapositiva 2: Repaso Relámpago — De Euler a Orden Superior
*(La pantalla muestra los dos compartimentos de la Sesión 8: Álgebra Exacta y Aproximación Numérica)*

**Lo que debes decir:**
"Recuerden el cierre de la Sesión 8: álgebra exacta cuando hay fórmula cerrada, Euler cuando no la hay. Todo lo que resolvimos con álgebra exacta hasta ahora —separables, lineales, exactas, homogéneas, Bernoulli— comparte algo: son ecuaciones de **primer orden**, donde solo aparece $y'$. Hoy subimos un escalón: ecuaciones de orden $n$, donde aparecen $y'$, $y''$, hasta $y^{(n)}$. Antes de aprender a resolverlas —eso empieza en la Sesión 10— necesitamos la teoría que sostiene todo el edificio. Una advertencia rápida de vocabulario: la palabra 'homogénea' que acabo de usar —la de $dy/dx=f(y/x)$ de la Sesión 7— va a reaparecer hoy mismo con un significado completamente distinto. Se los aclaro en el momento en que llegue."

---

### Diapositiva 3: El Problema de Valor Inicial, Generalizado
*(La pantalla muestra un PVI de orden $n$: $a_n(x)y^{(n)}+\dots+a_0(x)y=g(x)$, con $y(x_0)=y_0$, $y'(x_0)=y_1$, …, $y^{(n-1)}(x_0)=y_{n-1}$)*

**Lo que debes decir:**
"Ya conocen el problema de valor inicial de primer orden desde la Sesión 2: una ecuación más una condición $y(x_0)=y_0$. La generalización a orden $n$ es natural: necesitan **una condición por cada derivada**, hasta la $(n-1)$-ésima, todas evaluadas en el mismo punto $x_0$. Para una ecuación de segundo orden, eso significa posición y velocidad iniciales; para tercer orden, agregan la aceleración inicial. Ingenieros: cuenten las condiciones antes de empezar — si les faltan o les sobran, algo está mal planteado."

---

### Diapositiva 4: El Teorema de Existencia y Unicidad
*(La pantalla muestra el enunciado del teorema, con las hipótesis de continuidad resaltadas)*

**Lo que debes decir:**
"Aquí está la garantía que hace confiable todo lo que viene después. Si $a_n(x), \dots, a_0(x)$ y $g(x)$ son continuas en un intervalo $I$, y además $a_n(x)\neq0$ en todo ese intervalo, entonces el PVI tiene **una solución, y es única**, en todo $I$. Noten las dos condiciones: continuidad de los coeficientes, y que el coeficiente principal nunca se anule. Esta segunda condición es la que más se les va a olvidar — y es exactamente donde viven la mayoría de las trampas de examen."

---

### Diapositiva 5: PVF — Un Mundo Distinto
*(La pantalla muestra un problema de valores en la frontera: mismas condiciones, pero evaluadas en dos puntos distintos, $y(a)$ y $y(b)$)*

**Lo que debes decir:**
"Ahora comparen esto con un problema de valores en la frontera: en vez de fijar $y$ y todas sus derivadas en el mismo punto, fijan $y$ en **dos puntos distintos**, $x=a$ y $x=b$. Parece un cambio menor. No lo es: el teorema que acabamos de ver **no aplica aquí**. Un PVF puede tener una solución única, ninguna, o infinitas — y no hay forma de saberlo sin resolver el problema. Esto no es una curiosidad abstracta: la deflexión de una viga, o el pandeo de una columna bajo carga, se modelan exactamente como problemas de valores en la frontera. Van a resolver uno real en la Sesión 10."

---

### Diapositiva 6: Ejemplo — Un PVF con Tres Personalidades
*(La pantalla muestra $y''+16y=0$ con tres pares distintos de condiciones de frontera)*

**Lo que debes decir:**
"Miren este ejemplo clásico: $y''+16y=0$, cuya solución general es $y=C_1\cos4x+C_2\sin4x$ — ya lo verán derivado formalmente en la Sesión 10, hoy solo lo usamos para ilustrar. En los tres casos fijamos $y(0)=0$, lo que siempre da $C_1=0$, y solo cambiamos la segunda condición. Personalidad uno — $y(\pi/2)=0$: la condición es $C_2\sin(2\pi)=0$, y como $\sin(2\pi)=0$, se cumple para **cualquier** $C_2$ — **infinitas** soluciones. Personalidad dos — $y(\pi/2)=1$: la condición es $C_2\sin(2\pi)=1$, es decir $C_2\cdot0=1$ — **ninguna** solución la satisface, es imposible. Personalidad tres — $y(\pi/8)=0$: la condición es $C_2\sin(\pi/2)=C_2=0$ — **solo** la solución trivial. La misma ecuación, la misma primera condición, y solo cambiando dónde y a qué valor evaluamos la segunda, pasamos de infinitas soluciones a ninguna a exactamente una. Esto jamás pasa con un PVI."

---

### Diapositiva 7: Combinando Soluciones — El Principio de Superposición
*(La pantalla muestra primero una pausa de vocabulario: "homogénea" en la Sesión 7 era $dy/dx=f(y/x)$ [sustitución $y=vx$]; aquí, de hoy en adelante, significa $g(x)=0$ — son dos ideas distintas, sin relación entre sí, que comparten nombre. Luego: si $y_1,\dots,y_k$ son soluciones de la homogénea (en este nuevo sentido), $C_1y_1+\dots+C_ky_k$ también lo es)*

**Lo que debes decir:**
"Antes de seguir, cumplo la promesa de hace un momento. La palabra 'homogénea' que vieron en la Sesión 7 —$dy/dx=f(y/x)$, resuelta con la sustitución $y=vx$— **no tiene nada que ver** con la que voy a usar de aquí en adelante. A partir de ahora, para una ecuación lineal de orden $n$, decimos que es **homogénea** cuando el lado derecho es cero: $g(x)=0$. Son dos propiedades distintas de dos tipos de ecuaciones distintos, que por accidente histórico comparten el mismo nombre — no hay ninguna relación matemática entre ellas, así que no intenten conectarlas. De aquí en adelante, cada vez que yo diga 'homogénea', es en este segundo sentido. Aclarado esto: volvamos a las ecuaciones homogéneas. Aquí vive una de las propiedades más útiles de la linealidad: el principio de superposición. Si $y_1, y_2, \dots, y_k$ son soluciones de la misma ecuación homogénea, entonces **cualquier combinación lineal** $C_1y_1+C_2y_2+\dots+C_ky_k$ también es solución. Pueden verificarlo sustituyendo directamente. Esto es la razón por la que, en la Sesión 10, nunca vamos a buscar 'la' solución — vamos a buscar varias soluciones simples y combinarlas."

---

### Diapositiva 8: Dependencia e Independencia Lineal
*(La pantalla muestra la definición formal y dos ejemplos: un par dependiente, un par independiente)*

**Lo que debes decir:**
"Pero combinar soluciones solo funciona si son genuinamente distintas entre sí — si una es múltiplo de otra, están reciclando la misma información con otro nombre. Un conjunto de funciones $f_1,\dots,f_n$ es **linealmente dependiente** en un intervalo si existen constantes $C_1,\dots,C_n$, no todas cero, tales que $C_1f_1+\dots+C_nf_n=0$ para toda $x$ en ese intervalo. Si la única forma de lograr esa suma cero es con todas las constantes en cero, son **linealmente independientes**. Ejemplo rápido: $f_1=x$ y $f_2=5x$ son dependientes — con $C_1=5, C_2=-1$ la combinación se anula siempre. Pero $f_1=x$ y $f_2=x^2$ son independientes: no hay forma de anular $C_1x+C_2x^2$ para toda $x$ salvo con ambas constantes en cero."

---

### Diapositiva 9: El Wronskiano — Un Detector de Independencia
*(La pantalla muestra la definición del Wronskiano como determinante, para el caso de dos funciones)*

**Lo que debes decir:**
"Revisar la definición a mano, función por función, es lento. El Wronskiano es un atajo algebraico: para dos funciones derivables, $W(f_1,f_2)=f_1f_2'-f_2f_1'$ — el determinante de la matriz de las funciones y sus derivadas. El teorema que lo hace útil: si $y_1,\dots,y_n$ son soluciones de la **misma** ecuación diferencial lineal homogénea, entonces son linealmente independientes en un intervalo si y solo si su Wronskiano **nunca se anula** ahí. Ojo con la condición — el Wronskiano solo es una prueba confiable de independencia cuando las funciones ya son soluciones de la misma ecuación; para funciones cualesquiera, un Wronskiano cero no garantiza dependencia."

---

### Diapositiva 10: Ejemplo — Calculando un Wronskiano
*(La pantalla muestra $y_1=e^{3x}$, $y_2=e^{-3x}$, soluciones de $y''-9y=0$)*

**Lo que debes decir:**
"Verifiquemos que $y_1=e^{3x}$ y $y_2=e^{-3x}$ —ambas soluciones de $y''-9y=0$— son independientes. Derivamos: $y_1'=3e^{3x}$, $y_2'=-3e^{-3x}$. El Wronskiano es $W=y_1y_2'-y_2y_1' = e^{3x}(-3e^{-3x}) - e^{-3x}(3e^{3x}) = -3-3=-6$. Como $e^{3x}\cdot e^{-3x}=e^0=1$ para toda $x$, el resultado es $-6$ sin importar el valor de $x$ — nunca es cero. Son linealmente independientes en toda la recta real, y por lo tanto forman lo que se llama un **conjunto fundamental de soluciones**."

---

### Diapositiva 11: Conjunto Fundamental y Solución General (Homogéneas)
*(La pantalla muestra: $n$ soluciones linealmente independientes de una ED homogénea de orden $n$ → solución general $y=C_1y_1+\dots+C_ny_n$)*

**Lo que debes decir:**
"Aquí se junta todo lo de hoy. Un **conjunto fundamental de soluciones** de una ecuación lineal homogénea de orden $n$ es exactamente eso: $n$ soluciones, linealmente independientes entre sí, de esa misma ecuación. Y el teorema central de esta sesión: si $y_1,\dots,y_n$ es un conjunto fundamental, la **solución general** de la ecuación homogénea es $y=C_1y_1+\dots+C_ny_n$ — combina todas las soluciones posibles, ninguna se les escapa. Esto es exactamente lo que va a hacer la ecuación característica en la Sesión 10: fabricar, de forma mecánica, un conjunto fundamental completo."

---

### Diapositiva 12: Ecuaciones No Homogéneas — $y=y_c+y_p$
*(La pantalla muestra la descomposición: solución general = función complementaria + solución particular)*

**Lo que debes decir:**
"Último ingrediente: ¿qué pasa cuando el lado derecho ya no es cero? La solución general de una ecuación **no homogénea** se construye en dos piezas. La **función complementaria**, $y_c$, es la solución general de la ecuación homogénea asociada —todo lo que acabamos de construir—. La **solución particular**, $y_p$, es cualquier función, sin constantes libres, que satisface la ecuación completa con su lado derecho. La solución general es la suma: $y=y_c+y_p$. Intuición: $y_c$ absorbe toda la libertad de las condiciones iniciales; $y_p$ carga con la 'culpa' de que el lado derecho no sea cero."

---

### Diapositiva 13: Superposición para No Homogéneas
*(La pantalla muestra: si $y_{p_1}$ resuelve con $g=g_1$ y $y_{p_2}$ con $g=g_2$, entonces $y_{p_1}+y_{p_2}$ resuelve con $g=g_1+g_2$)*

**Lo que debes decir:**
"Una última pieza, y va a ser la más útil en la próxima sesión: si $y_{p_1}$ es una solución particular cuando el lado derecho es $g_1(x)$, y $y_{p_2}$ es una solución particular cuando el lado derecho es $g_2(x)$, entonces $y_{p_1}+y_{p_2}$ es una solución particular cuando el lado derecho es la suma, $g_1(x)+g_2(x)$. En otras palabras: si el forzamiento tiene varios términos distintos —un polinomio más una exponencial, digamos—, pueden resolver **cada término por separado** y sumar los resultados. Esa es la lógica exacta detrás del método que van a aprender en la Sesión 10."

---

### Diapositiva 14: Errores Comunes
*(La pantalla muestra las trampas típicas de la teoría de orden superior)*

**Lo que debes decir:**
"Cuatro advertencias antes de pasar a los métodos. Uno: confundir PVI con PVF — un PVI de orden $n$ siempre tiene solución única bajo continuidad; un PVF, **no hay garantía**, revisen el problema completo antes de asumir. Dos: olvidar que el Wronskiano solo detecta independencia entre soluciones de la **misma** ecuación — no lo usen como prueba general para funciones arbitrarias. Tres: creer que $y_c+y_p$ es una suma cualquiera — $y_c$ debe ser la solución general de la homogénea completa, con sus $n$ constantes, no una solución particular más de la homogénea. Cuatro: en un PVI de orden $n$, contar mal las condiciones iniciales — necesitan exactamente $n$, ni una más ni una menos, todas en el mismo punto $x_0$."

---

### Diapositiva 15: Cierre y Próximo Paso
*(La pantalla muestra la conclusión y el gancho hacia los métodos de solución)*

**Lo que debes decir:**
"Con esto, tienen las reglas del juego completas: cuándo una solución existe y es única, cómo saber si un grupo de soluciones es genuinamente independiente, y cómo se construye la solución general en ambos casos, homogéneo y no homogéneo. Ninguna fórmula todavía — eso empieza ya. La próxima sesión vamos a fabricar, de manera completamente mecánica, conjuntos fundamentales de soluciones para ecuaciones con coeficientes constantes, y vamos a resolver nuestro primer caso real con valores en la frontera. Nos vemos en la Sesión 10."

---
