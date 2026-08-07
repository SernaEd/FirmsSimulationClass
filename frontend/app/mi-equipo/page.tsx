"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError, ProposalOut, TeamOut, api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

type ProposeStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success" };

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
    <main className="min-h-screen max-w-3xl mx-auto p-8 space-y-8">
      <header className="space-y-1">
        <Link href="/inicio" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Regresar al inicio
        </Link>
        <h1 className="text-3xl font-semibold">Mi equipo</h1>
      </header>

      {loadingTeam ? (
        <p className="text-neutral-500">Cargando equipo…</p>
      ) : teamError ? (
        <p className="text-red-400 text-sm">Error: {teamError}</p>
      ) : !team ? (
        <section className="rounded-lg border border-amber-800 bg-amber-950/30 p-6 space-y-2">
          <h2 className="text-lg font-semibold text-amber-300">Sin equipo asignado aún</h2>
          <p className="text-sm text-amber-100/80">
            El profesor genera los equipos desde el panel administrativo. Cuando
            lo haga, aquí verás a tus integrantes y podrás proponer el nombre
            de la firma consultora.
          </p>
        </section>
      ) : (
        <>
          <TeamCard team={team} />
          <ProposeSection
            team={team}
            proposals={proposals}
            status={proposeStatus}
            onSubmit={handlePropose}
          />
        </>
      )}
    </main>
  );
}

function TeamCard({ team }: { team: TeamOut }) {
  const nombreLabel = team.nombre_firma ?? "(sin nombre)";
  const badgeColor: Record<string, string> = {
    pendiente: "bg-neutral-800 text-neutral-300",
    aprobado: "bg-emerald-900/60 text-emerald-300",
    asignado_por_sistema: "bg-blue-900/60 text-blue-300",
  };
  return (
    <section className="rounded-lg border border-surface-border bg-surface-raised p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">Firma consultora</p>
          <h2 className="text-2xl font-semibold mt-1">{nombreLabel}</h2>
        </div>
        <span
          className={
            "px-3 py-1 rounded-full text-xs font-medium " +
            (badgeColor[team.estado_nombre] ?? "bg-neutral-800 text-neutral-300")
          }
        >
          {team.estado_nombre}
        </span>
      </div>

      <div>
        <p className="text-sm text-neutral-400 mb-2">Integrantes ({team.members.length})</p>
        <ul className="divide-y divide-surface-border/60">
          {team.members.map((m) => (
            <li key={m.user_id} className="py-2 flex items-center justify-between text-sm">
              <span>
                <span className="text-white">{m.nickname}</span>{" "}
                <span className="text-neutral-500">— {m.nombre} {m.apellidos}</span>
              </span>
              <span className="text-xs text-neutral-500">
                {m.perfil ?? "sin perfil"}
              </span>
            </li>
          ))}
        </ul>
      </div>
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
    <section className="rounded-lg border border-surface-border bg-surface-raised p-6 space-y-4">
      <h2 className="text-lg font-semibold">Nombre de la firma</h2>

      {bloqueado ? (
        <p className="text-sm text-neutral-400">
          El equipo ya tiene un nombre aprobado. Si quieren cambiarlo, escríbanle
          al profesor.
        </p>
      ) : (
        <>
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
                Nueva propuesta <span className="text-ibero-red">*</span>
              </span>
              <input
                name="propuesta"
                required
                minLength={3}
                maxLength={40}
                className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-white focus:border-ibero-red focus:outline-none focus:ring-1 focus:ring-ibero-red"
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
              className="rounded-lg bg-ibero-red hover:bg-ibero-red-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-5 py-2 font-medium text-sm"
            >
              {status.kind === "submitting" ? "Enviando..." : "Proponer nombre"}
            </button>
          </form>
        </>
      )}

      {proposals.length > 0 && (
        <div className="pt-4 border-t border-surface-border/60">
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
