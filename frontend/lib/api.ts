// Cliente HTTP y manejo de token en el navegador.
// Todas las llamadas de auth se hacen client-side.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---- Tipos ----
export type UserStatus =
  | "pending_profile"
  | "pending_approval"
  | "active"
  | "rejected";

export type UserProfile = "analista" | "modelador" | "integrador";

export type UserPronouns = "ella" | "el" | "elle" | "prefiero_no_decir";

export type UserOut = {
  id: number;
  nombre: string;
  apellidos: string;
  numero_cuenta: string;
  nickname: string;
  correo_institucional: string | null;
  estado: UserStatus;
  perfil: UserProfile | null;
  pronombres: UserPronouns;
  is_admin: boolean;
  terms_accepted_at: string;
  created_at: string;
};

export type StudentAdminOut = UserOut & {
  team_id: number | null;
  team_nombre: string | null;
  balance: number;
};

export type RegisterPayload = {
  nombre: string;
  apellidos: string;
  numero_cuenta: string;
  nickname: string;
  pin: string;
  correo_institucional?: string;
  pronombres?: UserPronouns;
  acepta_reglas: boolean;
};

// UserOut + token: el registro deja lista la sesión de una vez (ver
// POST /auth/register en el backend).
export type RegisterOut = UserOut & TokenOut;

// Ajusta un adjetivo o participio pasado al pronombre declarado.
// Ejemplos: pickByPronoun(user.pronombres, "bienvenida", "bienvenido", "bienvenide")
// → cuando pronombres = prefiero_no_decir, usa la versión neutra (3er arg).
export function pickByPronoun(
  pronombres: UserPronouns,
  ella: string,
  el: string,
  neutro: string,
): string {
  if (pronombres === "ella") return ella;
  if (pronombres === "el") return el;
  return neutro;
}

export type LoginPayload = {
  numero_cuenta: string;
  pin: string;
};

export type TokenOut = {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
};

// ---- Errores ----
export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

// FastAPI/Pydantic responde 422 con detail = [{type, loc, msg, input, ctx}, ...].
// Otros errores propios responden { detail: "texto" } o { error: "texto" }.
function normalizeDetail(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;

  const raw = obj.detail ?? obj.error;
  if (typeof raw === "string") return raw;

  if (Array.isArray(raw)) {
    // Errores de validación Pydantic
    const parts = raw
      .map((e) => {
        if (!e || typeof e !== "object") return null;
        const err = e as { loc?: unknown[]; msg?: string };
        const field = Array.isArray(err.loc) && err.loc.length > 1
          ? String(err.loc[err.loc.length - 1])
          : "campo";
        return err.msg ? `${field}: ${err.msg}` : null;
      })
      .filter((x): x is string => x !== null);
    if (parts.length > 0) return parts.join(" · ");
  }

  return null;
}

// ---- Response helpers (compartidos por request(), requestUpload() y
// openAttachment()) ----
async function throwIfError(res: Response): Promise<void> {
  if (res.ok) return;
  let detail = `HTTP ${res.status}`;
  try {
    const data = await res.json();
    detail = normalizeDetail(data) ?? detail;
  } catch {
    // body no era JSON
  }
  throw new ApiError(res.status, detail);
}

async function handleResponse<T>(res: Response): Promise<T> {
  await throwIfError(res);
  // Puede ser 204 sin cuerpo
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- Request helper ----
async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (err) {
    throw new ApiError(0, `No se pudo conectar con el servidor (${String(err)}).`);
  }

  return handleResponse<T>(res);
}

// Subida de archivos (multipart/form-data) — sin Content-Type manual: el
// navegador arma el boundary solo. Solo se usa para adjuntos de sesión.
async function requestUpload<T>(path: string, formData: FormData, token: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch (err) {
    throw new ApiError(0, `No se pudo conectar con el servidor (${String(err)}).`);
  }

  return handleResponse<T>(res);
}

/** Descarga un adjunto autenticado y lo abre en pestaña nueva (un <a href>
 * plano no puede mandar el header Authorization). */
export async function openAttachment(
  sessionId: number,
  attachmentId: number,
  filename: string,
  token: string,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/sessions/${sessionId}/attachments/${attachmentId}/download`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  await throwIfError(res);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank");
  if (!opened) {
    // Popup bloqueado: forzar descarga en vez de dejarlo silencioso.
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// Vista previa inline (PDF, o el PDF convertido de un PPT/PPTX — ver
// preview_available). A diferencia de openAttachment(), no abre nada: el
// caller decide qué hacer con el blob URL (ej. un <iframe>) y es quien debe
// revocarlo cuando ya no lo necesite (deja de mostrarse / unmount).
export async function fetchAttachmentPreviewUrl(
  sessionId: number,
  attachmentId: number,
  token: string,
): Promise<string> {
  const res = await fetch(
    `${API_URL}/sessions/${sessionId}/attachments/${attachmentId}/preview`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  await throwIfError(res);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ---- Tipos test de perfil (§3, Iteración 1) ----
export type ProfileTestOptionOut = {
  perfil: UserProfile;
  texto: string;
};

export type ProfileTestQuestionOut = {
  id: number;
  orden: number;
  enunciado: string;
  opciones: ProfileTestOptionOut[];
};

export type ProfileTestSubmitPayload = {
  respuestas: { question_id: number; perfil_elegido: UserProfile }[];
};

// ---- Tipos Dominio 2 (Teams) ----
export type TeamNameStatus = "pendiente" | "aprobado" | "asignado_por_sistema";
export type ProposalStatus = "pendiente_mod" | "aprobado" | "rechazado" | "superseded";

export type TeamMemberOut = {
  user_id: number;
  nombre: string;
  apellidos: string;
  nickname: string;
  perfil: UserProfile | null;
  joined_at: string;
};

export type TeamOut = {
  id: number;
  nombre_firma: string | null;
  estado_nombre: TeamNameStatus;
  created_at: string;
  members: TeamMemberOut[];
};

export type GenerateTeamsResult = {
  total_alumnos_disponibles: number;
  equipos_generados: number;
  tamanos: number[];
  teams: TeamOut[] | null;
  warnings: string[];
};

export type ProposalOut = {
  id: number;
  team_id: number;
  propuesta: string;
  propuesto_por: number;
  estado: ProposalStatus;
  nota_moderacion: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: number | null;
};

// ---- Tipos Dominio 3 (Economía) ----
export type TokenSource =
  | "practica"
  | "racha"
  | "hito_racha"
  | "licitacion"
  | "sustentacion_destacada"
  | "post_destacado"
  | "kudos_out"
  | "kudos_in"
  | "ajuste_admin"
  | "canje_privilegio"
  | "canje_decima"
  | "split_bill_refund"
  | "bono_manual";

export type LedgerEntryOut = {
  id: number;
  user_id: number;
  delta: number;
  fuente: TokenSource;
  referencia_tipo: string | null;
  referencia_id: number | null;
  nota: string | null;
  admin_id: number | null;
  created_at: string;
};

export type BalanceOut = {
  balance: number;
  recent: LedgerEntryOut[];
};

// Etiquetas legibles para mostrar la fuente en la UI.
export const TOKEN_SOURCE_LABEL: Record<TokenSource, string> = {
  practica: "Ejercicios de práctica",
  racha: "Racha diaria",
  hito_racha: "Hito de racha",
  licitacion: "Licitación",
  sustentacion_destacada: "Sustentación destacada",
  post_destacado: "Post destacado",
  kudos_out: "Kudos enviado",
  kudos_in: "Kudos recibido",
  ajuste_admin: "Ajuste del profesor",
  canje_privilegio: "Canje de privilegio",
  canje_decima: "Canje por décimas",
  split_bill_refund: "Reembolso split bill",
  bono_manual: "Bono manual",
};

export type TicketStatus =
  | "funding"
  | "emitted"
  | "consumed"
  | "cancelled"
  | "expired";

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  funding: "En financiamiento",
  emitted: "Emitido",
  consumed: "Usado",
  cancelled: "Cancelado",
  expired: "Vencido",
};

export type PrivilegeCatalogOut = {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  costo: number;
  es_grupal: boolean;
  limites_config: Record<string, number> | null;
  visible: boolean;
  feature_flag_key: string | null;
  created_at: string;
  updated_at: string;
};

export type PrivilegeCatalogIn = {
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  costo: number;
  es_grupal?: boolean;
  limites_config?: Record<string, number> | null;
  visible?: boolean;
  feature_flag_key?: string | null;
};

// Todos los campos opcionales: PATCH solo envía lo que cambió.
export type PrivilegeCatalogUpdate = Partial<PrivilegeCatalogIn>;

export type SeedResult = {
  creadas: number;
  ya_existentes: number;
};

export type ContributionOut = {
  id: number;
  user_id: number;
  amount: number;
  created_at: string;
  refunded_at: string | null;
};

export type TicketOut = {
  id: number;
  folio: string;
  catalog_id: number;
  initiator_user_id: number;
  team_id: number | null;
  costo_total: number;
  pagado_total: number;
  estado: TicketStatus;
  created_at: string;
  emitido_at: string | null;
  consumido_at: string | null;
  consumido_por_admin_id: number | null;
  cancelled_at: string | null;
  contribuciones: ContributionOut[];
  // Presentes solo en vistas admin que hacen eager-load de las relaciones
  // (GET /admin/tickets). En otras vistas quedan undefined.
  initiator_name?: string | null;
  catalog_name?: string | null;
};

// Debe coincidir con el enum Python DecimalRequestStatus (models/economy.py):
// los valores viajan tal cual por la API, en español.
export type DecimalRequestStatus = "pendiente" | "aprobado" | "rechazado";

export type DecimalRedemptionOut = {
  id: number;
  user_id: number;
  entrega_descripcion: string;
  entrega_ref: string | null;
  decimas_solicitadas: number;
  pts_costo: number;
  estado: DecimalRequestStatus;
  nota_profesor: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: number | null;
  // Presente solo en /admin/decimal-redemption/pending (eager-load de `user`).
  user_name?: string | null;
};

export type DecimalRedemptionIn = {
  entrega_descripcion: string;
  entrega_ref?: string | null;
  decimas_solicitadas: number;
};


// Etiquetas amigables por categoría (§5.2). Las claves coinciden con
// los strings guardados en PrivilegeCatalog.categoria.
export const CATEGORY_LABEL: Record<string, string> = {
  tarea: "Tareas y entregas",
  examen: "Exámenes parciales",
  sustentacion: "Sustentación oral",
  contenido: "Contenido y acceso",
  racha: "Racha",
  tutoria: "Tutoría y apoyo",
  asistencia: "Asistencia",
};

// Orden preferido de categorías en la UI.
export const CATEGORY_ORDER = [
  "tarea",
  "examen",
  "sustentacion",
  "contenido",
  "racha",
  "tutoria",
  "asistencia",
];

// ---- Tipos Dominio 4 (Sistema: Inbox, Anuncios, Flags) ----

export type InboxItemType =
  | "registro"
  | "nombre_firma"
  | "canje_decima"
  | "disputa"
  | "sancion"
  | "feedback_sospechoso"
  | "sustentacion_destacada_pendiente"
  | "post_destacado_pendiente"
  | "alerta_inactividad"
  | "alerta_sistema";

export type InboxPriority = "alta" | "media" | "baja";
export type InboxItemStatus = "pendiente" | "atendido" | "pospuesto" | "descartado" | "visto";

export const INBOX_TYPE_LABEL: Record<InboxItemType, string> = {
  registro: "Registro pendiente",
  nombre_firma: "Propuesta de nombre",
  canje_decima: "Canje por décimas",
  disputa: "Disputa",
  sancion: "Proceso sancionatorio",
  feedback_sospechoso: "Retroalimentación sospechosa",
  sustentacion_destacada_pendiente: "Sustentación destacada pendiente",
  post_destacado_pendiente: "Post destacado pendiente",
  alerta_inactividad: "Alerta de inactividad",
  alerta_sistema: "Alerta de sistema",
};

export type InboxItemOut = {
  id: number;
  tipo: InboxItemType;
  referencia_id: number | null;
  payload_json: Record<string, unknown> | null;
  prioridad: InboxPriority;
  estado: InboxItemStatus;
  snoozed_until: string | null;
  created_at: string;
  resuelto_at: string | null;
  resuelto_por: number | null;
  nota_resolucion: string | null;
};

export type SystemFlagOut = {
  key: string;
  enabled: boolean;
  description: string | null;
  updated_at: string;
  updated_by: number | null;
};

export type FlagStatusOut = {
  key: string;
  enabled: boolean;
};

export type KnownFlagOut = {
  key: string;
  description: string | null;
};

// ---- Racha (Streak) ----
export type StreakDayStatus = "completado" | "fallido" | "neutro" | "pase_aplicado" | "pendiente_revision";

export type StreakEvidenceOut = {
  id: number;
  streak_day_id: number;
  user_id: number;
  user: {
    nombre: string;
    apellidos: string;
    numero_cuenta: string;
  };
  daily_exercise_id: number | null;
  solucion_path: string;
  submitted_at: string;
};

export type StreakDayOut = {
  id: number;
  user_id: number;
  fecha: string;
  estado: StreakDayStatus;
  evidence: StreakEvidenceOut | null;
};

// ---- Banco de Ejercicios Diarios ----
export type DailyExerciseOut = {
  id: number;
  fecha: string;
  course_session?: {
    id: number;
    module_id: number;
    numero_sesion: number;
    titulo: string;
  } | null;
  numero: number;
  enunciado: string;
  imagen_path: string | null;
  created_at: string;
};

// ---- Contenido (Módulos, Sesiones, adjuntos) — Iteración 1 ----
export type SessionAttachmentOut = {
  id: number;
  filename: string;
  content_type: string;
  size_bytes: number;
  preview_available: boolean;
  created_at: string;
};

export type CourseSessionListOut = {
  id: number;
  numero_sesion: number;
  titulo: string;
};

export type CourseSessionDetailOut = {
  id: number;
  module_id: number;
  numero_sesion: number;
  titulo: string;
  descripcion: string | null;
  embed_url: string | null;
  attachments: SessionAttachmentOut[];
};

export type ModuleOut = {
  id: number;
  numero: number;
  nombre: string;
  unlocked_at: string | null;
  sessions: CourseSessionListOut[];
};

// ---- Tipos Licitaciones (§10) ----
export type EstadoLicitacion = "abierta" | "cerrada";

export type TipoModeloCaso = "mezcla_lineal_tanque";

export type CasoOut = {
  id: number;
  numero: number;
  titulo: string;
  modulo: string;
  contexto: string;
  tipo_modelo: TipoModeloCaso;
  volumen_l: number;
  concentracion_inicial: number;
  concentracion_max: number;
  plazo_horas: number;
  presion_max_q: number;
};

export type LicitacionOut = {
  id: number;
  estado: EstadoLicitacion;
  caso: CasoOut;
  pts_primero: number;
  pts_segundo: number;
  pts_tercero: number;
  pts_correcta_fuera_podio: number;
  pts_participacion: number;
  abierta_at: string;
  cerrada_at: string | null;
};

export type Consecuencia = "lote_perdido" | "linea_danada" | "ninguna";

export type SimulacionResultadoOut = {
  a_final: number;
  cumple_plazo: boolean;
  cumple_presion: boolean;
  correcta: boolean;
  consecuencia: Consecuencia;
  dinero_perdido_mxn: number;
  pacientes_afectados: number;
  costo_reparacion_mxn: number;
};

export type LicitacionResponseOut = {
  id: number;
  licitacion_id: number;
  team_id: number;
  submitted_by: number;
  q_propuesta: number;
  resultado: SimulacionResultadoOut;
  correcta: boolean;
  orden_llegada: number | null;
  puntos_tokens: number | null;
  created_at: string;
};

// ---- API pública ----
export const api = {
  // Dominio 1
  register: (body: RegisterPayload) =>
    request<RegisterOut>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: LoginPayload) =>
    request<TokenOut>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: (token: string) => request<UserOut>("/auth/me", {}, token),

  // Test de perfil (§3, Iteración 1)
  getProfileTest: (token: string) =>
    request<ProfileTestQuestionOut[]>("/profile-test", {}, token),
  submitProfileTest: (token: string, body: ProfileTestSubmitPayload) =>
    request<UserOut>(
      "/profile-test/submit",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),

  // Dominio 2 — alumno
  myTeam: (token: string) => request<TeamOut | null>("/me/team", {}, token),
  proposeName: (token: string, teamId: number, propuesta: string) =>
    request<ProposalOut>(
      `/teams/${teamId}/propose-name`,
      { method: "POST", body: JSON.stringify({ propuesta }) },
      token,
    ),
  teamProposals: (token: string, teamId: number) =>
    request<ProposalOut[]>(`/teams/${teamId}/name-proposals`, {}, token),

  // Dominio 2 — admin
  adminListTeams: (token: string) =>
    request<TeamOut[]>("/admin/teams", {}, token),
  adminGenerateTeams: (
    token: string,
    body: { tamano_preferido?: 3 | 4; incluir_admin?: boolean; dry_run?: boolean },
  ) =>
    request<GenerateTeamsResult>(
      "/admin/teams/generate",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
  adminDeleteTeam: (token: string, teamId: number) =>
    request<void>(`/admin/teams/${teamId}`, { method: "DELETE" }, token),
  adminAssignDefaultName: (token: string, teamId: number, nombre?: string) =>
    request<TeamOut>(
      `/admin/teams/${teamId}/assign-default-name`,
      { method: "POST", body: JSON.stringify({ nombre }) },
      token,
    ),
  adminRenameTeam: (token: string, teamId: number, nombre: string) =>
    request<TeamOut>(
      `/admin/teams/${teamId}/rename`,
      { method: "POST", body: JSON.stringify({ nombre }) },
      token,
    ),
  adminListPendingProposals: (token: string) =>
    request<ProposalOut[]>("/admin/team-name-proposals/pending", {}, token),
  adminApproveProposal: (token: string, proposalId: number) =>
    request<TeamOut>(
      `/admin/team-name-proposals/${proposalId}/approve`,
      { method: "POST" },
      token,
    ),
  adminRejectProposal: (token: string, proposalId: number, nota?: string) =>
    request<ProposalOut>(
      `/admin/team-name-proposals/${proposalId}/reject`,
      { method: "POST", body: JSON.stringify({ nota_moderacion: nota }) },
      token,
    ),

  // Dominio 3 — economía (alumno)
  myTokens: (token: string) => request<BalanceOut>("/me/tokens", {}, token),
  myMovements: (
    token: string,
    opts: { limit?: number; offset?: number; fuente?: TokenSource[] } = {},
  ) => {
    const params = new URLSearchParams();
    if (opts.limit != null) params.set("limit", String(opts.limit));
    if (opts.offset != null) params.set("offset", String(opts.offset));
    if (opts.fuente) opts.fuente.forEach((f) => params.append("fuente", f));
    const qs = params.toString();
    return request<LedgerEntryOut[]>(
      `/me/tokens/movements${qs ? `?${qs}` : ""}`,
      {},
      token,
    );
  },
  listPrivileges: (token: string) =>
    request<PrivilegeCatalogOut[]>("/privileges", {}, token),
  purchasePrivilege: (token: string, catalogId: number) =>
    request<TicketOut>(
      `/privileges/${catalogId}/purchase`,
      { method: "POST" },
      token,
    ),
  myTickets: (token: string, estados?: TicketStatus[]) => {
    const params = new URLSearchParams();
    if (estados) estados.forEach((e) => params.append("estado", e));
    const qs = params.toString();
    return request<TicketOut[]>(
      `/me/tickets${qs ? `?${qs}` : ""}`,
      {},
      token,
    );
  },
  getTicket: (token: string, ticketId: number) =>
    request<TicketOut>(`/tickets/${ticketId}`, {}, token),
  initSplitBill: (token: string, catalogId: number, amount: number) =>
    request<TicketOut>(
      `/privileges/${catalogId}/split-bill/init`,
      { method: "POST", body: JSON.stringify({ amount }) },
      token,
    ),
  contributeToTicket: (token: string, ticketId: number, amount: number) =>
    request<TicketOut>(
      `/tickets/${ticketId}/contribute`,
      { method: "POST", body: JSON.stringify({ amount }) },
      token,
    ),
  cancelTicket: (token: string, ticketId: number) =>
    request<TicketOut>(
      `/tickets/${ticketId}/cancel`,
      { method: "POST" },
      token,
    ),
  listDecimalRedemptions: (token: string) =>
    request<DecimalRedemptionOut[]>("/me/decimal-redemption", {}, token),
  requestDecimalRedemption: (token: string, body: DecimalRedemptionIn) =>
    request<DecimalRedemptionOut>(
      "/me/decimal-redemption",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),

  // Dominio 3 — economía (admin)
  adminListPrivileges: (token: string) =>
    request<PrivilegeCatalogOut[]>("/admin/privileges", {}, token),
  adminCreatePrivilege: (token: string, body: PrivilegeCatalogIn) =>
    request<PrivilegeCatalogOut>(
      "/admin/privileges",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
  adminUpdatePrivilege: (token: string, catalogId: number, body: PrivilegeCatalogUpdate) =>
    request<PrivilegeCatalogOut>(
      `/admin/privileges/${catalogId}`,
      { method: "PATCH", body: JSON.stringify(body) },
      token,
    ),
  adminDeletePrivilege: (token: string, catalogId: number) =>
    request<void>(`/admin/privileges/${catalogId}`, { method: "DELETE" }, token),
  adminSeedDefaults: (token: string) =>
    request<SeedResult>("/admin/privileges/seed-defaults", { method: "POST" }, token),
  adminListTickets: (token: string, estados?: TicketStatus[]) => {
    const params = new URLSearchParams();
    if (estados) estados.forEach((e) => params.append("estado", e));
    const qs = params.toString();
    return request<TicketOut[]>(`/admin/tickets${qs ? `?${qs}` : ""}`, {}, token);
  },
  adminConsumeTicket: (token: string, folio: string) =>
    request<TicketOut>(`/admin/tickets/${folio}/consume`, { method: "POST" }, token),
  adminCancelTicket: (token: string, ticketId: number) =>
    request<TicketOut>(`/admin/tickets/${ticketId}/cancel`, { method: "POST" }, token),
  adminListPendingDecimals: (token: string) =>
    request<DecimalRedemptionOut[]>("/admin/decimal-redemption/pending", {}, token),
  adminApproveDecimal: (token: string, requestId: number, nota?: string) =>
    request<DecimalRedemptionOut>(
      `/admin/decimal-redemption/${requestId}/approve`,
      { method: "POST", body: JSON.stringify({ nota }) },
      token,
    ),
  adminRejectDecimal: (token: string, requestId: number, nota?: string) =>
    request<DecimalRedemptionOut>(
      `/admin/decimal-redemption/${requestId}/reject`,
      { method: "POST", body: JSON.stringify({ nota }) },
      token,
    ),
  adminAdjustTokens: (token: string, body: { user_id: number; delta: number; nota: string }) =>
    request<LedgerEntryOut>(
      "/admin/tokens/adjust",
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
  adminListUsers: (token: string) =>
    request<UserOut[]>("/admin/users", {}, token),
  adminListAllStudents: (token: string) =>
    request<StudentAdminOut[]>("/admin/users/all", {}, token),
  adminApproveUser: (token: string, userId: number) =>
    request<UserOut>(`/admin/users/${userId}/approve`, { method: "POST" }, token),
  adminRejectUser: (token: string, userId: number) =>
    request<UserOut>(`/admin/users/${userId}/reject`, { method: "POST" }, token),
  adminResetUserPin: (token: string, userId: number) =>
    request<{ user_id: number; temp_pin: string; message: string }>(
      `/admin/users/${userId}/reset-pin`,
      { method: "POST" },
      token,
    ),
  adminReassignProfile: (token: string, userId: number, perfil: UserProfile) =>
    request<UserOut>(
      `/admin/users/${userId}/reassign-profile`,
      { method: "POST", body: JSON.stringify({ perfil }) },
      token,
    ),
  adminRenameUser: (token: string, userId: number, nombre: string, apellidos: string) =>
    request<UserOut>(
      `/admin/users/${userId}/rename`,
      { method: "POST", body: JSON.stringify({ nombre, apellidos }) },
      token,
    ),
  adminSetUserTeam: (token: string, userId: number, teamId: number | null) =>
    request<StudentAdminOut>(
      `/admin/users/${userId}/team`,
      { method: "POST", body: JSON.stringify({ team_id: teamId }) },
      token,
    ),

  // Dominio 4 — admin: Inbox
  adminGetInbox: (
    token: string,
    opts: { tipo?: InboxItemType[]; prioridad?: InboxPriority[]; estado?: InboxItemStatus[] } = {},
  ) => {
    const params = new URLSearchParams();
    opts.tipo?.forEach((t) => params.append("tipo", t));
    opts.prioridad?.forEach((p) => params.append("prioridad", p));
    opts.estado?.forEach((e) => params.append("estado", e));
    const qs = params.toString();
    return request<InboxItemOut[]>(`/admin/inbox${qs ? `?${qs}` : ""}`, {}, token);
  },
  adminInboxResolve: (token: string, id: number, nota?: string) =>
    request<InboxItemOut>(
      `/admin/inbox/${id}/resolve`,
      { method: "POST", body: JSON.stringify({ nota }) },
      token,
    ),
  adminInboxSnooze: (token: string, id: number, until: string) =>
    request<InboxItemOut>(
      `/admin/inbox/${id}/snooze`,
      { method: "POST", body: JSON.stringify({ until }) },
      token,
    ),
  adminInboxDismiss: (token: string, id: number, nota: string) =>
    request<InboxItemOut>(
      `/admin/inbox/${id}/dismiss`,
      { method: "POST", body: JSON.stringify({ nota }) },
      token,
    ),
  adminInboxMarkSeen: (token: string, id: number) =>
    request<InboxItemOut>(`/admin/inbox/${id}/mark_seen`, { method: "POST" }, token),

  // Dominio 4 — admin: Feature flags
  adminListFlags: (token: string) =>
    request<SystemFlagOut[]>("/admin/system/flags", {}, token),
  adminListKnownFlagKeys: (token: string) =>
    request<KnownFlagOut[]>("/admin/system/flags/known-keys", {}, token),
  adminSetFlag: (token: string, key: string, enabled: boolean, description?: string | null) =>
    request<SystemFlagOut>(
      `/admin/system/flags/${key}`,
      { method: "PUT", body: JSON.stringify({ enabled, description }) },
      token,
    ),

  // Dominio 4 — alumno: lectura de feature flags (mostrar/ocultar UI)
  getFeatureFlag: (token: string, key: string) =>
    request<FlagStatusOut>(`/system/flags/${key}`, {}, token),

  // ---- Banco de Ejercicios Diarios ----
  getTodayExercise: (token: string) =>
    request<DailyExerciseOut | null>("/daily-exercises/today", {}, token),
  adminListExercises: (token: string) =>
    request<DailyExerciseOut[]>("/admin/daily-exercises", {}, token),
  adminCreateExercise: (token: string, formData: FormData) =>
    requestUpload<DailyExerciseOut>("/admin/daily-exercises", formData, token),

  // ---- Racha (Streak) ----
  submitStreakEvidence: (token: string, formData: FormData) =>
    requestUpload<StreakDayOut>("/me/streak/evidence", formData, token),
  getMyStreak: (token: string, year?: number, month?: number) => {
    const params = new URLSearchParams();
    if (year) params.append("year", String(year));
    if (month) params.append("month", String(month));
    const qs = params.toString();
    return request<StreakDayOut[]>(`/me/streak${qs ? `?${qs}` : ""}`, {}, token);
  },
  adminGetStreakEvidence: (token: string, skip: number = 0, limit: number = 50, userId?: number) => {
    const params = new URLSearchParams();
    params.append("skip", String(skip));
    params.append("limit", String(limit));
    if (userId) params.append("user_id", String(userId));
    return request<StreakEvidenceOut[]>(`/admin/streak/evidence?${params.toString()}`, {}, token);
  },
  adminGetStreakEvidenceUrl: async (token: string, id: number) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/admin/streak/evidence/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Error al obtener evidencia");
    const blob = await res.blob();
    return { url: URL.createObjectURL(blob), type: blob.type };
  },
  adminDownloadStreakEvidence: async (token: string, id: number, filename: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/admin/streak/evidence/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Error al descargar");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },
  adminResolveStreakDay: (token: string, dayId: number, estado: "fallido" | "neutro") =>
    request<StreakDayOut>(
      `/admin/streak/days/${dayId}/resolve`,
      { method: "POST", body: JSON.stringify({ estado }) },
      token,
    ),

  // Contenido — alumno
  listModules: (token: string) => request<ModuleOut[]>("/modules", {}, token),
  getSession: (token: string, sessionId: number) =>
    request<CourseSessionDetailOut>(`/sessions/${sessionId}`, {}, token),

  // Contenido — admin
  adminCreateModule: (token: string, body: { numero: number; nombre: string }) =>
    request<ModuleOut>("/admin/modules", { method: "POST", body: JSON.stringify(body) }, token),
  adminListModules: (token: string) => request<ModuleOut[]>("/admin/modules", {}, token),
  adminUpdateModule: (token: string, moduleId: number, body: { numero?: number; nombre?: string }) =>
    request<ModuleOut>(
      `/admin/modules/${moduleId}`,
      { method: "PATCH", body: JSON.stringify(body) },
      token,
    ),
  adminUnlockModule: (token: string, moduleId: number) =>
    request<ModuleOut>(`/admin/modules/${moduleId}/unlock`, { method: "POST" }, token),
  adminLockModule: (token: string, moduleId: number) =>
    request<ModuleOut>(`/admin/modules/${moduleId}/lock`, { method: "POST" }, token),
  adminCreateSession: (
    token: string,
    moduleId: number,
    body: { numero_sesion: number; titulo: string; descripcion?: string | null; embed_url?: string | null },
  ) =>
    request<CourseSessionDetailOut>(
      `/admin/modules/${moduleId}/sessions`,
      { method: "POST", body: JSON.stringify(body) },
      token,
    ),
  adminUpdateSession: (
    token: string,
    sessionId: number,
    body: { numero_sesion?: number; titulo?: string; descripcion?: string | null; embed_url?: string | null },
  ) =>
    request<CourseSessionDetailOut>(
      `/admin/sessions/${sessionId}`,
      { method: "PATCH", body: JSON.stringify(body) },
      token,
    ),
  adminDeleteSession: (token: string, sessionId: number) =>
    request<void>(`/admin/sessions/${sessionId}`, { method: "DELETE" }, token),
  adminUploadAttachment: (token: string, sessionId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return requestUpload<SessionAttachmentOut>(
      `/admin/sessions/${sessionId}/attachments`,
      formData,
      token,
    );
  },
  adminDeleteAttachment: (token: string, attachmentId: number) =>
    request<void>(`/admin/attachments/${attachmentId}`, { method: "DELETE" }, token),

  // Licitaciones — alumno (§10)
  licitacionActiva: (token: string) =>
    request<LicitacionOut | null>("/licitaciones/activa", {}, token),
  getLicitacion: (token: string, licitacionId: number) =>
    request<LicitacionOut>(`/licitaciones/${licitacionId}`, {}, token),
  responderLicitacion: (token: string, licitacionId: number, q: number) =>
    request<LicitacionResponseOut>(
      `/licitaciones/${licitacionId}/responder`,
      { method: "POST", body: JSON.stringify({ q }) },
      token,
    ),
  miRespuestaLicitacion: (token: string, licitacionId: number) =>
    request<LicitacionResponseOut | null>(`/licitaciones/${licitacionId}/mi-respuesta`, {}, token),
};

// ---- Sesión en localStorage (token + usuario cacheado) ----
const TOKEN_KEY = "calc3_token";
const USER_KEY = "calc3_user";

// Notifica a AuthContext (montado una sola vez en el layout raíz) que la
// sesión cambió, sin necesidad de que cada página que hace login/logout
// conozca el contexto — solo llama auth.setToken()/clearToken() como ya hacía.
// Si ya se tiene el UserOut fresco a la mano (ej. la respuesta de una
// mutación), se manda en `detail.user` para que AuthContext actualice su
// estado directo sin otro round-trip a /auth/me.
export const AUTH_CHANGE_EVENT = "calc3-auth-changed";

export type AuthChangeDetail = { user?: UserOut };

function notifyAuthChange(user?: UserOut): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<AuthChangeDetail>(AUTH_CHANGE_EVENT, { detail: { user } }));
}

export const auth = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, token);
    notifyAuthChange();
  },
  clearToken(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    notifyAuthChange();
  },
  getCachedUser(): UserOut | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserOut;
    } catch {
      return null;
    }
  },
  setCachedUser(user: UserOut): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  // Actualiza el usuario cacheado y notifica a AuthContext con los datos ya
  // frescos (ej. tras el test de perfil, que devuelve el UserOut
  // actualizado) — evita el round-trip a /auth/me que haría un evento sin
  // `user` adjunto.
  setUser(user: UserOut): void {
    auth.setCachedUser(user);
    notifyAuthChange(user);
  },
};
