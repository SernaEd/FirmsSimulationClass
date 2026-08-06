# Plataforma de Aprendizaje para Cálculo 3 — Plan de Implementación v2

Plataforma web para impartir Cálculo 3 (Ecuaciones Diferenciales) en IBERO bajo un marco de **consultoría de ingeniería aplicada**. Los alumnos trabajan en equipos-firma que resuelven encargos técnicos usando modelado matemático. La plataforma administra contenido, entregas, retroalimentación entre pares, un sistema de bonificaciones canjeables por privilegios académicos, y licitaciones.

---

## 1. Marco pedagógico

- **Curso**: Cálculo 3 — Ecuaciones Diferenciales, licenciatura en ingeniería, IBERO.
- **Metáfora**: consultoría de ingeniería aplicada. Los equipos son firmas consultoras que resuelven casos con modelado matemático.
- **Principio anti-IA**: la calificación real proviene de sustentación oral y datos empíricos recolectados por los alumnos, no del entregable escrito por sí solo.
- **Principio motivacional**: los bonos ganados por trabajo en equipo son canjeables por privilegios académicos (ver §5), no se suman directamente al promedio.

### 1.1 Fines de aprendizaje del curso

Al finalizar el curso, el estudiante será capaz de:

1. Resolver ecuaciones diferenciales ordinarias relacionadas con problemas de diversos campos de la ingeniería.
2. Utilizar modelos matemáticos afines a la ingeniería para resolver problemas propios del área profesional.
3. Aplicar las técnicas de solución de las ecuaciones diferenciales a aquellas que surjan de un modelo que represente una situación real.
4. Resolver una ecuación diferencial por medio de la Transformada de Laplace y comparar su resultado con un método de solución no algebraico.

Estos fines guían el diseño de casos para licitaciones (§10), proyectos con datos empíricos (§7), y el pozo de ejercicios de práctica (§8.3).

### 1.2 Reglas de Convivencia y Aula

Para simular un entorno profesional, aplicamos las siguientes directrices:

**Permitido (Do's):**
- Trabajo colaborativo cruzado (pedir ayuda a otras firmas).
- Uso de tablets, iPads, o laptops exclusivas para cálculos o anotaciones.
- Consultar la bibliografía durante las sesiones de trabajo.
- Participaciones significativas que aporten a la clase (otorgan Tokens).

**No Permitido (Don'ts):**
- Uso de teléfonos celulares para redes sociales o distracciones.
- Salir y entrar del aula interrumpiendo la clase sin justificación.
- Uso de IA (ej. ChatGPT, Photomath) para generar respuestas directas sin razonamiento, especialmente en entregas evaluadas. (Sujeto a penalizaciones severas).
- Falta de respeto a los colegas (otras firmas) durante las licitaciones.

---

## 2. Registro y autenticación

- Datos almacenados: **nombre, apellidos, número de cuenta, nickname, PIN hasheado con bcrypt, pronombres** (opcional; default `prefiero_no_decir`).
- **Onboarding**: autorregistro abierto. Al completar el formulario, el alumno pasa **inmediatamente** al test de perfil (§3) sin esperar aprobación.
- **Estados de la cuenta**:
  1. `pending_profile` — registrado pero no ha completado el test.
  2. `pending_approval` — completó el test, aparece en el **Inbox de Aprobaciones** del admin (§11.0).
  3. `active` — aprobado, con acceso completo al Dashboard.
  4. `rejected` — el admin lo rechazó.
- **Recuperación de acceso**: el admin resetea el PIN desde el panel (no hay flujo por email).
- **Rate limiting**: 3 intentos de login por cuenta cada 15 minutos.

---

## 3. Test de perfil de trabajo en equipo

### 3.1 Aplicación

- Se toma **una sola vez, inmediatamente después del registro**, antes de que el profesor apruebe la cuenta.
- Esto permite al admin ver el perfil sugerido al momento de aprobar y facilita el balance de equipos.
- **El resultado no es editable por el alumno**. El perfil asignado es permanente durante el semestre.
- El profesor puede reasignar manualmente desde el panel admin en casos justificados.

### 3.2 Perfiles

Tres perfiles complementarios diseñados para equipos de modelado matemático:

- **Analista** — rigor, precisión, verificación de resultados.
- **Modelador** — abstracción de fenómenos reales a ecuaciones, propuesta de enfoques.
- **Integrador** — comunicación, organización del equipo, síntesis del trabajo.

El término "Integrador" tiene doble lectura intencional (integral matemática + integración de equipo).

### 3.3 Fundamento bibliográfico (visible al alumno)

En la pantalla del test y en el Dashboard aparece la referencia y una explicación breve de **por qué se usa**. Base:

- Belbin, R. M. (2010). *Team Roles at Work* (2nd ed.). Routledge.
- Belbin, R. M. (1981). *Management Teams: Why They Succeed or Fail*. Butterworth-Heinemann.
- Felder, R. M., & Brent, R. (2005). "Understanding student differences." *Journal of Engineering Education*, 94(1), 57-72.

Los tres perfiles son una adaptación reducida del modelo Belbin (que originalmente propone nueve roles) al contexto de equipos pequeños de resolución de problemas de ingeniería, alineada con las recomendaciones de Felder & Brent para educación en ingeniería.

### 3.4 Estructura del cuestionario

- 8-10 preguntas de escenario ("En un equipo trabajando en X, ¿qué tiendes a hacer?").
- 3 opciones por pregunta, una asociada a cada perfil.
- Resultado: perfil con mayor puntaje, empates resueltos por Integrador → Modelador → Analista (heurística de balance).

---

## 4. Sistema de retroalimentación entre pares

El motor principal para ganar bonos. **La bonificación depende del trabajo en equipo, evaluado por los pares.**

### 4.1 Ciclos de retroalimentación

- Al cierre de cada **módulo de estudio** (aprox. cada **3-4 semanas** dado que el semestre tiene ~15 semanas y 4 módulos) se abre una ventana de retroalimentación de 5 días.
- Cada integrante evalúa a **cada uno de sus compañeros de equipo** en tres dimensiones alineadas con los perfiles:

  | Dimensión | Qué se evalúa |
  |---|---|
  | **Rigor** | Verifica resultados, cuestiona supuestos, cuida la precisión. |
  | **Aporte técnico** | Propone enfoques, plantea el modelo, contribuye ideas. |
  | **Colaboración** | Comunica claro, organiza al equipo, ayuda a compañeros. |

- Cada dimensión en escala 1-5 + **justificación obligatoria en texto libre** (mínimo 20 caracteres). Sin justificación, la calificación no cuenta.

### 4.2 Sistema de kudos (feedback positivo continuo)

En paralelo a los ciclos formales, cualquier alumno puede dar **kudos** a un compañero de su equipo en cualquier momento. **Enviar un kudos cuesta Tokens del propio banco del remitente**, lo cual auto-regula el sistema: solo se envían cuando el emisor considera que el compañero realmente lo merece.

- **Costo por kudos**: 10 Tokens del banco del remitente.
- **Valor recibido**: 10 Tokens al banco del receptor (transferencia neta cero para el sistema; es un acto de reconocimiento genuino).
- Categorías: `#rigor`, `#creatividad`, `#claridad`, `#apoyo`.
- Texto corto obligatorio (mín. 20, máx. 200 caracteres) explicando por qué.
- No hay tope de kudos por semana: el costo actúa como regulador natural.
- Anónimo para el receptor y pares; el admin ve emisor y receptor reales.
- Solo se puede enviar a integrantes del propio equipo.
- Si el remitente no tiene saldo suficiente, la acción se bloquea.

### 4.3 Uso de la retroalimentación

**La retroalimentación entre pares NO otorga ni descuenta Tokens automáticamente.** Su función es dar al profesor visibilidad sobre las dinámicas de equipo. El profesor, tras revisar los ciclos, puede aplicar **ajustes discrecionales** al banco de cualquier alumno (positivos o negativos) desde el panel admin, dejando una nota justificativa.

Beneficios de mantenerla obligatoria aunque no dé Tokens automáticos:

- Detecta conflictos y sesgos temprano.
- La justificación obligatoria es un ejercicio reflexivo valioso.
- Da al profesor evidencia documentada para conversaciones difíciles.
- Alimenta las alertas anti-patrones (colusión, venganzas) que el profesor revisa.

### 4.4 Anti-abuso

- Todas las evaluaciones y kudos son **anónimos para los pares** pero visibles con autor real para el profesor.
- Detección automática de patrones sospechosos: todos los 5s, todos los 1s, texto duplicado, evaluaciones sincronizadas.
- Cuando se detecta un patrón, se crea un ítem en el **Inbox de Aprobaciones** (§11.0) de tipo `feedback_sospechoso` para revisión manual del profesor.

---

## 5. Banco unificado de Tokens y catálogo de privilegios

Todos los Tokens ganados en la plataforma van a un **único banco personal**. No se suman al promedio; se canjean por privilegios académicos.

### 5.1 Fuentes de Tokens

El diseño busca que **la mayoría de los Tokens venga de esfuerzo individual** para que ningún alumno se sienta obligado a cargar con su equipo ni penalizado por integrantes ausentes.

**Fuentes individuales (aprox. 65% del ingreso típico):**

| Fuente | Rango típico | Detalle |
|---|---|---|
| Ejercicios de práctica auto-calificados por módulo | 40-50 Tks/módulo | Ver §8.3 |
| Sustentación destacada | 15-30 Tks por ocasión | Cuando el sorteo te toca y sustentas con claridad |
| Asistencia | 2-5 Tks por día | Registro diario operado desde el panel de admin |
| Participación significativa | 5-15 Tks por aporte | Preguntas o comentarios que aporten gran valor a la clase |
| Post destacado en foro | 10-20 Tks | El profesor marca posts especialmente útiles o claros |
| Racha diaria estilo Duolingo | 2 Tks/día + hitos (~386 Tks techo semestral) | Reto corto lunes-jueves; ver §5.5 |
| Ajustes discrecionales del profesor | variable | Incluye ajustes derivados de retroalimentación de pares |

**Fuentes de equipo (aprox. 35% del ingreso típico):**

| Fuente | Rango típico | Detalle |
|---|---|---|
| Licitaciones | 5-40 Tks por licitación | Distribución por podium (ver §10). Solo integrantes presentes |
| Bono discrecional por proyecto excepcional | variable | A criterio del profesor |

**Transferencias entre alumnos:**

| Mecanismo | Detalle |
|---|---|
| Kudos entre compañeros de equipo | Transferencia directa 10 Tks (§4.2). Es el único mecanismo de transferencia entre alumnos y solo puede circular al interior de un mismo equipo. |

**No existen transferencias directas de saldo entre alumnos.** El único movimiento entre cuentas es el kudos con contenido justificativo, para evitar chantajes o presión social sobre Tokens.

**Ingreso típico por semestre**: 300-450 Tokens para un alumno regular. **Techo aspiracional** (racha perfecta + práctica completa + kudos activos + licitaciones ganadas): ~700 Tokens.

### 5.2 Catálogo de privilegios

Los costos y restricciones son editables desde el panel admin.

#### Tareas y entregas

| Privilegio | Costo | Restricciones |
|---|---|---|
| Pista oficial en una pregunta de tarea | 25 | Máx. 2 por tarea |
| Saltar una pregunta de tarea | 30 | Máx. 1 por tarea |
| Reintentar una pregunta calificada | 40 | Máx. 1 por tarea |
| Extensión de 24h en entrega | 40 | Máx. 3 por semestre |
| Extensión de 48h en entrega | 80 | Máx. 2 por semestre |
| Extensión de 72h en entrega | 150 | Máx. 1 por semestre |
| Saltar una tarea completa | 150 | Máx. 2 por semestre |
| Revisión previa de borrador de proyecto | 120 | Máx. 1 por proyecto |

#### Exámenes parciales (no aplica al examen final)

| Privilegio | Costo | Restricciones |
|---|---|---|
| Saltar 1 pregunta de examen parcial | 80 | Máx. 2 por examen |
| Consultar 1 duda al profesor durante examen | 60 | Máx. 2 por examen |
| Usar hoja de fórmulas propia en un parcial | 100 | Máx. 1 parcial completo |
| Reintentar un examen corto (quiz) | 120 | Máx. 1 por semestre |
| Usar IA durante un examen parcial | 380 | Máx. 1 parcial completo por semestre. **Oculto por defecto**; requiere activación explícita desde el panel admin (`flags.ai_in_exam_enabled`) una vez que la coordinación académica lo autorice. Mientras esté desactivado, no aparece en el catálogo del alumno. |

#### Sustentación oral

| Privilegio | Costo | Restricciones |
|---|---|---|
| Postergar sustentación a la siguiente clase | 100 | Máx. 1 por semestre |

#### Racha

| Privilegio | Costo | Restricciones |
|---|---|---|
| Pase de racha adicional (§5.5) | 30 | Sin tope; se acumulan en el inventario del alumno |

#### Tutoría y apoyo

| Privilegio | Costo | Restricciones |
|---|---|---|
| Sesión de tutoría individual (30 min) con el profesor | 180 | Máx. 2 por semestre |

#### Asistencia

| Privilegio | Costo | Restricciones |
|---|---|---|
| Retardo justificado (llegada tardía 5-15 min) | 30 | Máx. 3 por semestre |
| Pase de asistencia (1 clase) | 100 | Máx. 1 por semestre |

### 5.3 Flujo de canje

1. El alumno abre el catálogo y selecciona un privilegio.
2. **Pago dividido (Split Bill) para privilegios grupales**: si el privilegio afecta a todo el equipo (ej. extensión de entrega de proyecto), el alumno que lo solicita puede proponer un "Split Bill". En este caso, el alumno especifica qué cantidad de Tokens aportará él y abre la solicitud para que sus compañeros cubran el resto. El privilegio queda en estado **pendiente**; cada integrante del equipo debe autorizar explícitamente la compra desde su Dashboard y definir la cantidad exacta de Tokens que aportará. El privilegio solo se aprueba y se emite el ticket cuando la suma de aportaciones confirmadas cubre el costo total.
3. Sistema valida saldo y restricciones activas (topes por tarea, examen, semestre).
4. Se genera un **ticket con folio único** que el alumno presenta (pantalla o impreso) al profesor al momento de usarlo.
5. El profesor lo marca como consumido desde el panel.
6. Historial visible para alumno y admin.
#### Vista "Ver movimientos" del banco

El alumno accede desde el widget "Saldo del banco" del Dashboard (§14.2, widget 3) a una vista cronológica de todos sus movimientos:

- Cada renglón: fecha, fuente (mismo enum de `PointsLedger`), delta (`+` o `−`), saldo acumulado tras el movimiento, referencia (link al ejercicio, licitación, kudos, o ticket que originó el movimiento) y nota (si aplica).
- Filtros por fuente y rango de fechas.
- Exportable a CSV desde la propia vista.
- El ledger es **append-only**: los movimientos históricos no se pueden editar, solo compensar con otro movimiento.

### 5.4 Restricciones globales

- El **examen final** no admite ningún privilegio que altere su formato o contenido (integridad de la evaluación certificadora).
- El **proyecto final** no admite saltos ni extensiones.
- Los privilegios son personales y no son transferibles entre alumnos.
- Un privilegio consumido no es reembolsable.

#### Tokens sobrantes al cierre del semestre

Los Tokens no gastados al terminar el semestre **pueden canjearse por décimas** (fracciones de calificación) en un examen o tarea a elección del alumno, sujeto a **autorización explícita del profesor**.

- Conversión sugerida por defecto: **50 Tks = 1 décima** (0.1 Tks de calificación sobre 10). Configurable desde admin.
- El alumno solicita el canje desde su Dashboard, especificando entrega objetivo y cantidad de décimas.
- El profesor revisa la solicitud desde el panel admin y aprueba/rechaza con nota.
- Ninguna décima puede aplicarse al examen final ni al proyecto final.
- Ventana de canje: se activa cuando el profesor pasa el semestre al estado `canje_abierto` (§17.0) y se cierra cuando el profesor pasa el semestre al estado `cerrado`.

### 5.5 Rachas diarias estilo Duolingo

Reconocimiento a esfuerzo constante mediante un reto corto diario. Diseñado para respetar el fin de semana y el viernes.

#### Mecánica

- **Ventana de reto**: cada día hábil de **lunes a jueves** se publica un ejercicio corto de práctica (10-15 min estimados). **Viernes, sábado y domingo son días neutros**: no cuentan para la racha ni la interrumpen.
- **Contenido**: seleccionado automáticamente del **pozo del módulo activo** (§8.3). Parametrizado por alumno, validado con SymPy.
- **Puntaje por día completado**: 2 Tks al banco personal.
- **La racha crece +1 por cada día hábil completado**. Un lunes-jueves cerrado sin completar el reto **reinicia la racha a 0**.

#### Excepciones (racha no se rompe)

- **Días marcados como festivos o sin clase** en el panel admin. El profesor define estos días manualmente desde un calendario del panel; se comportan como días neutros (equivalente a viernes/fin de semana).
- **Ausencia del profesor**: si no se publica reto un día por motivo del profesor, la racha **se mantiene automáticamente** para todos los alumnos con racha activa. El sistema detecta que no hay reto disponible ese día y lo marca como neutro para efectos de racha.
- **Enfermedad u otra situación personal**: el profesor gestiona manualmente con ajuste directo desde el panel admin (aplicar pase de racha automático, o restaurar racha previa con nota justificativa).

#### Pases de racha (congelamientos)

- Cada alumno recibe **2 pases gratuitos** al inicio del semestre.
- Un pase protege automáticamente un día hábil no completado; la racha continúa.
- Pases adicionales pueden comprarse desde el catálogo (§5.2, 30 Tks c/u).
- Los pases no consumidos no se pierden por inactividad ni por transcurrir días neutros; se conservan hasta ser usados. **Al ejecutar el reset de semestre desde la Danger zone (§17.2), la información de `StreakState` se purga junto con el resto — por lo tanto los pases sobrantes se archivan con el snapshot histórico del semestre pero no atraviesan al siguiente ciclo.**

#### Bonos por hitos

Además de los 2 Tks diarios, se otorgan **una sola vez** aunque la racha se reinicie después:

- 4 días consecutivos (1 semana escolar): +10 Tks
- 12 días (3 semanas): +30 Tks
- 24 días (medio semestre): +70 Tks
- 48 días (semestre completo): +180 Tks

**Techo aspiracional**: racha perfecta durante todo el semestre ≈ 386 Tks (96 base + 290 hitos).

#### Visualización

- **Calendario mensual** en el Dashboard (widget principal, ver §14.2) con una casilla por día del mes.
- Cada día lunes-jueves completado: **palomita verde**.
- Días neutros (viernes, fin de semana, festivos marcados): grises sin ícono.
- Días fallidos: casilla vacía con borde rojo tenue.
- Días con pase de racha aplicado: ícono de escudo azul.
- Contador grande de "días de racha activa" al centro superior del calendario.
- Barra de progreso hacia el siguiente hito.

#### Procesamiento

- Zona horaria del cálculo: **America/Mexico_City** (CDMX).
- El cálculo corre en el servidor cada medianoche CDMX del día siguiente (jueves 23:59 → viernes 00:00 evalúa el jueves).
- Job programado con **APScheduler** dentro de FastAPI (ver §12.4).

---

## 6. Formación de equipos

- Generación aleatoria desde el panel admin.
- **Tamaño**: mezcla de 3 y 4 según el total de inscritos, buscando que nadie quede solo.
- **Balance**: distribución equitativa de perfiles (idealmente uno de cada perfil por equipo, cuando el conteo lo permita).
- Cada equipo elige un nombre de firma consultora (ver §6.2).
- **Chat privado** por equipo vía WebSocket, persistente durante el semestre.

### 6.1 Manejo de bajas

- **Escalado dinámico**: los umbrales de Tokens en tareas grupales se ajustan al tamaño activo del equipo.
- **Consolidación de equipos**: si un equipo queda con ≤2 miembros, el admin puede fusionarlo con otro reducido.

### 6.2 Nombre de la firma

- Al momento de formar los equipos, cada equipo tiene **7 días** para proponer un nombre desde el chat interno (cualquier integrante propone; se aprueba por mayoría simple con votación integrada al chat).
- La propuesta queda **pendiente de moderación** en el **Inbox de Aprobaciones** (§11.0, categoría `nombre_firma`). El profesor aprueba o pide cambio (por ejemplo, si el nombre es ofensivo o inapropiado).
- Si al día 7 no hay propuesta aprobada, el sistema asigna un nombre genérico (`Firma A`, `Firma B`, ...) y el equipo puede solicitar cambio posterior una sola vez.
- Longitud: 3-40 caracteres. Se permiten letras, números y espacios; no emojis ni caracteres especiales fuera de acentos y guiones.

### 6.3 Envíos grupales únicos (Tareas y Licitaciones)

Para evitar duplicidad y conflictos, **las tareas y licitaciones grupales solo permiten un envío por equipo**.
- La interfaz mostrará en tiempo real si otro miembro del equipo (ej. el Analista) ya subió un archivo o envió la respuesta.
- El primer envío exitoso bloquea la opción de envío para los demás integrantes del equipo y queda registrado a nombre de la Firma.

---

## 7. Anti-dependencia de IA

### 7.1 Tipología de entregas

Existen dos tipos de entregas en la plataforma:

| Tipo | Alcance | Sustentación oral | Datos empíricos |
|---|---|---|---|
| **Tarea** | Individual o grupal, corta (típico: 1-2 problemas por módulo) | No aplica en las individuales; opcional en las grupales | No requeridos |
| **Proyecto final** | Grupal, único en el semestre | Obligatoria | Obligatorios |

- Se prevé **un único proyecto final** por semestre (por definir en detalle: tema, dataset esperado, fenómeno físico a modelar, fecha).
- El proyecto final integra el aprendizaje de los 4 módulos y es la evaluación integradora del curso.

### 7.2 Sustentación en pizarrón

- **Aplica solo a entregas grupales** (tareas grupales y proyecto final). Las tareas individuales no llevan sustentación.
- Reparto por defecto: **70% entrega escrita + 30% sustentación oral**. Configurable por-tarea desde el panel admin (ej. 60/40 en proyecto final, 80/20 en tareas grupales cortas).
- La sustentación se cobra a un integrante del equipo seleccionado **al azar en clase**, quien debe explicar el modelo y su justificación.
- Si la persona sorteada no puede sustentar, el equipo pierde el 30% de sustentación de esa entrega (salvo uso de privilegio de cesión de turno, §5).
- **Sustentación destacada**: cuando el profesor considera que la sustentación fue especialmente clara y sólida, otorga al alumno un bono individual (15-30 Tks) al banco personal.

### 7.3 Datos empíricos obligatorios (proyecto final)

- Datos recolectados físicamente por el equipo (ej. curva de enfriamiento de un café con termómetro, vaciado de un tanque perforado).
- La entrega incluye **video corto** del proceso de recolección con los siguientes requisitos técnicos:
  - Duración: **máx. 2 minutos**.
  - Tamaño: **máx. 100 MB**.
  - Formatos aceptados: **MP4, MOV, WebM**.
  - Contenido mínimo: aparición de al menos un integrante identificable + instrumento de medición visible + evidencia del fenómeno físico observado.

Ambos mecanismos (sustentación aleatoria y datos empíricos con video) hacen que la IA sola no pueda producir un entregable completo del proyecto final.

---

## 8. Contenido y módulos

### 8.1 Fuente: Notion

- El temario reside en Notion, organizado por Sesiones (Clases). Cada clase tiene su propia sub-página en Notion.
- **Sincronización manual** desde el panel admin mediante un botón "Sincronizar Clase".
- **Pipeline de contenido**: Notion API → descarga de bloques en formato compatible con `react-notion-x` → persistencia en la BD local → renderizado en la página específica de la "Vista de Clase". La vista de clase muestra: NotionRenderer (arriba) + Visor de PDF embebido (medio) + Sección de Comentarios estilo YouTube (abajo).
- **Limitador de Tasa (Rate Limiting):** El proceso de sincronización incluirá retrasos artificiales (ej. 0.35s entre peticiones) para respetar el límite de 3 peticiones por segundo de la API de Notion y evitar errores 429.
- **Retry con backoff exponencial**: si aun así aparece un 429, el cliente reintenta con backoff (1s, 2s, 4s, 8s, hasta 3 reintentos) y solo aborta la sincronización si todos los reintentos fallan, dejando la BD en el último estado consistente.
- **Sin peticiones automáticas a Notion API** durante uso normal.
- El admin puede ver diff entre la versión sincronizada y la última descarga.

### 8.2 Estructura y desbloqueo de módulos

- Los módulos están ocultos por defecto. El admin los desbloquea manualmente uno a uno para evitar que los alumnos se adelanten.
- Cada módulo es un contenedor de Sesiones (Clases). Cada clase tiene su propia página de teoría (Notion + PDF) y su propio hilo de comentarios. Los ejercicios de práctica y entregas siguen agrupados a nivel Módulo.
- **Módulos simultáneos**: los módulos previamente desbloqueados **permanecen accesibles** al desbloquear uno nuevo (los alumnos pueden seguir consultando notas y practicando ejercicios de módulos pasados).
- **Módulo activo** (para efectos de racha diaria §5.5 y widget "Módulo activo" del Dashboard §14.2): es el **último módulo desbloqueado**. Es la fuente del que sale el reto del día y donde se enfoca el widget principal.

#### Módulos del curso (temario oficial)

El curso está estructurado en **4 módulos**. Los pozos de Tokens y ciclos de retroalimentación se calibran alrededor de esta división.

| # | Módulo | Subtemas |
|---|---|---|
| 1 | **Técnica básica** | 1.1 Clasificación de EDs: lineales y no-lineales. 1.2 Problema de valores iniciales e interpretación geométrica/física. 1.3 Ecuaciones separables, factor de integración y ecuaciones exactas. 1.4 Ecuación lineal de primer orden. 1.5 Ecuaciones lineales de orden superior. 1.6 Sistemas de ecuaciones diferenciales. |
| 2 | **Transformada de Laplace** | 2.1 Definición. 2.2 Solución de ecuaciones aisladas y en sistemas. 2.3 Concepto de función de transferencia. |
| 3 | **Teoría cualitativa** | 3.1 Concepto de sistema dinámico. 3.2 Órbitas. 3.3 Plano fase. 3.4 Interpretación del plano fase. |
| 4 | **Ecuaciones diferenciales parciales: separación de variables** | 4.1 Problema de Sturm-Liouville. 4.2 Separación de variables. 4.3 Aplicaciones: ecuación de onda, ecuación de Poisson. |

**Calibración por defecto** (ajustable en admin):

- Pozo de práctica por módulo: **50 Tks para módulo 1** (más extenso, 6 subtemas) + **40 Tks para módulos 2, 3 y 4** = **170 Tks máximos por práctica en el semestre**.
- Un ciclo de retroalimentación entre pares por módulo = **4 ciclos por semestre**.

### 8.3 Ejercicios de práctica individuales (con SymPy)

Fuente principal de Tokens personales. Cada módulo incluye un banco de ejercicios de práctica auto-calificados con **SymPy** en el backend.

- **Parametrización**: cada alumno recibe una variante con parámetros numéricos ligeramente distintos (mismo tipo de ecuación, coeficientes generados a partir de una semilla derivada de `hash(numero_cuenta + ejercicio_id)`). Reproducible y difícil de compartir.
- **Autoría de ejercicios (Admin UI)**: el profesor cuenta con una interfaz gráfica amigable para definir los ejercicios sin tener que programar cada vez. Puede definir variables con rangos (ej. `A = random_int(1, 5)`, `B = random_choice([2, 4, 6])`) asegurando que el problema siempre tenga solución manejable. Además, se habilita un **"Modo Avanzado (Fallback a Python)"** donde el profesor puede inyectar un script corto de Python (`def generate_problem(seed): ...`) para problemas más complejos que requieran lógica condicional.
- **Intentos**: hasta 2 por ejercicio. Primer intento correcto: 100% de Tokens. Segundo intento correcto: 60%. Fallidos: 0.
- **Tope por módulo**: pozo fijo de Tokens disponibles por módulo (**default 40 Tks**, con excepción del **módulo 1 en 50 Tks** por su mayor extensión — ver §8.2). Cuando el pozo se agota, los ejercicios adicionales siguen practicables pero ya no otorgan Tokens.
- **Sin límite de tiempo** por ejercicio individual, pero timestamp registrado para detección de patrones anómalos.

#### 8.3.1 Captura de respuestas: editor matemático visual

Para que los alumnos no dependan de sintaxis (`**`, `*`, `sqrt()`, `exp()`, etc.), integramos **MathLive** como editor WYSIWYG:

- **Frontend**: componente `<math-field>` de MathLive con teclado virtual matemático (integrales, derivadas, fracciones, exponentes, raíces, símbolos griegos, matrices, límites, sumatorias).
- **Interfaz**: los alumnos escriben la expresión tal como se ve en un cuaderno; el editor renderiza en tiempo real y produce **LaTeX** internamente.
- **Compatibilidad móvil**: teclado virtual optimizado para pantallas táctiles (importante para licitaciones y racha diaria).
- **Preview en tiempo real**: mientras editan ven la expresión renderizada bonita.
- **Modo dual opcional**: alumnos experimentados pueden alternar a modo texto LaTeX si prefieren teclear directamente.

#### 8.3.2 Validación con SymPy

Pipeline de validación:

1. Frontend envía la respuesta en **LaTeX** (salida nativa de MathLive).
2. **Pre-procesamiento (Limpieza de LaTeX y Derivadas):** El backend aplica expresiones regulares avanzadas antes del parseo para:
   - Normalizar multiplicación implícita (ej. convertir `2x` a `2*x`).
   - Diferenciar variables independientes: detectar si se usa $\frac{dy}{dx}$ vs $\frac{dy}{dt}$ para convertirlos internamente a la notación correcta de `Derivative` de SymPy (`Derivative(y(x), x)` o `Derivative(y(t), t)`). Esto permite a los alumnos seguir usando notación de fracción sin que el validador colapse.
   - Ofrecer una vista previa en el frontend para que el alumno verifique que el sistema interpretó correctamente su notación.
3. Backend parsea LaTeX normalizado → objeto SymPy con `sympy.parsing.latex.parse_latex` (requiere paquete `antlr4-python3-runtime`).
4. **Normalización de constantes libres**: en EDOs las soluciones incluyen constantes de integración (`C_1`, `C_2`, `K`, etc.). El validador identifica símbolos libres de la respuesta del alumno y los mapea a los símbolos libres esperados por posición y estructura antes de comparar (`Poly.match` o `wild symbols` de SymPy). Esto evita rechazar respuestas correctas solo porque el alumno usó `K` en lugar de `C_1`.
5. Comparación con la respuesta esperada:
   - `sympy.simplify(respuesta_alumno - respuesta_esperada) == 0` para equivalencia simbólica.
   - Tolerancia numérica configurable para respuestas decimales.
   - Verificación por sustitución para EDOs (la solución propuesta satisface la ecuación al derivar y sustituir). **Este es el método más robusto** para EDOs y se prioriza sobre la comparación por simplificación cuando aplica.
6. Devuelve resultado + retroalimentación (correcto / incorrecto / equivalente pero no simplificado).

#### 8.3.3 Seguridad

- **Sandboxing**: `parse_latex` con lista blanca de símbolos permitidos; ningún `eval` de código arbitrario.
- **Timeout**: cada validación tiene tope de 3 segundos para evitar consultas maliciosas que cuelguen el worker.
- **Rate limiting**: máx. 30 validaciones por alumno por minuto.
- **Longitud máxima** de expresión LaTeX: 2000 caracteres.

---

## 9. Foro por módulo

- Al publicar, el alumno **elige por post** entre:
  - Mostrar su **nickname**.
  - Publicar **anónimo para pares**.
- En ambos casos, el profesor ve el autor real en el panel admin.
- Hilos con respuestas anidadas (un nivel), soporte de LaTeX inline para ecuaciones.
- Rate limit: máximo 5 publicaciones por alumno por hora en cada foro.
- **Post destacado**: el profesor puede marcar un post como destacado desde admin, otorgando 10-20 Tks al banco personal del autor. Motiva contribuciones de calidad al foro. El post destacado queda anclado al inicio del hilo con etiqueta visible.

---

## 10. Licitaciones

Sesiones síncronas en el aula donde las firmas consultoras (equipos) compiten por un encargo técnico. El profesor actúa como cliente que abre la **licitación**: proyecta el caso, las firmas presentan su propuesta desde sus dispositivos vía WebSocket, y gana la firma que resuelve con mayor precisión y agilidad.

### Formato

- **Duración**: 30-45 minutos por licitación.
- **Frecuencia**: cada 2 semanas (aprox. **7-8 licitaciones por semestre**).
- **Estructura sugerida por licitación**:
  1. Presentación del caso por el profesor (5-8 min).
  2. Fase de planteo: las firmas envían su enfoque inicial (10-15 min).
  3. Fase de resolución: envío de solución final (10-15 min).
  4. Revisión y anuncio de resultados (5-7 min).

### Puntuación

Distribución por firma en cada licitación:

| Resultado de la firma | Tokens por integrante presente |
|---|---|
| **Ganadora** (respuesta correcta enviada primero) | 35-40 Tks |
| **2° lugar** (respuesta correcta enviada segundo) | 22-25 Tks |
| **3° lugar** (respuesta correcta enviada tercero) | 15-18 Tks |
| **Respuesta correcta fuera de podio** | 10 Tks (bono técnico) |
| **Respuesta incorrecta pero enviada dentro del tiempo** | 5 Tks (bono de participación) |
| **No envió respuesta** | 0 Tks |

- Los Tokens alimentan el **banco unificado** de cada integrante presente (§5). No afectan directamente la calificación.
- Solo reciben Tokens los integrantes **presentes** en la licitación; los ausentes no participan de la distribución.
- Los rangos exactos (35-40, 22-25, etc.) permiten al profesor ajustar por dificultad del caso.

### Aspectos técnicos

- **Rendimiento de base de datos**: para evitar cuellos de botella con envíos simultáneos, el estado de la licitación, los puntajes y el orden de llegada se manejan en la memoria RAM del servidor (FastAPI); se hace escritura masiva (bulk insert) a MySQL solo al finalizar la pregunta o la licitación.
- Requiere prueba previa de red del aula para 25 conexiones concurrentes.
- **Modo de contingencia offline**: si la red falla, las respuestas se capturan en papel y el profesor las registra manualmente después.

---

## 11. Panel de administrador

Vistas y acciones disponibles solo para el profesor. Organizadas por sección.

### 11.0 Inbox de Aprobaciones (Centro de Notificaciones)

Centro unificado de atención para el profesor. Todas las acciones de los alumnos o del sistema que requieran revisión manual caen en esta bandeja de entrada, mostrando un *badge* numérico con el conteo de pendientes y colores por prioridad.

**Categorías de items:**

| Categoría | Origen | Prioridad sugerida |
|---|---|---|
| Alumnos recién registrados | Estado `pending_approval` (§2) | Media |
| Propuestas de nombres de firma | `TeamNameProposal` con estado `pendiente_mod` (§6.2) | Baja |
| Solicitudes de canje de Tokens por décimas | `DecimalRedemptionRequest` en estado `canje_abierto` (§5.4, §17.0) | Media |
| Disputas abiertas por alumnos | `Dispute` con estado abierto (§18.3). **Plazo de respuesta: 5 días hábiles** | Alta |
| Procesos sancionatorios en curso | Alumno con derecho de audiencia (48h) o vencido, esperando decisión (§18.4) | Alta |
| Retroalimentaciones marcadas como sospechosas | Detector anti-abuso (§4.4) — patrones de colusión o venganza a revisar | Alta |
| Sustentaciones destacadas pendientes de asignar | Recordatorio 24-48h tras una sustentación no marcada (§7.2) | Baja |
| Posts destacados pendientes de asignar | Recordatorio periódico si el profesor no ha destacado posts en X días | Baja |
| Alertas de sistema — inactividad | Job `detect_inactivity` los lunes (§16.3) | Media |
| Alertas de sistema — otras | Errores de sincronización de Notion, saturación de disco, jobs fallidos | Variable |

**Acciones disponibles por item:**

- **Resolver** (aprobar, rechazar, atender): abre el detalle o redirige al módulo correspondiente.
- **Posponer / Snooze**: oculta el item hasta una fecha/hora seleccionada. Vuelve al Inbox al vencer.
- **Descartar** con nota: útil para alertas falsas positivas del detector anti-abuso.
- **Marcar como visto sin acción**: reconoce el item sin resolverlo (para casos informativos).

**Ordenamiento y filtros:**

- Ordenado por prioridad y antigüedad por default.
- Filtros por categoría, prioridad y estado.
- Contador histórico de items resueltos por categoría (mes actual, semestre).

### 11.1 Alumnos y equipos

- **Reset de PIN** por alumno.
- **Generador de equipos** aleatorio balanceado, y consolidación manual.
- **Ajustes por alumno**: Tokens manuales (positivos o negativos, con nota justificativa), aplicación de pase de racha, restauración de racha por enfermedad, asignación de Tokens por alta tardía.
- **Alertas de inactividad**: las alertas de alumnos inactivos ≥14 días se enrutan al Inbox (§11.0, categoría `alerta_inactividad`); esta sección solo contiene la vista de detalle y las acciones sobre el alumno.

### 11.2 Contenido y evaluación

- **Sincronización de Notion**: botón manual + vista de diff.
- **Desbloqueo de módulos** uno a uno.
- **Configuración de ejercicios de práctica**: definir pozo de Tokens y ejercicios elegibles por módulo.
- **Gestor de calificaciones**: tabla editable tipo hoja de cálculo con exportación CSV.
- **Configuración por-tarea** del reparto entrega escrita / sustentación oral (default 70/30).
- **Registrar sustentación destacada** al finalizar la sustentación de una entrega.
- **Marcar post destacado** en cualquier foro, con monto configurable de bono.

### 11.3 Licitaciones, foros y anuncios

- **Lanzamiento de licitaciones** con selector de caso y control de fases.
- **Vista de foros** con autor real revelado en todos los posts.
- **Vista de retroalimentación entre pares**: matrices por equipo, alertas de patrones sospechosos, factor de moderación aplicable.
- **Publicador de anuncios** (ver §11.3.1).

#### 11.3.1 Publicador de anuncios

Herramienta para publicar mensajes que aparecen en el Dashboard de los alumnos (§14.2, Fila 0).

**Editor:**

- Título (obligatorio, máx. 100 caracteres).
- Cuerpo en **markdown** con preview en vivo, soporta LaTeX inline y bloques (renderizado con KaTeX/MathJax).
- Adjuntos opcionales (imágenes o PDFs, hasta 3 archivos, 10 MB cada uno).

**Configuración de publicación:**

| Campo | Descripción |
|---|---|
| **Prioridad** | `normal` o `alta`. Alta aparece con acento visual. |
| **Anclado** | Si sí, se queda arriba del feed hasta que expire o lo desancles. |
| **Programar** | Publicar ahora, o programar fecha/hora (CDMX). |
| **Expiración** | Fecha opcional tras la cual el anuncio desaparece del Dashboard (queda en histórico). |
| **Alcance** | Todos los alumnos activos; equipos específicos; alumnos específicos. |
| **Enviar notificación** | Si se activa, dispara email a los alumnos del alcance que tengan activada la categoría "Aviso administrativo del profesor" (§12.5). |

**Después de publicar:**

- **Confirmaciones de lectura**: cada alumno puede marcar como visto. El admin ve porcentaje de lectura y lista detallada de quién no ha visto.
- **Edición con historial**: modificar el anuncio deja rastro en el log de auditoría; los alumnos ven etiqueta "editado" con timestamp.
- **Eliminación**: soft-delete; queda en histórico admin.
- **Repostear**: botón para volver a publicar (útil para recordatorios importantes).

**Usos previstos:**

- Recordatorios de entregas.
- Aviso de licitación próxima.
- Cambios de horario o de aula.
- Publicación de resultados de examen.
- Anuncios administrativos generales.
- Reglas especiales de una entrega o proyecto.

### 11.4 Banco de Tokens, privilegios y ciclo del semestre

- **Banco de Tokens**: vista global del saldo por alumno.
- **Consumo de tickets de privilegios**: marcar tickets como usados.
- **Configuración del catálogo de privilegios (Editor)**: interfaz gráfica para añadir nuevos privilegios, editar nombres, descripciones, costos en Tokens, límites (por tarea/semestre) y alternar su disponibilidad activa.
- **Feature flags** de privilegios sensibles (ej. `ai_in_exam_enabled`, ver §5.2). Alternan visibilidad para los alumnos.
- **Aprobación de canje de Tokens por décimas** durante el estado `canje_abierto` (§17.0). Esta pantalla se abre al resolver un ítem `canje_decima` desde el Inbox (§11.0).
- **Botón "Abrir canje por décimas"**: transición `en_curso → canje_abierto` (§17.0). Confirmación simple. Congela pozos de práctica y expone el canje a los alumnos.
- **Botón "Cerrar semestre"**: transición `canje_abierto → cerrado` (§17.0). Confirmación explícita porque bloquea toda acción de alumnos.

### 11.5 Calendario académico

- **Calendario editable**: el profesor marca días festivos, sin clase, o de excepción. Estos días son neutros para efectos de racha (§5.5).
- **Vista mensual y semestral** del calendario.

### 11.6 Reportes

- **Generador de reportes por alumno** (ver §17).
- **Log de auditoría**: todas las acciones admin quedan registradas de forma inmutable.

### 11.7 Danger zone (ver §17.2)

Zona de acciones destructivas o irreversibles, aislada del resto del panel con confirmación en dos pasos.

---

## 12. Arquitectura técnica

### 12.1 Stack

- **Frontend**: Next.js (React). UI **minimalista oscura**, acento rojo IBERO, tipografía profesional. Sin efectos neón, sin estética cyberpunk ni de videojuego. **MathLive** para captura visual de expresiones matemáticas. **react-notion-x** para importar y renderizar los bloques de Notion de forma nativa y estéticamente impecable en la web. **Chart.js** o **Recharts** para gráficas del Dashboard y reportes.
- **Backend**: FastAPI (Python 3.11+). WebSockets nativos para chat y licitaciones. **SymPy** + `antlr4-python3-runtime` para validación simbólica de ejercicios de práctica (§8.3). **APScheduler** para tareas programadas (§12.4). **Jinja2** + **WeasyPrint** o similar para renderizar reportes (§17).
- **Base de datos**: MySQL 8.
- **Almacenamiento de archivos**: filesystem del VPS en `uploads/`, rutas guardadas en MySQL.
- **Sincronización Notion**: cliente oficial de Notion API, ejecutado solo bajo demanda del admin.
- **Email**: SMTP institucional o servicio transaccional (Postmark/Resend), usado solo si el alumno activa notificaciones (§12.5).
- **Zona horaria del sistema**: `America/Mexico_City` para todos los cálculos temporales (rachas, timestamps, cron jobs).

### 12.2 Infraestructura

- **VPS Hostinger** único con Docker Compose y dos ambientes:
  - `staging` — cambios se prueban aquí primero.
  - `prod` — el que ven los alumnos.
- Reverse proxy con Traefik o Nginx, TLS vía Let's Encrypt.

### 12.3 Respaldos

- **Dump diario** de MySQL a directorio separado del VPS.
- **Rotación semanal**: se conservan 7 dumps diarios + 4 semanales.
- **Snapshot mensual** del directorio `uploads/`.
- Documentar el procedimiento de restauración en el repo.

### 12.4 Job scheduler (APScheduler)

Se integra **APScheduler** en el proceso de FastAPI. No requiere Redis ni Celery para esta escala.

Jobs definidos:

| Job | Cron | Descripción |
|---|---|---|
| `evaluate_streaks` | 00:05 CDMX diario | Evalúa el día anterior; aplica pases, rompe rachas, otorga hitos. |
| `publish_daily_challenge` | 07:00 CDMX Lun-Jue | Selecciona un ejercicio del pozo del módulo activo, lo asigna a cada alumno parametrizado. |
| `send_streak_reminder` | 20:00 CDMX Lun-Jue | Envía email a alumnos con notificaciones activas que no han completado el reto del día. |
| `close_feedback_cycle` | 23:59 CDMX del día de cierre configurado | Cierra el ciclo de retroalimentación. El día de cierre se define por ciclo desde el panel admin (default: 5 días después del cierre del módulo). |
| `detect_inactivity` | 06:00 CDMX lunes | Marca alumnos sin actividad ≥14 días y alerta al profesor. |
| `daily_backup` | 03:00 CDMX diario | Dump de MySQL y rotación. |

Todos los jobs corren con un **lock persistente en la base de datos (MySQL)**. Esto garantiza que, si la aplicación de FastAPI escala a múltiples réplicas (workers) para manejar más tráfico, los cron jobs no se ejecuten múltiples veces simultáneamente.

### 12.5 Notificaciones opcionales por correo

- **Correo institucional del alumno** (formato `@correo.uia.mx` u otro que uses).
- **Opt-in explícito**: por defecto están **desactivadas**. El alumno las habilita desde su perfil.
- **Configuración granular** (checkboxes en perfil):
  - Recordatorio de reto del día (20:00 lunes-jueves).
  - Aviso de módulo desbloqueado.
  - Aviso de ciclo de retroalimentación abierto.
  - Aviso de post destacado propio.
  - Aviso de kudos recibido (el correo **no revela al emisor**; solo comunica categoría y texto del kudos, preservando el anonimato definido en §4.2).
  - Aviso administrativo del profesor.
- Cada correo incluye link de "desactivar este tipo de notificación" (un click, sin login).
- No se guarda historial de emails enviados más allá de logs de auditoría de 30 días.

### 12.6 Esbozo del modelo de datos

Entidades principales y relaciones clave. No es el schema definitivo (se detalla en Fase 1) pero sirve como referencia para diseño de tareas.

**Núcleo de usuarios y equipos:**

- `User` — id, nombre, apellidos, numero_cuenta, nickname, pin_hash, correo_institucional, notificaciones_config (JSON), estado (`pending_profile`|`pending_approval`|`active`|`rejected`), perfil (`analista`|`modelador`|`integrador`), pronombres (`ella`|`el`|`elle`|`prefiero_no_decir`, default `prefiero_no_decir`), created_at.
- `Team` — id, nombre_firma, estado_nombre (`pendiente`|`aprobado`|`asignado_por_sistema`), created_at.
- `TeamMember` — user_id, team_id, joined_at, left_at (nullable).
- `TeamNameProposal` — team_id, propuesta, propuesto_por, votos, estado (`pendiente_mod`|`aprobado`|`rechazado`).

**Contenido y módulos:**

- `Module` — id, numero (1-4), nombre, unlocked_at (nullable), pozo_pts.
- `CourseSession` — id, module_id, numero_sesion, titulo, notion_page_id, apuntes_pdf_url (nullable), notion_last_sync.
- `PracticeExercise` — id, module_id, plantilla_latex, sympy_solucion, parametros_config (JSON), valor_pts, activo.
- `ExerciseAttempt` — id, user_id, exercise_id, respuesta_latex, resultado, pts_otorgados, timestamp.
- `Announcement` — id, titulo, cuerpo_md, prioridad, anclado, publicado_at, expira_at, alcance (JSON), autor_id, edit_history (JSON).
- `AnnouncementRead` — announcement_id, user_id, read_at.

**Foros:**

- `ForumPost` — id, session_id, user_id, cuerpo, es_anonimo_para_pares, destacado, parent_post_id (nullable), created_at. (Comentarios vinculados a la clase, estilo YouTube).

**Retroalimentación y kudos:**

- `FeedbackCycle` — id, module_id, opens_at, closes_at, estado.
- `PeerEvaluation` — cycle_id, evaluator_id, evaluated_id, rigor, aporte_tecnico, colaboracion, justificacion, created_at.
- `Kudos` — id, sender_id, receiver_id, categoria, texto, created_at.

**Tokens, tickets y calendarios:**

- `PointsLedger` — id, user_id, delta, fuente (enum: `practica`, `racha`, `hito_racha`, `licitacion`, `sustentacion_destacada`, `post_destacado`, `kudos_out`, `kudos_in`, `ajuste_admin`, `canje_privilegio`, `canje_decima`), referencia_id, nota, created_at, admin_id (nullable).
- `PrivilegeCatalog` — id, nombre, costo, limites_config (JSON), visible, feature_flag_key (nullable).
- `PrivilegeTicket` — id, user_id, catalog_id, folio, estado (`emitido`|`consumido`|`vencido`), emitido_at, consumido_at, consumido_por (admin_id).
- `SplitBillRequest` — id, catalog_id, team_id, solicitante_id, costo_total, estado (`pendiente`|`aprobado`|`rechazado`), created_at.
- `SplitBillContribution` — request_id, user_id, puntos_aportados, estado (`pendiente`|`confirmado`), confirmado_at (nullable).
- `DecimalRedemptionRequest` — id, user_id, entrega_id, decimas_solicitadas, pts_costo, estado, nota_profesor.
- `CalendarDay` — fecha, tipo (`clase`|`festivo`|`sin_clase`|`otro`), nota.

**Racha:**

- `StreakDay` — user_id, fecha, estado (`completado`|`fallido`|`neutro`|`pase_aplicado`|`sin_reto`), ejercicio_asignado_id.
- `StreakState` — user_id, dias_activos, pases_disponibles, hitos_alcanzados (JSON), updated_at.

**Licitaciones:**

- `Licitacion` — id, caso_id, iniciada_at, cerrada_at, estado, fase_actual.
- `LicitacionResponse` — licitacion_id, team_id, user_id, respuesta, correcta, orden_llegada, pts_asignados.

**Entregas y calificaciones:**

- `Assignment` — id, module_id, titulo, descripcion, peso_escrita, peso_sustentacion, fecha_limite.
- `Submission` — id, assignment_id, team_id, archivo_path, submitted_at, calif_escrita, calif_sustentacion, sustentador_id (sorteo).
- `EmpiricalVideo` — submission_id, archivo_path, duracion_s.

**Auditoría:**

- `AuditLog` — id, admin_id, accion, tabla_afectada, registro_id, payload_json, created_at.
- `Dispute` — id, user_id, tipo, descripcion, referencia, estado, respuesta_admin, respondido_at.

**Configuración global y estado del sistema:**

- `SystemFlag` — key (ej. `ai_in_exam_enabled`), value (bool/JSON), updated_at, updated_by (admin_id). Almacena feature flags y toggles administrativos.
- `SystemState` — key, value, updated_at. Estado global del semestre y del curso. Claves conocidas:
  - `semester_state` — valores válidos: `en_curso` | `canje_abierto` | `cerrado` | `archivado` (§17.0).
  - `active_module_id` — id del último módulo desbloqueado (§8.2).
  - `decimal_conversion_rate` — Tokens por décima (§5.4, default 50).
  - Otras claves de configuración dinámica del curso.

**Inbox de aprobaciones:**

- `InboxItem` — id, tipo (enum: `registro`, `nombre_firma`, `canje_decima`, `disputa`, `sancion`, `feedback_sospechoso`, `sustentacion_destacada_pendiente`, `post_destacado_pendiente`, `alerta_inactividad`, `alerta_sistema`), referencia_id (nullable, apunta a la fila de la tabla origen), payload_json (datos adicionales para render), prioridad (`alta`|`media`|`baja`), estado (`pendiente`|`atendido`|`pospuesto`|`descartado`|`visto`), snoozed_until (nullable), created_at, resuelto_at (nullable), resuelto_por (admin_id, nullable), nota_resolucion (nullable). Cada evento del sistema crea o actualiza un `InboxItem`; permite acciones como posponer, marcar visto, y llevar contadores históricos.

**Tutoriales y UI:**

- `UserTutorialSeen` — user_id, tutorial_key, version_seen, seen_at. Registra qué modales de tutorial ha completado cada alumno.

**Asistencia:**

- `AttendanceRecord` — id, user_id, fecha_clase, estado (`presente`|`retardo`|`ausente`|`justificado_por_ticket`), ticket_id (nullable, si se aplicó privilegio de retardo o pase de asistencia), nota.

Relaciones críticas:

- `User ↔ Team` muchos-a-muchos vía `TeamMember`.
- `PointsLedger` es **append-only** (nunca update, nunca delete); ajustes se hacen creando movimientos compensatorios.
- `AuditLog` es **append-only e inmutable**.
- `SystemFlag` y `SystemState` **sí son mutables** pero cada cambio genera un `AuditLog`.

---

## 13. Seguridad

- PIN hasheado con **bcrypt** (cost factor ≥ 12).
- Sesiones vía **JWT firmado** con rotación cada 24h; refresh token con expiración a 7 días.
- Validación estricta de tipo y tamaño de archivos subidos (PDF e imágenes, máx. 10 MB por archivo).
- Sanitización de contenido de foros y chats contra XSS.
- CSRF token en formularios de estado.
- Todas las acciones de admin quedan en log de auditoría inmutable.

### 13.1 Consolidado de rate limits

| Acción | Límite | Sección |
|---|---|---|
| Intentos de login | 3 por cuenta / 15 min | §2 |
| Publicación en foro | 5 por alumno / hora / foro | §9 |
| Envío de mensajes en chat de equipo | 30 por alumno / min | §12 |
| Envío de kudos | Auto-regulado por costo de 10 Tks | §4.2 |
| Validaciones de ejercicio (SymPy) | 30 por alumno / min | §8.3.3 |
| Peticiones a Notion API durante sync | 0.35s entre peticiones + retry con backoff | §8.1 |

---

## 14. Dashboard del alumno y experiencia de usuario

### 14.0 Lenguaje inclusivo

Política aplicada a **todo el UI**, correos automatizados y mensajes de error:

- **Formas neutrales por default**: "Te damos la bienvenida" (no "Bienvenido/a"), "estudiante", "integrantes del equipo", "quien inicia sesión". Evitar `@` y `x` en terminaciones (mala accesibilidad para lectores de pantalla).
- **Personalización con pronombres declarados**: el registro incluye el campo `pronombres` con opciones `ella | el | elle | prefiero_no_decir`. Cuando la persona los declaró, mensajes clave se ajustan: "Bienvenida Ana", "Bienvenido Carlos", "Bienvenide Sofía". Con `prefiero_no_decir` se mantiene el fraseo neutral.
- El helper `pickByPronoun(pronombres, ella, el, neutro)` en `frontend/lib/api.ts` centraliza la elección.
- Los cambios de pronombres desde el perfil se implementan en Iteración 4 (perfil del alumno) o antes si se requiere.



### 14.1 Sistema de tutoriales por modal

Cada feature nueva que el alumno visita por primera vez muestra un **modal de tutorial** con:

- Título y explicación breve (2-3 frases).
- Screenshot o animación corta (GIF) del feature en uso.
- Botón "Entendido" (cierra y marca como visto).
- Botón "No mostrar tutoriales" (los desactiva globalmente para ese alumno; reactivables desde el perfil).

Se registra por alumno qué tutoriales ya vio (`user_tutorials_seen`). Cuando el profesor actualiza un tutorial (versionado), se vuelve a mostrar al siguiente ingreso.

Tutoriales previstos: registro, test de perfil, Dashboard, catálogo de privilegios, reto del día, editor MathLive, foro, ciclo de retroalimentación, kudos, licitación, canje de Tokens, y **canje de Tokens por décimas** (se activa automáticamente al abrir la ventana al final del semestre).

### 14.2 Widgets del Dashboard

**Fila 0 — Anuncios (visible sin scroll):**

1. **Anuncios del profesor**: banner ancho al inicio del Dashboard, muestra hasta 3 anuncios activos ordenados por prioridad y recencia. Los anuncios anclados aparecen primero. Cada anuncio es una tarjeta con título, cuerpo (renderiza markdown y LaTeX), fecha y opción "Marcar como visto". Si hay más anuncios activos, aparece link "Ver todos".

**Fila 1 — Estado personal (hero):**

2. **Racha activa**: calendario mensual del mes en curso con palomitas verdes por día completado, escudos azules por días con pase, borde rojo tenue por fallidos, grises para neutros. Contador grande "X días de racha". Barra de progreso al siguiente hito.
3. **Saldo del banco**: número grande, sparkline pequeño de tendencia semanal, link "Ver movimientos".
3.5 **Asistencia**: widget mostrando % de asistencia en el semestre y contador de faltas acumuladas (en tiempo real según el pase de lista del admin).
4. **Reto del día**: solo visible lunes-jueves si no lo ha completado; botón grande "Empezar reto (10-15 min)". Si ya completó, muestra "✓ Reto del día listo".

**Fila 2 — Curso y trabajo:**

5. **Módulo activo**: título del módulo, barra de progreso del pozo de Tokens (Tks ganados / Tks disponibles), links al índice de Clases de ese módulo y a los ejercicios de práctica. Al entrar a una Clase, se abre la "Vista de Clase" (Notion + PDF + Comentarios).
6. **Próximas entregas**: lista de 3-5 con countdown ("faltan 2 días", "vence hoy"), color por urgencia.
7. **Mi equipo**: nombre de firma, mini-cards de integrantes (nickname + perfil), botón para abrir chat, contador "N kudos esta semana".

**Fila 3 — Comunidad y acciones:**

8. **Retroalimentación pendiente**: aparece solo cuando hay ciclo activo con evaluaciones sin completar; contador y botón "Completar ahora".
9. **Actividad reciente**: feed cronológico (kudos recibidos, posts destacados, hitos, aprobación de canje de privilegio, etc.).

Cada widget es colapsable. El orden es fijo en la propuesta inicial; se puede permitir reordenamiento drag-and-drop en una iteración posterior.

### 14.3 Accesibilidad y calidad

- Contraste mínimo **WCAG AA** en todos los componentes.
- Navegación completa por teclado.
- `aria-label` en controles interactivos.
- Soporte de screen reader en flujos críticos (login, entrega, canje de privilegios).
- Prueba manual de todos los flujos en Chrome, Firefox y Safari (última versión).
- Prueba de responsive: móvil (para licitaciones y racha diaria), tablet, laptop.

---

## 15. Fases de implementación

Cada fase incluye pruebas antes de pasar a la siguiente.

### Fase 0 — Kickoff y preparación de contenido (semana 0, previa al desarrollo)

Trabajo del profesor (no requiere código):

- Estructurar el contenido de los 4 módulos en Notion con la misma jerarquía prevista para la sincronización.
- Redactar borradores de **40-50 ejercicios de práctica** para módulos 1 y 2 (mínimo para lanzar Fase 3 con contenido real). El resto se puede ir agregando durante el semestre.
- Redactar **3-5 casos** para licitaciones iniciales.
- Redactar las **8-10 preguntas del test de perfil** con sus 3 opciones cada una.
- Redactar borrador de la página de reglas y políticas (§18) para revisión legal antes de la Fase 8.
- Solicitar formalmente a coordinación académica la autorización del privilegio de IA en parcial.
- Cargar en un repositorio compartido: logos, avisos institucionales, aviso de privacidad IBERO.

### Fase 1 — Fundación (semana 1-2)
- Setup de repos (frontend y backend).
- Docker Compose para staging y prod.
- Modelo de datos completo en MySQL con migraciones.
- Autenticación (registro con **Inbox de Aprobaciones**, login, reset admin).
- Panel admin mínimo (Inbox de Aprobaciones §11.0 con categoría "registros", listar alumnos).

### Fase 2 — Perfiles y equipos (semana 3)
- Cuestionario de perfil con bibliografía.
- Generador de equipos balanceado.
- Chat de equipo vía WebSocket.

### Fase 3 — Contenido y práctica (semana 4-5)
- Integración con Notion API.
- Sincronización manual con vista de diff.
- Desbloqueo de módulos.
- Foros por módulo con opción anónimo/nickname y marcado de post destacado.
- **Editor matemático visual con MathLive** (frontend) para captura de respuestas sin dependencia de sintaxis.
- Motor de ejercicios de práctica parametrizados con validación **SymPy** (parseo desde LaTeX, equivalencia simbólica, verificación por sustitución para EDOs, sandboxing y timeout).
- Editor de plantillas de ejercicio en admin.
- Pozo de Tokens por módulo (default 40 Tks; módulo 1: 50 Tks).

### Fase 4 — Retroalimentación y banco unificado (semana 6)
- Ciclos de retroalimentación entre pares (**sin auto-otorgamiento de Tokens**).
- Sistema de kudos con costo de envío.
- Banco unificado de Tokens con vista de saldo y catálogo de privilegios.
- Ajustes discrecionales del profesor con nota justificativa.
- Flujo de canje con tickets.
- **Motor de rachas diarias estilo Duolingo**: publicación automática del reto de lunes a jueves, cálculo nocturno, aplicación automática de pases de racha, otorgamiento de bonos por hitos.
- Alertas anti-abuso.

### Fase 5 — Licitaciones (semana 7)
- Motor de licitaciones síncronas con WebSockets.
- Interfaz de proyección para el aula.
- Integración con el banco de Tokens (Tokens ganados en licitación → banco).
- Modo de contingencia offline.
- Prueba de red en aula.

### Fase 6 — Entregas y calificaciones (semana 8)
- Subida de archivos con evidencia de datos empíricos.
- Gestor de calificaciones estilo hoja de cálculo.
- Exportación CSV.

### Fase 7 — UX y reportes (semana 9)
- Widgets del Dashboard con visualización de racha (calendario mensual con palomitas verdes).
- Sistema de modales de tutorial versionados.
- Sistema de notificaciones opcionales por correo con panel de preferencias.
- Calendario editable de días festivos en admin.
- Generador de reportes por alumno (HTML + gráficas + entregas + calificaciones).

### Fase 8 — Pulido, políticas y cierre (semana 10)
- Página de reglas y políticas (§18).
- Danger zone en admin (§17.2) con confirmación en dos pasos.
- **Flujo de cierre de semestre** con estados `en_curso → canje_abierto → cerrado → archivado` (§17.0), incluyendo bloqueos automáticos y detención de cron jobs de racha.
- Generador de reportes por alumno.
- Accesibilidad completa (WCAG AA).
- Log de auditoría.
- Documentación de operación.
- Procedimiento de restauración probado end-to-end.

---

## 16. Casos borde operativos

### 16.1 Alta tardía de alumno

- El alumno se registra después de iniciado el semestre y completa flujo normal.
- El profesor asigna manualmente Tokens compensatorios desde el panel para nivelar oportunidades perdidas (hitos de racha pasados, pozo de módulos anteriores, etc.).
- Se registra en el log de auditoría con nota justificativa.

### 16.2 Ausencia por enfermedad u otra situación personal

- Gestionada manualmente por el profesor caso por caso desde el panel.
- Herramientas disponibles: aplicar pase de racha automático, restaurar racha previa, ajuste discrecional de Tokens, extender fechas de entrega individual.
- No hay flujo automático ni justificantes cargados por el alumno; toda la validación es fuera de la plataforma.

### 16.3 Alumno inactivo

- Se define **inactivo** como: sin login **y** sin entregas **y** sin retos completados durante **≥14 días**.
- El job `detect_inactivity` (§12.4) corre los lunes y encola una **alerta de sistema en el Inbox de Aprobaciones** (§11.0) con la lista de alumnos detectados.
- El profesor decide acción (contactar al alumno, aplicar consolidación de equipo si aplica, etc.).

### 16.4 Ausencia del profesor

- Si un día lunes-jueves no se publica reto por motivo del profesor, la racha **no se rompe** para nadie.
- El sistema detecta que no hubo publicación de reto y marca ese día como neutro automáticamente.
- No requiere acción del alumno ni del profesor.

### 16.5 Día festivo o sin clase

- El profesor marca el día desde el calendario editable en admin (§11.5) **antes** de que llegue esa fecha.
- Los días marcados son neutros para efectos de racha.
- Si se marca retroactivamente, el sistema recalcula rachas del día en cuestión.

---

## 17. Reportes y cierre de semestre

### 17.0 Estados del semestre y flujo de cierre

El sistema mantiene un estado global `semester_state` (§12.6, `SystemState`) con las siguientes transiciones. **Todas las transiciones son manuales** y las dispara el profesor desde el panel admin.

```
en_curso → canje_abierto → cerrado → archivado → (reset limpio) → en_curso (nuevo semestre)
```

**Estado `en_curso`** (default):

- Operación normal de la plataforma. Todas las mecánicas activas.

**Transición `en_curso → canje_abierto`** (botón "Abrir canje por décimas" en admin §11.4):

- Efectos automáticos:
  - Los **ejercicios de práctica dejan de otorgar Tokens** (siguen practicables, pero el pozo de cada módulo queda congelado).
  - Aparece en el Dashboard de los alumnos la interfaz de canje por décimas (§5.4) con el tutorial correspondiente (§14.1).
- **No se bloquean**: racha diaria, licitaciones, kudos, foros, chat, entregas pendientes ni sustentaciones. Estas actividades pueden continuar generando Tokens hasta el cierre manual.
- El profesor comienza a recibir solicitudes de canje en su **Inbox de Aprobaciones** (§11.0) como items de tipo `canje_decima`.

**Estado `canje_abierto`**:

- No tiene fecha de expiración. Dura **hasta que el profesor cierre manualmente** el semestre.
- El profesor procesa solicitudes de canje a discreción durante este periodo.

**Transición `canje_abierto → cerrado`** (botón "Cerrar semestre" en admin §11.4):

- Efectos automáticos:
  - **Bloqueo total del acceso de alumnos al Dashboard**: al iniciar sesión, los alumnos ven **únicamente una pantalla estática** con el mensaje: *"Semestre cerrado. Envía un correo al profesor si quieres acceso a algún material o contenido."* No pueden ver widgets, historial, foros, chat, banco de Tokens, licitaciones, retroalimentación, ni ninguna otra vista. Solo el botón de cerrar sesión.
  - Se rechazan automáticamente las solicitudes de canje pendientes sin aprobación (con nota "cerrado sin resolver"; el profesor puede revertir individualmente si es error).
  - Se detienen los cron jobs de racha (`evaluate_streaks`, `publish_daily_challenge`, `send_streak_reminder`).
  - Se cierran todos los foros: los hilos se conservan en la BD para generación de reportes y archivo, pero no son accesibles a los alumnos.
- El profesor puede seguir usando el panel completo: generar reportes finales, hacer ajustes discrecionales de último momento (con nota), revisar retroalimentación.

**Estado `cerrado`**:

- El semestre está cerrado académicamente. Solo el profesor tiene acciones disponibles.
- Los alumnos ven **solo la pantalla de "Semestre cerrado"** descrita arriba.
- Los **reportes por alumno son generados únicamente por el profesor** (§17.1); los alumnos no pueden descargar el suyo. Para acceso a información concreta, deben solicitarla por correo.

**Transición `cerrado → archivado`** (acción "Archivar semestre" en Danger zone §17.2):

- Snapshot completo del estado se guarda en tarball; BD activa queda intacta pero marcada como archivada.

**Transición `archivado → en_curso` (nuevo semestre)** (acción "Reset limpio para nuevo semestre" en Danger zone §17.2):

- Se ejecuta el reset descrito en §17.2. El estado vuelve a `en_curso`.

### 17.1 Generador de reportes por alumno (disponible en cualquier momento)

**Solo el profesor puede generar reportes** desde el panel admin. Los alumnos no tienen esta capacidad en ningún estado del semestre; si desean conocer su progreso, se lo solicitan al profesor por correo o él lo comparte de forma explícita.

El profesor puede generar:

- **Reporte individual** de un alumno específico.
- **Reporte por equipo** (todos los integrantes de una firma).
- **Reporte por lote** (todo el grupo).

Se puede generar **en cualquier momento del semestre**. Es útil si la coordinación académica solicita un "corte de caja" a mitad de curso, si un alumno reporta un problema y necesitas contexto, o si tras el cierre del semestre necesitas archivar el desempeño de todos.

**Contenido del reporte (HTML con gráficas):**

- Datos básicos: nombre, número de cuenta, nickname, equipo, perfil asignado.
- Calificaciones por entrega con desglose escrita/sustentación (70/30 o el que aplique).
- **Gráfica de línea**: evolución del promedio a lo largo del semestre.
- **Gráfica de barras**: Tokens ganados y gastados por fuente (práctica, racha diaria, hitos de racha, licitaciones, kudos recibidos, kudos enviados, sustentación destacada, posts destacados, ajustes discrecionales, canje de privilegios, canje por décimas). Cubre todo el enum de `PointsLedger` (§12.6).
- **Calendario anual** de rachas con palomitas verdes.
- **Histograma**: distribución de kudos recibidos por categoría (`#rigor`, `#creatividad`, `#claridad`, `#apoyo`).
- Tabla de privilegios canjeados con folio, fecha, tipo y contexto.
- Retroalimentación entre pares recibida (dimensiones + justificaciones). **Los autores se anonimizan por default** para respetar el pacto de anonimato del ciclo (§4.1). El profesor tiene una opción explícita de "revelar autores" que genera una versión alterna solo para archivo interno del profesor (no compartible con el alumno ni exportable).
- Décimas canjeadas por Tokens sobrantes (si aplica).

**Anexos:**

- **PDFs e imágenes** que el alumno subió durante el semestre, empaquetados en un `.zip` junto al HTML.
- Log de posts destacados del alumno.
- Historial de ajustes discrecionales con notas del profesor.

**Formato de salida:**

- HTML autocontenido (CSS y assets inline) para archivo y navegación offline.
- Botón dentro del HTML para imprimir a PDF.
- Descarga como `.zip` con estructura: `reporte.html`, `entregas/`, `evidencia/`.

### 17.2 Danger zone del panel admin

Sección aislada del panel, con **fondo rojo tenue** y ventana de confirmación en dos pasos (escribir literalmente `CONFIRMO` para habilitar el botón). Acciones:

- **Archivar semestre**: exporta todo el estado (BD + `uploads/`) a un tarball con timestamp y lo guarda fuera de la BD activa.
- **Reset limpio para nuevo semestre**: purga alumnos, equipos, tickets, Tokens, rachas, retroalimentaciones, chats, foros, anuncios pasados, disputas cerradas. **Conserva** ejercicios de práctica, plantillas de casos para licitaciones, configuración del catálogo, feature flags, plantillas de anuncios y **calendario base** (definido como: patrones recurrentes marcados por el profesor como plantilla — por ejemplo, "el 1 de noviembre siempre es festivo" — pero **no** las marcas específicas del semestre pasado, que se archivan con el snapshot).
- **Purga selectiva de archivos huérfanos** en `uploads/` (referencias inexistentes en BD).
- **Regenerar índices** de MySQL.
- **Exportar snapshot completo de la BD** (dump SQL para respaldo manual).

Todas las acciones de la Danger zone se registran en un log de auditoría separado, requieren PIN admin nuevamente (aunque ya haya sesión activa) y notifican por email al profesor con el detalle del cambio.

---

## 18. Página de reglas y políticas

Página pública accesible desde el pie de página de la plataforma y **obligatoria de leer** antes de aprobar el registro (checkbox "He leído y acepto" en el formulario). Contenido:

### 18.1 Aviso de privacidad breve

- Datos que se recolectan: nombre, apellidos, número de cuenta, nickname, PIN hasheado, correo institucional (si activa notificaciones).
- Finalidad: administración del curso.
- Retención: hasta 60 días después del cierre administrativo del semestre.
- Terceros: solo Notion (contenido del temario) y proveedor de correo (si activa notificaciones).
- Derechos: acceso, rectificación, cancelación mediante solicitud al profesor.

### 18.2 Reglas del curso en la plataforma

- Cómo funcionan los Tokens, los privilegios y los tickets.
- Reglas del catálogo (topes, restricciones globales del examen final y proyecto final).
- Reglas del foro (código de conducta, moderación).
- Reglas del sistema de kudos y retroalimentación entre pares.
- Reglas de la racha diaria (lunes-jueves, festivos, pases).

### 18.3 Política de disputas

- Los alumnos pueden abrir una disputa por: privilegio no consumido correctamente, ajuste discrecional considerado injusto, calificación de ejercicio de práctica, evaluación de retroalimentación.
- Canal: formulario en su perfil ("Levantar una disputa"), que llega al **Inbox de Aprobaciones** (§11.0) como ítem de tipo `disputa`.
- Plazo de respuesta del profesor: 5 días hábiles.
- Escalamiento: si el alumno considera que la respuesta no es satisfactoria, puede acudir a la coordinación académica del programa (fuera de la plataforma).

### 18.4 Uso aceptable y procedimiento sancionatorio

**Prohibiciones:**

- Compartir cuentas, PINs o respuestas.
- Intentar explotar bugs para obtener Tokens, tickets o privilegios.
- Usar la plataforma para acoso, discriminación o lenguaje ofensivo.
- Suplantar identidad de otro alumno en cualquier flujo (kudos, retroalimentación, foro, chat).

**Procedimiento sancionatorio:**

El proceso completo vive como ítem tipo `sancion` en el **Inbox de Aprobaciones** (§11.0). El ítem transita por sub-estados visibles al profesor: `esperando_respuesta_alumno` → `audiencia_vencida` → `esperando_decision_profesor` → `resuelto`.

1. El profesor identifica el presunto abuso (alerta automática del Inbox, reporte de un tercero, disputa, o revisión propia). Se crea el ítem `sancion` en el Inbox con sub-estado `esperando_respuesta_alumno`.
2. Se notifica al alumno por correo institucional con **descripción del hallazgo y evidencia**.
3. El alumno tiene **48 horas hábiles** para responder por escrito antes de que se aplique cualquier sanción (derecho de audiencia). Al vencer el plazo sin respuesta, el sistema transita el ítem a `audiencia_vencida`.
4. El profesor decide la sanción proporcional a la gravedad (el ítem pasa a `esperando_decision_profesor`):

| Nivel | Ejemplo | Sanción |
|---|---|---|
| Leve | Kudos con lenguaje inapropiado, primer intento de compartir respuesta | Advertencia formal + reversión del acto específico. |
| Medio | Reincidencia leve, explotación de bug menor | Pérdida de 20-50% de Tokens del banco + suspensión de kudos por 2 semanas. |
| Grave | Suplantación, acoso, colusión organizada en retroalimentación | Pérdida total de Tokens + escalamiento a coordinación académica. |

5. Toda sanción queda registrada en el log de auditoría con la evidencia adjunta.
6. El alumno puede apelar ante la coordinación académica del programa dentro de los 5 días hábiles siguientes.

---

## 19. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Red del aula inestable en licitaciones | Prueba previa; modo offline degradado (respuestas por papel + captura posterior). |
| Colusión en retroalimentación de pares | Detección de patrones + justificación obligatoria + factor de moderación admin. |
| Abuso del sistema de privilegios en evaluaciones importantes | Blacklist explícita (examen final, proyecto final). |
| Alumnos ingeniándoselas para usar IA a pesar de sustentación | Sustentación aleatoria + datos empíricos con video. |
| Notion cambia estructura y rompe sync | Sync manual con diff visible antes de aplicar; rollback a versión previa. |
| Pérdida de datos por falla del VPS | Backups diarios rotados + snapshot mensual del filesystem. |
| Reset accidental por parte del profesor | Danger zone con confirmación en dos pasos, PIN, log separado y notificación por email. |
| Alumnos no reciben recordatorios y pierden racha | Notificaciones opcionales por correo con recordatorio a las 20:00 lunes-jueves. |
| Privilegio de IA autorizado prematuramente | Feature flag `ai_in_exam_enabled` desactivado por defecto hasta autorización de coordinación. |
| MathLive/SymPy rechaza notaciones válidas (falsos negativos) | Suite de pruebas de regresión con 100+ expresiones típicas de EDOs antes de Fase 3 QA; canal "reportar problema con validador" en el editor. |
| Sobrecarga operativa del profesor (muchas acciones manuales) | Sección "Acciones pendientes" en el Dashboard admin con priorización; agrupación por tipo (aprobaciones, sustentaciones, disputas); notificaciones diarias por email al profesor con conteo pendiente. |
| Coordinación IBERO no autoriza el privilegio de IA | El flag oculta el privilegio sin generar deuda; el plan funciona sin él. |
| Videos empíricos saturan el disco del VPS | Límite de 100 MB y 2 min por video; monitoreo del uso de `uploads/`; alerta al llegar a 80% de la partición. |
