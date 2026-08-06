# Roadmap Agile (Prioridad MVP)

**Contexto temporal:** el semestre inicia el **10 de agosto de 2026** (lunes). El objetivo es tener un Producto Mínimo Viable (MVP) operativo para la **Semana 2 del semestre (17–21 de agosto)**, centrado en el sistema de puntos, equipos, privilegios y canales básicos de comunicación. Las funciones de automatización o conveniencia se irán agregando progresivamente con el curso ya iniciado.

**Convención sobre "Semana N":** se refiere a la semana N del semestre, no del proyecto.

**Nota sobre `Split Bill`:** mecanismo para que privilegios de beneficio grupal (ej. extensión de entrega para todo el equipo) puedan cubrirse con **aportaciones voluntarias por integrante**. Cada quien decide cuánto pone del propio banco; cuando la suma alcanza el costo, se emite un ticket grupal.

---

## 🏁 MVP — Lanzamiento Semana 2 del semestre (17–21 ago) — Esencial

*El núcleo de la economía, comunicación y gestión básica. El curso puede operar aunque muchas mecánicas sean manuales al inicio.*

- [ ] **Fundación y Auth:**
  - [x] Configurar repositorios, Docker Compose (FastAPI + Next.js + MySQL).
  - [ ] Esquema de base de datos base (Usuarios, Equipos, Puntos, Tickets, `InboxItem`, `Announcement`, `SystemFlag`, `SystemState`).
  - [ ] Registro con checkbox "He leído y acepto reglas y aviso de privacidad".
  - [ ] Login JWT, y recuperación manual de PIN.
- [ ] **Reglas y política (bloqueante para registro):**
  - [ ] Página pública de reglas y políticas (§18).
  - [ ] Aviso de privacidad breve (§18.1).
  - [ ] Política de disputas y uso aceptable (§18.3, §18.4).
- [ ] **Economía y Privilegios (El Núcleo):**
  - [ ] Dashboard del Alumno: vista de saldo actual e historial de movimientos ("Ver movimientos", §5.3).
  - [ ] Catálogo de Privilegios: flujo de compra y generación de tickets con folio único.
  - [ ] **Split Bill**: aportaciones voluntarias entre integrantes de un equipo para privilegios grupales; ticket grupal se emite al alcanzar el costo.
- [ ] **Comunicación del profesor:**
  - [ ] Publicador de anuncios (§11.3.1) — solo funciones esenciales: título, cuerpo markdown, prioridad, anclado, alcance (todos/equipo/alumno).
  - [ ] Widget "Anuncios del profesor" en Fila 0 del Dashboard (§14.2).
- [ ] **Panel de Administración Base:**
  - [ ] **Inbox de Aprobaciones** (§11.0) con **2 categorías iniciales**: `registro` y `nombre_firma`. Se irán agregando más en iteraciones siguientes.
  - [ ] Gestor manual de puntos (para otorgar puntos por participación o licitaciones offline temporalmente, con nota justificativa).
  - [ ] Creador algorítmico de Equipos y aprobación de Nombres de Firma.
  - [ ] Editor del catálogo de privilegios (costos, límites, visibilidad, feature flags).

---

## 🚀 Iteración 1 — Práctica, Contenido y Racha (Semanas 3–4)

*Automatización de puntos individuales + canales de contenido + recordatorios.*

- [ ] Integración de Notion API (o embeber el contenido temporalmente).
  - [ ] Pipeline: Notion API → BD local → renderizado con `react-notion-x`.
  - [ ] Botón manual de sincronización con vista de diff.
- [ ] **Motor SymPy + MathLive**:
  - [ ] UI del profesor para crear problemas parametrizados.
  - [ ] Pre-procesamiento de derivadas ($dy/dx$) y normalización de constantes libres ($C_1$, $K$…).
  - [ ] Validación simbólica de ejercicios (equivalencia + sustitución para EDOs).
- [ ] **Motor de Racha Diaria** (APScheduler):
  - [ ] Jobs `publish_daily_challenge`, `evaluate_streaks`, `detect_inactivity`.
  - [ ] Widget de racha con calendario mensual y palomitas verdes.
  - [ ] Pases de racha automáticos + compra en catálogo.
- [ ] **Foros por módulo** *(subido desde Iteración 2 original)*:
  - [ ] Opción por post: nickname o anónimo para pares.
  - [ ] Editor con soporte de LaTeX inline.
  - [ ] Marcado de post destacado por el profesor.
- [ ] **Calendario académico editable** en admin (§11.5) — necesario para marcar festivos antes de que la racha llegue.
- [ ] **Notificaciones opcionales por correo** *(subido desde Iteración 4 original)*:
  - [ ] Opt-in explícito en el perfil.
  - [ ] Recordatorio del reto del día (20:00 Lun-Jue).
  - [ ] Aviso de módulo desbloqueado, kudos recibido, aviso administrativo.

---

## ⚔️ Iteración 2 — Licitaciones y Retroalimentación (Semanas 5–6)

*Interacción síncrona en el aula + cierre del primer ciclo de retroalimentación.*

- [ ] **Motor de Licitaciones:**
  - [ ] Conexiones WebSockets manejadas en RAM.
  - [ ] Interfaz de proyección del profesor.
  - [ ] Captura de envíos grupales únicos y asignación de podio (35-40 / 22-25 / 15-18 / 10 / 5 / 0).
  - [ ] Solo integrantes presentes reciben puntos.
- [ ] Sistema de **Kudos** entre compañeros (10 pts del emisor, transferencia neta cero).
- [ ] **Ciclos de Retroalimentación entre pares** *(subido desde Iteración 3 original)*:
  - [ ] Ciclo abierto al cierre del módulo 1 (aprox. semana 4-5).
  - [ ] Formulario con 3 dimensiones + justificación obligatoria.
  - [ ] Detector anti-abuso enruta alertas al Inbox (`feedback_sospechoso`).
- [ ] Ampliación del Inbox: agregar categorías `canje_decima`, `feedback_sospechoso`, `alerta_inactividad`.

---

## 📊 Iteración 3 — Entregas y Calificaciones (Semanas 7–8)

*Gestión formal del curso y del proyecto final.*

- [ ] Sistema de entregas y subida de videos (datos empíricos del proyecto final).
- [ ] Sorteo aleatorio de sustentador para entregas grupales.
- [ ] **Sustentación destacada** (asignación desde admin) y **posts destacados** con bono de puntos.
- [ ] Gestor de calificaciones tipo Excel en el Admin, con reparto configurable 70/30 por-tarea.
- [ ] Registro de asistencia y aplicación de privilegios de retardo/pase.
- [ ] Ampliación del Inbox: agregar categorías `disputa`, `sancion`, `sustentacion_destacada_pendiente`, `post_destacado_pendiente`.

---

## 🪄 Iteración 4 — Cierre de semestre (Semanas 9+)

*Reportes y flujo de cierre.*

- [ ] **Generador de Reportes** por alumno / equipo / lote (WeasyPrint + gráficas).
  - [ ] Solo el profesor los genera; los alumnos no tienen acceso.
- [ ] **Flujo de cierre de semestre** con estados `en_curso → canje_abierto → cerrado → archivado` (§17.0).
  - [ ] Botones "Abrir canje por décimas" y "Cerrar semestre" en admin.
  - [ ] Pantalla estática de "Semestre cerrado" para alumnos tras la transición.
- [ ] **Danger Zone**: archivar semestre, reset limpio para nuevo ciclo, purga selectiva, exportar snapshot.
- [ ] Página de perfil del alumno con desactivación de notificaciones y visualización de tutoriales.

---

## 🧵 Cross-cutting (aplican a lo largo de todas las iteraciones)

*Elementos que no viven en una fase única.*

- [ ] **Modales de tutorial**: se agregan junto con cada feature nueva (no bloque final). Cada feature liberada en cualquier iteración incluye su modal correspondiente.
- [ ] **Log de auditoría**: cada acción admin genera un `AuditLog` desde el MVP. Ampliar el visor conforme aparezcan más acciones.
- [ ] **Accesibilidad WCAG AA**: revisar contraste y navegación por teclado al cerrar cada iteración, no dejarlo para el final.
- [ ] **Backups diarios de MySQL**: activar desde el momento en que haya datos reales (final del MVP).

---

## ⚠️ Riesgos de calendario

- **Semana 1 del semestre (10–14 ago)**: la plataforma no está lista. El profesor arranca en clase con contexto y expectativa; los alumnos se registran en la Semana 2 tras publicarse la URL.
- **Comunicación offline durante Semana 1**: aviso en clase de que la plataforma llega la próxima semana, entrega de reglas y aviso de privacidad en PDF por si acaso.
- **Racha llega en Semana 3–4**: los hitos altos (24 días, 48 días) se calibran a partir de ahí. El techo aspiracional se reduce respecto al plan v2 original — considerar ajustarlo o darlo por asumido.
- **Retroalimentación del módulo 1**: si el módulo 1 cierra en Semana 4-5, el ciclo de retroalimentación arranca junto con Iteración 2. Ajustar la fecha de cierre del ciclo si es necesario.
