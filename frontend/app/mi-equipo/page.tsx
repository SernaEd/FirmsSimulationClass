"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ApiError,
  ProposalOut,
  TeamMemberOut,
  TeamOut,
  api,
} from "@/lib/api";
import { profileAvatarClass, profileHint, profileLabel, profileTagClass } from "@/lib/profile";
import { useAuth } from "@/lib/useAuth";

type ProposeStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success" };

// Rediseño "Mi equipo" — ver UiDesign/README.md §3. El chat y el resumen de
// equipo (Tks totales, lugar en licitación) no tienen backend todavía: se
// muestran en estado "próximamente" (ver UiDesign/README.md, "Implementation
// notes"). El flujo de proponer/aprobar nombre de firma sí es real y se
// conserva completo, solo re-vestido con los tokens nuevos.
export default function MiEquipo() {
  const authState = useAuth();
  const [team, setTeam] = useState<TeamOut | null>(null);
  const [proposals, setProposals] = useState<ProposalOut[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [proposeStatus, setProposeStatus] = useState<ProposeStatus>({ kind: "idle" });

  const token = authState.status === "authenticated" ? authState.token : null;

  const loadTeam = useCallback(async (): Promise<TeamOut | null> => {
    if (!token) return null;
    setLoadingTeam(true);
    setTeamError(null);
    try {
      const t = await api.myTeam(token);
      setTeam(t);
      if (t) {
        const props = await api.teamProposals(token, t.id);
        setProposals(props);
      } else {
        setProposals([]);
      }
      return t;
    } catch (err) {
      setTeamError(err instanceof ApiError ? err.detail : String(err));
      return null;
    } finally {
      setLoadingTeam(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadTeam();
  }, [token, loadTeam]);

  async function handlePropose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !team) return;
    const propuesta = String(new FormData(event.currentTarget).get("propuesta") ?? "").trim();
    setProposeStatus({ kind: "submitting" });
    try {
      await api.proposeName(token, team.id, propuesta);
      setProposeStatus({ kind: "success" });
      (event.target as HTMLFormElement).reset();
      await loadTeam();
    } catch (err) {
      setProposeStatus({
        kind: "error",
        message: err instanceof ApiError ? err.detail : String(err),
      });
    }
  }

  if (authState.status !== "authenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="max-w-[1080px] mx-auto px-4 sm:px-[11.2px] pt-16 pb-24">
      <Link href="/inicio" className="text-sm text-neutral-500 hover:text-neutral-300">
        ← Regresar al inicio
      </Link>

      {loadingTeam ? (
        <p className="text-neutral-500 mt-6">Cargando equipo…</p>
      ) : teamError ? (
        <p className="text-red-400 text-sm mt-6">Error: {teamError}</p>
      ) : !team ? (
        <section className="rounded-md border border-amber-800 bg-amber-950/30 p-6 space-y-2 mt-6">
          <h2 className="text-lg font-semibold text-amber-300">Sin equipo asignado aún</h2>
          <p className="text-sm text-amber-100/80">
            El profesor genera los equipos desde el panel administrativo. Cuando
            lo haga, aquí verás a tus integrantes y podrás proponer el nombre
            de la firma consultora.
          </p>
        </section>
      ) : (
        <>
          <header className="flex items-center justify-between gap-6 flex-wrap mb-14 pb-8 mt-2 border-b border-neutral-900">
            <div>
              <p className="text-accent-300 text-xs uppercase tracking-[0.14em] mb-2">Mi equipo</p>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="text-[34px] font-medium">{team.nombre_firma ?? "(sin nombre)"}</h1>
                <span className="inline-flex items-center text-[11px] px-2.5 py-0.5 rounded bg-accent-800 text-accent-100">
                  {team.members.length} integrantes
                </span>
              </div>
            </div>
            <div className="flex">
              {team.members.map((m) => (
                <div
                  key={m.user_id}
                  title={`${m.nickname} — ${m.nombre} ${m.apellidos}`}
                  className={
                    "-ml-2.5 first:ml-0 border-2 border-surface flex items-center justify-center w-[38px] h-[38px] rounded-full text-xs font-medium " +
                    profileAvatarClass(m.perfil)
                  }
                >
                  {initials(m)}
                </div>
              ))}
            </div>
          </header>

          <div className="grid lg:grid-cols-[1.1fr_1fr_0.8fr] gap-9 items-start">
            <section className="rounded-md bg-surface-raised shadow-sm p-6">
              <p className="text-[10px] uppercase tracking-[0.1em] text-accent-400 mb-4">Integrantes</p>
              <div className="grid gap-3">
                {team.members.map((m) => (
                  <div
                    key={m.user_id}
                    className="flex items-center gap-3.5 p-3 rounded-md transition-colors hover:bg-surface"
                  >
                    <div className={"flex items-center justify-center w-[38px] h-[38px] rounded-full text-xs font-medium shrink-0 " + profileAvatarClass(m.perfil)}>
                      {initials(m)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.nickname}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{profileHint(m.perfil)}</p>
                    </div>
                    <span className={"inline-flex items-center text-[11px] px-2.5 py-0.5 rounded shrink-0 " + profileTagClass(m.perfil)}>
                      {profileLabel(m.perfil)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <ChatPlaceholderCard />

            <div className="grid gap-7">
              <section className="rounded-md bg-surface-raised shadow-sm p-6">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-accent-400">Resumen</p>
                  <span className="inline-flex items-center text-[10px] tracking-wide px-1.5 py-0.5 rounded border border-accent-500 text-accent-300">
                    Próximamente
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  Tks acumulados del equipo y lugar en la última licitación se
                  mostrarán aquí en cuanto exista un endpoint de resumen de
                  equipo.
                </p>
              </section>

              <ProposeSection
                team={team}
                proposals={proposals}
                status={proposeStatus}
                onSubmit={handlePropose}
              />
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function initials(m: TeamMemberOut): string {
  const a = m.nombre.trim().charAt(0);
  const b = m.apellidos.trim().charAt(0);
  return (a + b).toUpperCase() || m.nickname.slice(0, 2).toUpperCase();
}

// El chat de equipo no tiene backend/websocket en este proyecto — se deja el
// contenedor listo con el mismo tamaño/posición del diseño y un estado
// "próximamente" en vez de mensajes o un input funcional.
function ChatPlaceholderCard() {
  return (
    <section className="rounded-md bg-surface-raised shadow-sm p-6 flex flex-col min-h-[340px]">
      <div className="flex items-center gap-2 mb-4">
        <p className="text-[10px] uppercase tracking-[0.1em] text-accent-400">Chat del equipo</p>
        <span className="inline-flex items-center text-[10px] tracking-wide px-1.5 py-0.5 rounded border border-accent-500 text-accent-300">
          Próximamente
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-600" aria-hidden="true">
          <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4V5Z" />
        </svg>
        <p className="text-xs text-neutral-500">
          El chat del equipo llega en una próxima iteración.
        </p>
      </div>
      <input
        className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-neutral-500 placeholder:text-neutral-600 cursor-not-allowed"
        placeholder="Disponible próximamente…"
        disabled
      />
    </section>
  );
}

function ProposeSection({
  team,
  proposals,
  status,
  onSubmit,
}: {
  team: TeamOut;
  proposals: ProposalOut[];
  status: ProposeStatus;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  const bloqueado = team.estado_nombre === "aprobado";
  const propuestaActiva = proposals.find((p) => p.estado === "pendiente_mod");

  return (
    <section className="rounded-md bg-surface-raised shadow-sm p-6">
      <p className="text-sm font-medium mb-1.5">
        {bloqueado ? "Nombre de la firma aprobado" : "Nombre de la firma"}
      </p>

      {bloqueado ? (
        <div className="space-y-3">
          <p className="text-xs text-neutral-500">
            El equipo ya tiene un nombre aprobado. Si quieren cambiarlo,
            escríbanle al profesor.
          </p>
          <Link
            href="/privilegios"
            className="inline-flex items-center gap-1.5 text-xs text-accent-300 hover:text-accent-200 transition-colors"
          >
            Ver catálogo de privilegios →
          </Link>
        </div>
      ) : (
        <div className="space-y-4 mt-3">
          {propuestaActiva && (
            <div className="rounded-md border border-amber-800/60 bg-amber-950/30 p-3 text-sm text-amber-100/90">
              <span className="font-medium">Propuesta pendiente de moderación:</span>{" "}
              &ldquo;{propuestaActiva.propuesta}&rdquo;
              <p className="text-xs text-amber-200/60 mt-1">
                Enviar una nueva propuesta reemplaza esta.
              </p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block space-y-1.5">
              <span className="block text-sm text-neutral-300">
                Nueva propuesta <span className="text-accent-400">*</span>
              </span>
              <input
                name="propuesta"
                required
                minLength={3}
                maxLength={40}
                className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-neutral-100 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                placeholder="Ej. Consultoría Fourier"
              />
              <span className="block text-xs text-neutral-500">
                3-40 caracteres. Letras (con acentos), números, espacios y guiones.
              </span>
            </label>

            {status.kind === "error" && (
              <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
                {status.message}
              </p>
            )}
            {status.kind === "success" && (
              <p className="rounded-md border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-300">
                Propuesta enviada. Queda pendiente de moderación.
              </p>
            )}

            <button
              type="submit"
              disabled={status.kind === "submitting"}
              className="w-full rounded-md border border-accent-500 text-accent-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-accent-500/10 px-5 py-2 font-medium text-sm"
            >
              {status.kind === "submitting" ? "Enviando..." : "Proponer nombre"}
            </button>
          </form>
        </div>
      )}

      {proposals.length > 0 && (
        <div className="pt-4 mt-4 border-t border-neutral-900">
          <p className="text-xs text-neutral-500 mb-2">Historial de propuestas</p>
          <ul className="space-y-1 text-xs text-neutral-400">
            {proposals.map((p) => (
              <li key={p.id}>
                &ldquo;{p.propuesta}&rdquo; · {p.estado}
                {p.nota_moderacion && ` · nota: ${p.nota_moderacion}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
