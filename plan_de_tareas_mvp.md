# Roadmap Agile (Prioridad MVP)

**Contexto temporal:** el semestre inicia el **10 de agosto de 2026** (lunes). El objetivo es tener un Producto Mínimo Viable (MVP) operativo para la **Semana 2 del semestre (17–21 de agosto)**, centrado en el sistema de Tokens, equipos, privilegios y canales básicos de comunicación. Las funciones de automatización o conveniencia se irán agregando progresivamente con el curso ya iniciado.

**Convención sobre "Semana N":** se refiere a la semana N del semestre, no del proyecto.

**Nota sobre `Split Bill`:** mecanismo para que privilegios de beneficio grupal (ej. extensión de entrega para todo el equipo) puedan cubrirse con **aportaciones voluntarias por integrante**. Cada quien decide cuánto pone del propio banco; cuando la suma alcanza el costo, se emite un ticket grupal.

---

## 🏁 MVP — Lanzamiento Semana 2 del semestre (17–21 ago) — Esencial

*El núcleo de la economía (Tokens), comunicación y gestión básica. El backend se desarrolla **por dominios**; cada dominio queda como un commit revisable en git antes de pasar al siguiente. El curso puede operar aunque muchas mecánicas sean manuales al inicio.*

### 🧱 Fundación

- [x] Configurar repositorios, Docker Compose (FastAPI + Next.js + MySQL).

### 📜 Reglas y política *(bloqueante para el registro)*

- [x] Página pública de reglas y políticas (§18).
- [x] Aviso de privacidad breve (§18.1).
- [x] Política de disputas y uso aceptable (§18.3, §18.4).

### 👤 Dominio 1 — Users + Auth

- [x] Modelo `User` con estados `pending_profile → pending_approval → active → rejected` (§2).
- [x] Campo `pronombres` (`ella | el | elle | prefiero_no_decir`, default neutral) para personalizar mensajes.
- [x] Migración inicial Alembic (base declarativa + `User`) + migración para `pronombres`.
- [x] `POST /auth/register` — autorregistro con checkbox de aceptación de reglas.
- [x] `POST /auth/login` — JWT firmado, hash bcrypt del PIN.
- [x] `GET /auth/me` — perfil del usuario autenticado.
- [x] `POST /admin/users/{id}/reset-pin` — recuperación manual de PIN por admin.
- [x] `POST /admin/users/{id}/approve|reject` — cola provisional hasta Dominio 4 Inbox.
- [x] `GET /admin/users/pending` — listar pendientes (provisional).
- [x] Rate limiting de login (3 intentos / 15 min, §13.1).
- [x] Frontend: formularios de registro y login + página de reglas + `/inicio` post-login con `/auth/me`.
- [x] Frontend: componente `Field` compartido con toggle de visibilidad del PIN.
- [x] Frontend: fraseo neutro por default + saludo personalizado por pronombres (`pickByPronoun`).
- [ ] *(diferido a Iteración 1)* Test de perfil accesible inmediatamente tras el registro; el flujo pasará a `pending_profile → (test) → pending_approval → active`. Ver Iteración 1.

### 👥 Dominio 2 — Teams y nombres de firma

- [x] Modelos `Team`, `TeamMember`, `TeamNameProposal` (§12.6).
- [x] Migración Alembic.
- [x] `POST /admin/teams/generate` — generación algorítmica con tamaños 3/4 y balance por perfil cuando exista (hoy aleatorio con hook Belbin listo).
- [x] `POST /teams/{id}/propose-name` — propuesta con validación de charset (letras+acentos+dígitos+espacios+guiones, 3-40 chars).
- [x] `POST /admin/team-name-proposals/{id}/[approve|reject]` + `POST /admin/teams/{id}/assign-default-name` (fallback "Firma A/B/…").
- [x] Endpoints alumno: `GET /me/team`, `GET /teams/{id}/name-proposals`.
- [x] Frontend admin: `/admin/equipos` (generador + moderación + eliminación).
- [x] Frontend alumno: `/mi-equipo` (ver integrantes + proponer nombre).
- [x] `useAuth()` hook compartido con `requireAdmin` para proteger rutas admin.
- [ ] *(Iteración 1)* Auto-asignación de nombre por sistema al día 7 sin propuesta aprobada — requiere APScheduler.

### 💰 Dominio 3 — Tokens, tickets y catálogo de privilegios

- [x] Modelos `TokenLedger` (append-only), `PrivilegeCatalog`, `PrivilegeTicket`, `SplitBillContribution`, `DecimalRedemptionRequest` + enums (`TokenSource`, `TicketStatus`, `DecimalRequestStatus`).
- [x] Migración Alembic (`98d19bcd4ae5`).
- [x] `GET /me/tokens` — saldo actual + últimos 10 movimientos.
- [x] `GET /me/tokens/movements` — historial paginado con filtro por fuente.
- [x] `GET /privileges` — catálogo visible al alumno (respeta feature flags: hidden hasta Dominio 4).
- [x] `POST /privileges/{id}/purchase` — compra individual, ticket con folio único, estado `emitted`.
- [x] `POST /privileges/{id}/split-bill/init` — inicia ticket grupal con aportación del iniciador.
- [x] `POST /tickets/{id}/contribute` — otras personas del equipo aportan; transición automática a `emitted` al cubrir el costo.
- [x] `POST /tickets/{id}/cancel` — solo iniciador (o admin) mientras esté `funding`; reembolso automático a contribuidores.
- [x] `GET /me/tickets` y `GET /tickets/{id}` con control de acceso.
- [x] `POST /admin/tickets/{folio}/consume` — profesor marca ticket como usado.
- [x] `POST /admin/tokens/adjust` — gestor manual de Tokens con nota justificativa (obligatoria).
- [x] `CRUD /admin/privileges` + `POST /admin/privileges/seed-defaults` (siembra los ~22 privilegios de §5.2).
- [x] Décimas: `POST /me/decimal-redemption` (deducción inmediata) y `/admin/decimal-redemption/{id}/[approve|reject]` con reembolso en rechazo.
- [x] Validación de topes `por_semestre` en `limites_config`; `por_tarea`/`por_examen` diferidos a Iteración 3.

**Frontend Dominio 3 (dividido por funcionalidad para pruebas incrementales):**

- [x] **3.1 · Alumno: Saldo del banco y movimientos**
  - Widget "Saldo del banco" en `/inicio` (con saldo + últimos 3 movimientos + link).
  - Página `/movimientos` con historial paginado y filtros por fuente.
  - Tipos y wrappers en `lib/api.ts`.

- [x] **3.2 · Alumno: Catálogo y compra individual**
  - Página `/privilegios` con catálogo agrupado por categoría (visible al alumno).
  - Flujo de compra individual con confirmación de saldo.
  - Página `/mis-tickets` (listar + detalle con folio grande para mostrar al profesor).

- [ ] **3.3 · Alumno: Split Bill (compras grupales)**
  - Iniciar Split Bill desde `/privilegios` (solo entradas `es_grupal`).
  - Aportar a tickets `funding` desde `/mis-tickets`.
  - Cancelar ticket `funding` (iniciador) con reembolso automático visible.

- [ ] **3.4 · Alumno: Canje de Tokens por décimas**
  - Página `/decimas` con formulario (entrega objetivo, cantidad) e histórico.

- [ ] **3.5 · Admin: Panel de economía**
  - Página `/admin/economia` con: gestor del catálogo (CRUD inline + botón "Sembrar defaults"), consumo por folio, ajuste manual de Tokens, cola de aprobación de décimas.

### 🔔 Dominio 4 — Sistema (Inbox, Announcements, Flags/State)

- [ ] Modelos `InboxItem`, `Announcement`, `AnnouncementRead`, `SystemFlag`, `SystemState`.
- [ ] Migración Alembic.
- [ ] `POST /admin/announcements` — publicador (§11.3.1); funciones esenciales: título, markdown, prioridad, anclado, alcance (todos/equipo/alumno).
- [ ] `GET /me/announcements` — feed activo para el alumno.
- [ ] `POST /me/announcements/{id}/mark-read`.
- [ ] `GET /admin/inbox` — bandeja con **2 categorías iniciales**: `registro` y `nombre_firma`. Se agregan más en iteraciones posteriores.
- [ ] `POST /admin/inbox/{id}/[resolve|snooze|dismiss|mark_seen]`.
- [ ] Frontend alumno: widget "Anuncios del profesor" en Fila 0 del Dashboard (§14.2).
- [ ] Frontend admin: Inbox de Aprobaciones + Publicador de anuncios.

---

## 🚀 Iteración 1 — Práctica, Contenido y Racha (Semanas 3–4)

*Automatización de Tokens individuales + canales de contenido + recordatorios.*

- [ ] **Modelos y migraciones nuevas** (contenido y ejercicios):
  - [ ] Modelo `Module` (id, numero, nombre, unlocked_at, pozo_tks).
  - [ ] Modelo `CourseSession` (id, module_id, numero_sesion, titulo, `notion_page_id`, `apuntes_pdf_url`, notion_last_sync).
  - [ ] Modelo `PracticeExercise` + `ExerciseAttempt`.
  - [ ] Modelo `ForumPost` con `session_id` (comentarios anclados a la Vista de Clase, no al módulo).
- [ ] **Integración Notion API + PDFs + Comentarios (Vista de Clase)**:
  - [ ] Endpoint `POST /admin/sessions/{id}/sync` — descarga la sub-página de Notion, guarda bloques en BD.
  - [ ] Pipeline: Notion API → BD local → renderizado con `react-notion-x` (sección superior de la Vista de Clase).
  - [ ] Visor embebido de PDF (`<iframe>`) para apuntes del profesor desde GDrive (sección media).
  - [ ] Sección de comentarios estilo YouTube por sesión (sección inferior).
  - [ ] Botón admin "Sincronizar Clase" por sesión.
- [ ] **Test de perfil de trabajo (Belbin adaptado)** *(mudado desde Dominio 1 diferido)*:
  - [ ] Modelo `ProfileTestQuestion` + `ProfileTestAnswer` (8-10 preguntas de escenario con 3 opciones cada una).
  - [ ] Migración Alembic.
  - [ ] `GET /profile-test` (para persona en `pending_profile`) y `POST /profile-test/submit`.
  - [ ] Cambiar default de registro a `pending_profile`; al terminar el test → `pending_approval` (auto).
  - [ ] Frontend: página `/test-perfil` accesible inmediatamente tras el registro (no requiere aprobación previa).
  - [ ] Redacción de las preguntas + bibliografía visible (Belbin, Felder & Brent).

- [ ] **Motor SymPy + MathLive**:
  - [ ] UI del profesor para crear problemas parametrizados.
  - [ ] Pre-procesamiento de derivadas ($dy/dx$) y normalización de constantes libres ($C_1$, $K$…).
  - [ ] Validación simbólica de ejercicios (equivalencia + sustitución para EDOs).
- [ ] **Motor de Racha Diaria** (APScheduler):
  - [ ] Jobs `publish_daily_challenge`, `evaluate_streaks`, `detect_inactivity`.
  - [ ] Widget de racha con calendario mensual y palomitas verdes.
  - [ ] Pases de racha automáticos + compra en catálogo.
- [ ] **Comentarios por Clase** (Foros tipo YouTube) *(subido desde Iteración 2 original; usa `ForumPost.session_id`)*:
  - [ ] Opción por post: nickname o anónimo para pares.
  - [ ] Editor con soporte de LaTeX inline.
  - [ ] Marcado de post destacado por el profesor (bono de Tokens al autor).
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
  - [ ] Solo integrantes presentes reciben Tokens.
- [ ] Sistema de **Kudos** entre compañeros (10 Tks del emisor, transferencia neta cero).
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
- [ ] **Sustentación destacada** (asignación desde admin) y **posts destacados** con bono de Tokens.
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
