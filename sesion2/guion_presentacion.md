# Guión de Presentación: Sesión 2 - Cálculo III

**Tono:** Profesional, técnico pero aplicado. Recordarles que como ingenieros consultores no solo buscan respuestas numéricas, sino entender qué significa si el sistema falla.

---

### Diapositiva 1: Portada y Bienvenida
*(La pantalla muestra el título "Problemas de Valores Iniciales")*

**Lo que debes decir:**
"¡Hola a todos, colegas! Bienvenidos a nuestra segunda sesión. En la clase anterior, hablamos de que las ecuaciones diferenciales describen el cambio y que al resolverlas, obtenemos una familia infinita de soluciones porque hay una constante que no conocemos. Hoy vamos a aprender cómo aterrizar esas posibilidades infinitas a la única curva que describe la realidad de nuestro sistema. Hoy aprenderemos sobre Problemas de Valores Iniciales."

---

### Diapositiva 2: Concepto PVI
*(La pantalla muestra la definición formal para 1er orden y orden n)*

**Lo que debes decir:**
"Un Problema de Valores Iniciales o PVI no es más que una Ecuación Diferencial Ordinaria acompañada de un requisito innegociable: las condiciones iniciales. Si no sabemos dónde y cómo empieza nuestro sistema, nunca podremos predecir con certeza su estado en el futuro. Para un PVI de primer orden, necesitamos un solo dato: la posición inicial. Pero atención a los PVIs de orden $n$: necesitamos $n$ condiciones iniciales evaluadas todas exactamente en el mismo instante temporal $x_0$."

---

### Diapositiva 3: Interpretación Geométrica
*(La pantalla muestra la metáfora visual de la familia de curvas vs la curva única)*

**Lo que debes decir:**
"Si lo vemos en el plano cartesiano, resolver la EDO a secas nos da todas las trayectorias posibles. Es como ver todas las trayectorias que podría tomar un avión desde un aeropuerto dependiendo del viento. Pero cuando nos dan la condición inicial, nos están clavando un alfiler en el plano. De todas esas infinitas posibilidades, nos obligan a buscar la única ruta que obligatoriamente pasa por nuestro punto de inicio. Eso es resolver un PVI."

---

### Diapositiva 4.1: Ejemplo Crecimiento Poblacional
*(La pantalla muestra el PVI de primer orden resuelto algebraicamente)*

**Lo que debes decir:**
"Para ilustrar, imaginen que el cliente les contrata para modelar conejos en una reserva. La EDO básica nos arroja que la población $P(t) = C e^{kt}$. Esa constante $C$ es un dolor de cabeza, porque no sabemos si la población empezó con 10 o con un millón. Pero en cuanto el cliente nos da la condición inicial: 'Empezamos con 50 conejos', sustituimos el tiempo cero, y obtenemos inmediatamente que la constante es 50. Listo, ahora sí tenemos un modelo real."

---

### Diapositiva 4.2: Ejemplo Sistema Masa-Resorte
*(La pantalla muestra el PVI de segundo orden para un resorte)*

**Lo que debes decir:**
"¿Y qué pasa en orden dos? Piensen en un amortiguador de un coche o una masa atada a un resorte. Si estiramos el resorte 2 metros y lo soltamos desde el reposo, tenemos dos datos en $t=0$: la posición ($x=2$) y la velocidad ($x'=0$). Para sacar nuestra curva única, tenemos que sustituir en la solución general, derivarla, sustituir de nuevo, y resolver el pequeño sistema algebraico. Observen bien los pasos, porque esto será el pan de cada día de su firma consultora."

---

### Diapositiva 5: Existencia y Unicidad (Teorema Zill)
*(La pantalla muestra el teorema 1.2.1 de Zill y el tip para analistas)*

**Lo que debes decir:**
"Aquí entra el rigor de la ingeniería. Antes de meter a todo su equipo a calcular integrales espantosas, el **Analista** de su firma tiene una responsabilidad enorme: verificar el Teorema de Existencia y Unicidad. Este teorema de Zill nos dice que si la ecuación o su derivada parcial se rompen o tienen discontinuidades cerca de nuestra condición inicial, el sistema podría no tener solución o peor aún... podría tener múltiples soluciones."

---

### Diapositiva 6.1: Falla de Unicidad
*(La pantalla muestra el contra-ejemplo de derivadas parciales no continuas)*

**Lo que debes decir:**
"Miren este monstruo: $y' = y^{1/3}$. Parece sencillo. Pero si empezamos en $y=0$, la derivada parcial de la función explota, se vuelve infinito por división entre cero. ¿Cuál es la consecuencia? El sistema tiene al menos dos soluciones válidas, quedarse en cero o crecer como parábola semicúbica. Imaginen el terror si esto fuera el diseño de un cohete: 'Señores, según nuestro modelo con estas condiciones iniciales, el cohete se queda estacionado en la base... o despega. No sabemos'. ¡Ese es el costo de no validar los teoremas!"

---

### Diapositiva 6.2: Explosión en Tiempo Finito
*(La pantalla muestra el contra-ejemplo del reactor explotando)*

**Lo que debes decir:**
"Otro peligro es ignorar el intervalo de definición. La ecuación $y' = y^2$ con inicio en 1 nos da la curva inofensiva $y = 1 / (1-x)$. Alguien sin rigor diría: 'Perfecto, modelo completado'. ¡Falso! Observen que en $x=1$, la ecuación diverge a infinito. Si están modelando la presión de un reactor químico, significa que exactamente a la hora 1, el reactor explotará. El dominio matemático $(-\infty, 1)$ les está gritando el tiempo máximo de vida del sistema."

---

### Diapositiva 7: Cierre
*(La pantalla muestra la conclusión)*

**Lo que debes decir:**
"Con esto cerramos. Quédense con esto en mente: las matemáticas no mienten, pero hay que saber preguntarles. Las condiciones iniciales son lo que nos ancla a la realidad, y el rigor analítico es lo que nos salva de diseñar puentes que colapsan. 
Para nuestra próxima sesión, empezaremos a ensuciarnos las manos con el álgebra: dejaremos la teoría y nos meteremos de lleno a encontrar nosotros mismos esas familias de curvas usando Separación de Variables y Ecuaciones Exactas. Nos vemos la próxima clase."

---
