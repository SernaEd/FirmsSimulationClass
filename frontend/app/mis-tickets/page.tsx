"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  PrivilegeCatalogOut,
  TICKET_STATUS_LABEL,
  TicketOut,
  TicketStatus,
  api,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

const ACTIVE_STATES: TicketStatus[] = ["funding", "emitted"];

export default function MisTickets() {
  const authState = useAuth();
  const token = authState.status === "authenticated" ? authState.token : null;

  const [tickets, setTickets] = useState<TicketOut[]>([]);
  const [catalog, setCatalog] = useState<Map<number, PrivilegeCatalogOut>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [ts, cat] = await Promise.all([
        api.myTickets(token),
        api.listPrivileges(token),
      ]);
      setTickets(ts);
      const map = new Map<number, PrivilegeCatalogOut>();
      for (const c of cat) map.set(c.id, c);
      setCatalog(map);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const { active, history } = useMemo(() => {
    const active: TicketOut[] = [];
    const history: TicketOut[] = [];
    for (const t of tickets) {
      (ACTIVE_STATES.includes(t.estado) ? active : history).push(t);
    }
    return { active, history };
  }, [tickets]);

  if (authState.status !== "authenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-3xl mx-auto p-8 space-y-6">
      <header className="space-y-1">
        <Link
          href="/inicio"
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          ← Regresar al inicio
        </Link>
        <h1 className="text-3xl font-semibold">Mis tickets</h1>
        <p className="text-neutral-400 text-sm">
          Tickets de privilegios comprados. Muestra el folio al profesor al
          momento de usar el privilegio.
        </p>
      </header>

      {error && (
        <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading && <p className="text-neutral-500 text-sm">Cargando tickets…</p>}

      {!loading && tickets.length === 0 && (
        <section className="rounded-lg border border-surface-border bg-surface-raised p-6 text-center space-y-2">
          <p className="text-neutral-300">Aún no tienes tickets.</p>
          <Link
            href="/privilegios"
            className="inline-block text-sm underline text-neutral-400 hover:text-white"
          >
            Explorar catálogo de privilegios →
          </Link>
        </section>
      )}

      {active.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Activos</h2>
          <div className="grid gap-2">
            {active.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                catalog={catalog.get(t.catalog_id) ?? null}
                expanded={expandedId === t.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === t.id ? null : t.id))
                }
              />
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-neutral-400">Historial</h2>
          <div className="grid gap-2">
            {history.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                catalog={catalog.get(t.catalog_id) ?? null}
                expanded={expandedId === t.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === t.id ? null : t.id))
                }
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function TicketCard({
  ticket,
  catalog,
  expanded,
  onToggle,
}: {
  ticket: TicketOut;
  catalog: PrivilegeCatalogOut | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={
        "rounded-lg border transition-colors " +
        (ticket.estado === "emitted"
          ? "border-emerald-800/60 bg-emerald-950/20"
          : ticket.estado === "funding"
            ? "border-amber-800/60 bg-amber-950/20"
            : "border-surface-border bg-surface-raised")
      }
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-center justify-between gap-3"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white truncate">
            {catalog?.nombre ?? `Privilegio #${ticket.catalog_id}`}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            <StatusBadge estado={ticket.estado} /> · folio{" "}
            <code className="font-mono">{ticket.folio}</code>
          </p>
        </div>
        <div className="text-right shrink-0 text-xs text-neutral-400">
          <p className="tabular-nums">
            {ticket.pagado_total}/{ticket.costo_total} Tks
          </p>
          <p>{expanded ? "▲" : "▼"}</p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-surface-border/60 p-4 space-y-4">
          {/* Folio grande para mostrar al profesor */}
          <div className="rounded-md bg-surface p-4 text-center">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">
              Folio (mostrar al profesor)
            </p>
            <p className="font-mono text-3xl tracking-wider mt-2 select-all">
              {ticket.folio}
            </p>
          </div>

          {/* Detalles */}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            <dt className="text-neutral-500">Estado</dt>
            <dd>
              <StatusBadge estado={ticket.estado} />
            </dd>
            {catalog?.descripcion && (
              <>
                <dt className="text-neutral-500">Descripción</dt>
                <dd className="text-neutral-300">{catalog.descripcion}</dd>
              </>
            )}
            <dt className="text-neutral-500">Costo</dt>
            <dd className="tabular-nums">{ticket.costo_total} Tks</dd>
            <dt className="text-neutral-500">Pagado</dt>
            <dd className="tabular-nums">{ticket.pagado_total} Tks</dd>
            <dt className="text-neutral-500">Creado</dt>
            <dd>{formatDateTime(ticket.created_at)}</dd>
            {ticket.emitido_at && (
              <>
                <dt className="text-neutral-500">Emitido</dt>
                <dd>{formatDateTime(ticket.emitido_at)}</dd>
              </>
            )}
            {ticket.consumido_at && (
              <>
                <dt className="text-neutral-500">Consumido</dt>
                <dd>{formatDateTime(ticket.consumido_at)}</dd>
              </>
            )}
            {ticket.cancelled_at && (
              <>
                <dt className="text-neutral-500">Cancelado</dt>
                <dd>{formatDateTime(ticket.cancelled_at)}</dd>
              </>
            )}
            {ticket.team_id !== null && (
              <>
                <dt className="text-neutral-500">Split Bill</dt>
                <dd>Equipo #{ticket.team_id}</dd>
              </>
            )}
          </dl>

          {ticket.contribuciones.length > 1 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                Contribuciones
              </p>
              <ul className="text-xs text-neutral-300 space-y-0.5">
                {ticket.contribuciones.map((c) => (
                  <li key={c.id} className="flex justify-between">
                    <span>Usuario #{c.user_id}</span>
                    <span className="tabular-nums">
                      {c.amount} Tks
                      {c.refunded_at && (
                        <span className="text-red-400 ml-1">(reembolsado)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ticket.estado === "funding" && (
            <p className="text-xs text-amber-300">
              Ticket en financiamiento. En el próximo commit (3.3) podrás aportar
              y cancelar desde aquí.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ estado }: { estado: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    funding: "bg-amber-900/60 text-amber-300",
    emitted: "bg-emerald-900/60 text-emerald-300",
    consumed: "bg-neutral-800 text-neutral-400",
    cancelled: "bg-red-950/60 text-red-300",
    expired: "bg-neutral-800 text-neutral-500",
  };
  return (
    <span
      className={
        "inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded " +
        styles[estado]
      }
    >
      {TICKET_STATUS_LABEL[estado]}
    </span>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
