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

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      detail = normalizeDetail(data) ?? detail;
    } catch {
      // body no era JSON
    }
    throw new ApiError(res.status, detail);
  }

  // Puede ser 204 sin cuerpo
  if (res.status === 204) return undefined as T;
  return res.json();
}

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

// ---- API pública ----
export const api = {
  // Dominio 1
  register: (body: RegisterPayload) =>
    request<UserOut>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  login: (body: LoginPayload) =>
    request<TokenOut>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: (token: string) => request<UserOut>("/auth/me", {}, token),

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
};

// ---- Token en localStorage ----
const TOKEN_KEY = "calc3_token";

export const auth = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
  },
};
