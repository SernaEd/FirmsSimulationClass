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
