"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError, GenerateTeamsResult, ProposalOut, TeamOut, api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

function TeamRow({
  team,
  onRename,
  onAssignDefault,
  onDelete,
  disabled,
}: {
  team: TeamOut;
  onRename: (teamId: number, nombre: string) => Promise<void>;
  onAssignDefault: (teamId: number) => Promise<void>;
  onDelete: (teamId: number) => Promise<void>;
  disabled: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(team.nombre_firma ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalError(null);
    try {
      await onRename(team.id, draft.trim());
      setRenaming(false);
    } catch (err) {
      setLocalError(err instanceof ApiError ? err.detail : String(err));
    }
  }

  return (
    <li className="py-3 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          {renaming ? (
            <form onSubmit={submit} className="flex items-center gap-2">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                minLength={3}
                maxLength={40}
                className="rounded-md border border-surface-border bg-surface px-2 py-1 text-sm w-64"
                placeholder="Nombre de la firma"
              />
              <button
                type="submit"
                disabled={disabled || draft.trim().length < 3}
                className="rounded-md bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1 text-xs"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setRenaming(false);
                  setDraft(team.nombre_firma ?? "");
                  setLocalError(null);
                }}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <p className="text-white">
              {team.nombre_firma ?? <em className="text-neutral-500">(sin nombre)</em>}{" "}
              <span className="text-xs text-neutral-500">#{team.id}</span>
            </p>
          )}
          <p className="text-xs text-neutral-500 mt-0.5">
            {team.estado_nombre} · {team.members.length} integrantes
          </p>
        </div>
        {!renaming && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setRenaming(true)}
              className="rounded-md border border-neutral-700 hover:bg-neutral-800 px-3 py-1.5 text-xs"
            >
              Renombrar
            </button>
            {team.estado_nombre !== "aprobado" && team.estado_nombre !== "asignado_por_sistema" && (
              <button
                onClick={() => onAssignDefault(team.id)}
                className="rounded-md border border-neutral-700 hover:bg-neutral-800 px-3 py-1.5 text-xs"
              >
                Asignar &ldquo;Firma X&rdquo;
              </button>
            )}
            <button
              onClick={() => onDelete(team.id)}
              className="rounded-md border border-red-800 hover:bg-red-950/40 text-red-300 px-3 py-1.5 text-xs"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
      {localError && (
        <p className="text-xs text-red-400">{localError}</p>
      )}
      <p className="text-xs text-neutral-400 pl-1">
        {team.members.map((m) => m.nickname).join(", ")}
      </p>
    </li>
  );
}

export default function AdminEquipos() {
  const authState = useAuth({ requireAdmin: true });
  const token = authState.status === "authenticated" ? authState.token : null;

  const [teams, setTeams] = useState<TeamOut[]>([]);
  const [proposals, setProposals] = useState<ProposalOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<GenerateTeamsResult | null>(null);
  const [action, setAction] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [teamsRes, proposalsRes] = await Promise.all([
        api.adminListTeams(token),
        api.adminListPendingProposals(token),
      ]);
      setTeams(teamsRes);
      setProposals(proposalsRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) reload();
  }, [token, reload]);

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const form = new FormData(event.currentTarget);
    const tamanoStr = String(form.get("tamano_preferido") ?? "4");
    const tamano = tamanoStr === "3" ? 3 : 4;
    const dryRun = form.get("dry_run") === "on";
    setAction("Generando…");
    setError(null);
    try {
      const res = await api.adminGenerateTeams(token, {
        tamano_preferido: tamano,
        dry_run: dryRun,
      });
      setGenResult(res);
      if (!dryRun) await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setAction(null);
    }
  }

  async function handleApprove(proposalId: number) {
    if (!token) return;
    setAction(`Aprobando #${proposalId}…`);
    try {
      await api.adminApproveProposal(token, proposalId);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setAction(null);
    }
  }

  async function handleReject(proposalId: number) {
    if (!token) return;
    const nota = window.prompt("Nota para el equipo (opcional):") ?? undefined;
    setAction(`Rechazando #${proposalId}…`);
    try {
      await api.adminRejectProposal(token, proposalId, nota || undefined);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setAction(null);
    }
  }

  async function handleAssignDefault(teamId: number) {
    if (!token) return;
    if (!window.confirm(`¿Asignar nombre por defecto al equipo #${teamId}?`)) return;
    setAction(`Asignando nombre a #${teamId}…`);
    try {
      await api.adminAssignDefaultName(token, teamId);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setAction(null);
    }
  }

  async function handleRename(teamId: number, nombre: string) {
    if (!token) return;
    setAction(`Renombrando #${teamId}…`);
    try {
      await api.adminRenameTeam(token, teamId, nombre);
      await reload();
    } finally {
      setAction(null);
    }
    // Nota: no capturamos el error acá; TeamRow lo muestra inline.
  }

  async function handleDelete(teamId: number) {
    if (!token) return;
    if (!window.confirm(`¿Eliminar el equipo #${teamId}? Se pierden sus propuestas de nombre.`)) return;
    setAction(`Eliminando #${teamId}…`);
    try {
      await api.adminDeleteTeam(token, teamId);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setAction(null);
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
    <main className="min-h-screen max-w-4xl mx-auto p-8 space-y-8">
      <header className="space-y-1">
        <Link href="/inicio" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Regresar al inicio
        </Link>
        <h1 className="text-3xl font-semibold">Admin · Equipos</h1>
        <p className="text-neutral-400 text-sm">
          Generación de equipos y moderación de nombres de firma.
        </p>
      </header>

      {error && (
        <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {action && <p className="text-sm text-neutral-500">{action}</p>}

      {/* Generador */}
      <section className="rounded-lg border border-surface-border bg-surface-raised p-6 space-y-4">
        <h2 className="text-lg font-semibold">Generar equipos</h2>
        <p className="text-xs text-neutral-500">
          Toma cuentas activas sin equipo asignado y las distribuye. El balance
          por perfil se aplica cuando el test de perfil esté implementado.
        </p>
        <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-4">
          <label className="space-y-1">
            <span className="block text-xs text-neutral-400">Tamaño preferido</span>
            <select
              name="tamano_preferido"
              defaultValue="4"
              className="rounded-md border border-surface-border bg-surface px-3 py-2 text-sm"
            >
              <option value="4">4 integrantes</option>
              <option value="3">3 integrantes</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" name="dry_run" className="h-4 w-4 accent-ibero-red" />
            <span>Solo simular (dry-run)</span>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-ibero-red hover:bg-ibero-red-dark px-5 py-2 text-sm font-medium"
          >
            Generar
          </button>
        </form>
        {genResult && (
          <div className="rounded-md border border-surface-border/60 bg-surface p-3 text-xs text-neutral-300 space-y-1">
            <p>
              Total alumnos disponibles: {genResult.total_alumnos_disponibles} · Equipos:{" "}
              {genResult.equipos_generados} · Tamaños: [{genResult.tamanos.join(", ")}]
            </p>
            {genResult.warnings.map((w, i) => (
              <p key={i} className="text-amber-300">
                ⚠ {w}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* Propuestas pendientes */}
      <section className="rounded-lg border border-surface-border bg-surface-raised p-6 space-y-4">
        <h2 className="text-lg font-semibold">
          Propuestas de nombre pendientes ({proposals.length})
        </h2>
        {proposals.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay propuestas pendientes.</p>
        ) : (
          <ul className="divide-y divide-surface-border/60">
            {proposals.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white truncate">&ldquo;{p.propuesta}&rdquo;</p>
                  <p className="text-xs text-neutral-500">
                    Equipo #{p.team_id} · propuso user #{p.propuesto_por} ·{" "}
                    {new Date(p.created_at).toLocaleString("es-MX")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(p.id)}
                    className="rounded-md bg-emerald-800 hover:bg-emerald-700 px-3 py-1.5 text-xs font-medium"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleReject(p.id)}
                    className="rounded-md border border-neutral-700 hover:bg-neutral-800 px-3 py-1.5 text-xs"
                  >
                    Rechazar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Lista de equipos */}
      <section className="rounded-lg border border-surface-border bg-surface-raised p-6 space-y-4">
        <h2 className="text-lg font-semibold">Equipos existentes ({teams.length})</h2>
        {loading && <p className="text-sm text-neutral-500">Cargando…</p>}
        {!loading && teams.length === 0 && (
          <p className="text-sm text-neutral-500">Aún no hay equipos creados.</p>
        )}
        <ul className="divide-y divide-surface-border/60">
          {teams.map((t) => (
            <TeamRow
              key={t.id}
              team={t}
              onRename={handleRename}
              onAssignDefault={handleAssignDefault}
              onDelete={handleDelete}
              disabled={action !== null}
            />
          ))}
        </ul>
      </section>
    </main>
  );
}
