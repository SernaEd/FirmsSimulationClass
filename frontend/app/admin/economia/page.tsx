"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  DecimalRedemptionOut,
  TicketOut,
  UserOut,
  api,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

function TicketRow({
  ticket,
  onConsume,
  onCancel,
}: {
  ticket: TicketOut;
  onConsume: (folio: string) => Promise<void>;
  onCancel: (ticketId: number) => Promise<void>;
}) {
  const [busy, setBusy] = useState<null | "consume" | "cancel">(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleConsume() {
    setBusy("consume");
    setLocalError(null);
    try {
      await onConsume(ticket.folio);
    } catch (err) {
      setLocalError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    if (!confirm("¿Seguro que deseas cancelar este ticket y reembolsar el saldo? Esta acción no se puede deshacer.")) return;
    setBusy("cancel");
    setLocalError(null);
    try {
      await onCancel(ticket.id);
    } catch (err) {
      setLocalError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-md border border-surface-border bg-surface p-4 space-y-2">
      <div className="flex justify-between gap-4 flex-wrap">
        <div>
          <p className="text-lg font-mono tracking-wider font-bold text-white">
            {ticket.folio}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {ticket.catalog_name ?? `Privilegio #${ticket.catalog_id}`} · Creado: {new Date(ticket.created_at).toLocaleDateString("es-MX")}
          </p>
          <p className="text-xs text-neutral-500">
            Iniciado por: {ticket.initiator_name ?? `Usuario #${ticket.initiator_user_id}`}
            {ticket.team_id && ` · Equipo #${ticket.team_id}`}
          </p>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          <button
            onClick={handleConsume}
            disabled={busy !== null}
            className="rounded-md bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-white transition-colors"
          >
            {busy === "consume" ? "Procesando…" : "Marcar Usado"}
          </button>
          <button
            onClick={handleCancel}
            disabled={busy !== null}
            className="rounded-md border border-red-800 hover:bg-red-950/40 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors"
          >
            {busy === "cancel" ? "Procesando…" : "Reembolsar"}
          </button>
        </div>
      </div>
      {localError && (
        <p className="text-xs text-red-400 mt-2">{localError}</p>
      )}
    </div>
  );
}

function DecimalRow({
  req,
  onResolve,
}: {
  req: DecimalRedemptionOut;
  onResolve: (id: number, approve: boolean, note?: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);
  const [nota, setNota] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleResolve(approve: boolean) {
    setBusy(approve ? "approve" : "reject");
    setLocalError(null);
    try {
      await onResolve(req.id, approve, nota.trim() || undefined);
    } catch (err) {
      setLocalError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-md border border-surface-border bg-surface p-4 space-y-3">
      <div className="flex justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">
            {req.entrega_descripcion}
          </p>
          {req.entrega_ref && (
            <a
              href={req.entrega_ref.startsWith("http") ? req.entrega_ref : `https://${req.entrega_ref}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:underline block"
            >
              Ver entrega / ref
            </a>
          )}
          <p className="text-xs text-neutral-400 mt-1">
            {req.user_name ?? `Usuario #${req.user_id}`} · Costo: {req.pts_costo} Tks
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-amber-200">
            +{req.decimas_solicitadas} décimas
          </p>
          <p className="text-[10px] text-neutral-500">
            Fecha: {new Date(req.created_at).toLocaleDateString("es-MX")}
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-surface-border/50">
        <input
          type="text"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Nota para el alumno (opcional)..."
          className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-ibero-red focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleResolve(true)}
            disabled={busy !== null}
            className="flex-1 rounded-md bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-white transition-colors"
          >
            {busy === "approve" ? "Procesando…" : "Aprobar"}
          </button>
          <button
            onClick={() => handleResolve(false)}
            disabled={busy !== null}
            className="flex-1 rounded-md border border-red-800 hover:bg-red-950/40 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors"
          >
            {busy === "reject" ? "Procesando…" : "Rechazar (Reembolsar)"}
          </button>
        </div>
        {localError && (
          <p className="text-xs text-red-400 text-center">{localError}</p>
        )}
      </div>
    </div>
  );
}

export default function AdminEconomiaPage() {
  const authState = useAuth();
  const token = authState.status === "authenticated" ? authState.token : null;

  const [tickets, setTickets] = useState<TicketOut[]>([]);
  const [decimals, setDecimals] = useState<DecimalRedemptionOut[]>([]);
  const [users, setUsers] = useState<UserOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [tList, dList, uList] = await Promise.all([
        api.adminListTickets(token, ["emitted"]),
        api.adminListPendingDecimals(token),
        api.adminListUsers(token),
      ]);
      setTickets(tList);
      setDecimals(dList);
      setUsers(uList);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadData();
  }, [token, loadData]);

  if (authState.status === "loading") {
    return <div className="p-8 text-neutral-500">Cargando sesión…</div>;
  }
  if (authState.status === "unauthenticated") {
    return <div className="p-8 text-red-400">Debes iniciar sesión.</div>;
  }
  if (!authState.user?.is_admin) {
    return <div className="p-8 text-red-400">No tienes acceso de administrador.</div>;
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 space-y-8">
      <header className="space-y-1 mt-4">
        <Link href="/inicio" className="text-sm text-neutral-400 hover:text-white">
          ← Volver al inicio
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-ibero-red pt-4">
          Admin · Economía
        </h1>
        <p className="text-sm text-neutral-400">
          Modera los tickets emitidos y aprueba canjes por décimas.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-neutral-500">Cargando datos…</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <div className="space-y-8">
          {/* SECCIÓN 1: TICKETS */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface-border pb-2">
              Privilegios Físicos (Tickets Emitidos)
            </h2>
            {tickets.length === 0 ? (
              <p className="text-sm text-neutral-500 bg-surface rounded-md p-4 text-center border border-surface-border">
                No hay tickets pendientes de uso en este momento.
              </p>
            ) : (
              <div className="grid gap-3">
                {tickets.map((t) => (
                  <TicketRow
                    key={t.id}
                    ticket={t}
                    onConsume={async (folio) => {
                      await api.adminConsumeTicket(token!, folio);
                      await loadData();
                    }}
                    onCancel={async (id) => {
                      await api.adminCancelTicket(token!, id);
                      await loadData();
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* SECCIÓN 2: DÉCIMAS */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface-border pb-2">
              Solicitudes de Décimas
            </h2>
            {decimals.length === 0 ? (
              <p className="text-sm text-neutral-500 bg-surface rounded-md p-4 text-center border border-surface-border">
                No hay solicitudes pendientes.
              </p>
            ) : (
              <div className="grid gap-3">
                {decimals.map((req) => (
                  <DecimalRow
                    key={req.id}
                    req={req}
                    onResolve={async (id, approve, nota) => {
                      if (approve) {
                        await api.adminApproveDecimal(token!, id, nota);
                      } else {
                        await api.adminRejectDecimal(token!, id, nota);
                      }
                      await loadData();
                    }}
                  />
                ))}
              </div>
            )}
          </section>
          {/* SECCIÓN 3: AJUSTE MANUAL */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface-border pb-2">
              Ajuste Manual de Tokens
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const userId = Number(formData.get("userId"));
                const delta = Number(formData.get("delta"));
                const nota = String(formData.get("nota"));

                if (!userId || !delta || !nota.trim()) {
                  alert("Todos los campos son obligatorios. Delta no puede ser cero.");
                  return;
                }

                try {
                  await api.adminAdjustTokens(token!, { user_id: userId, delta, nota });
                  alert("Ajuste realizado con éxito.");
                  e.currentTarget.reset();
                } catch (err) {
                  alert(err instanceof ApiError ? err.detail : String(err));
                }
              }}
              className="rounded-md border border-surface-border bg-surface p-4 space-y-3"
            >
              <div className="flex gap-4">
                <label className="flex-1 space-y-1">
                  <span className="text-xs font-medium text-neutral-300">Alumno</span>
                  <select
                    name="userId"
                    required
                    className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Selecciona un alumno...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} {u.apellidos} ({u.nickname})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex-1 space-y-1">
                  <span className="text-xs font-medium text-neutral-300">Monto (Tokens)</span>
                  <input
                    name="delta"
                    type="number"
                    required
                    className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none"
                    placeholder="Ej. 10 o -5"
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-neutral-300">Nota (Obligatoria)</span>
                <input
                  name="nota"
                  type="text"
                  required
                  className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none"
                  placeholder="Motivo del ajuste..."
                />
              </label>
              <button
                type="submit"
                className="rounded-md bg-white text-black hover:bg-neutral-200 px-4 py-2 text-sm font-medium transition-colors"
              >
                Aplicar Ajuste
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
