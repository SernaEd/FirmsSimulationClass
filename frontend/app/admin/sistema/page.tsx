"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  INBOX_TYPE_LABEL,
  InboxItemOut,
  InboxItemType,
  InboxPriority,
  SystemFlagOut,
  api,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

// ---------------------------------------------------------------------------
// Sección 1: Inbox de Aprobaciones
// ---------------------------------------------------------------------------

const PRIORITY_STYLE: Record<InboxPriority, string> = {
  alta: "border-red-800/60 bg-red-950/20",
  media: "border-amber-800/60 bg-amber-950/10",
  baja: "border-surface-border bg-surface",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function InboxRow({
  item,
  onApproveUser,
  onRejectUser,
  onApproveProposal,
  onRejectProposal,
  onSnooze,
  onDismiss,
  onMarkSeen,
}: {
  item: InboxItemOut;
  onApproveUser: (userId: number) => Promise<void>;
  onRejectUser: (userId: number) => Promise<void>;
  onApproveProposal: (proposalId: number) => Promise<void>;
  onRejectProposal: (proposalId: number) => Promise<void>;
  onSnooze: (itemId: number, until: string) => Promise<void>;
  onDismiss: (itemId: number, nota: string) => Promise<void>;
  onMarkSeen: (itemId: number) => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [snoozeUntil, setSnoozeUntil] = useState("");
  const [dismissNota, setDismissNota] = useState("");

  async function run(action: string, fn: () => Promise<void>) {
    setBusy(action);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(null);
    }
  }

  const payload = item.payload_json ?? {};

  return (
    <div className={"rounded-md border p-4 space-y-3 " + PRIORITY_STYLE[item.prioridad]}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-neutral-400">
            {INBOX_TYPE_LABEL[item.tipo]}
            <span
              className={
                "ml-2 px-1.5 py-0.5 rounded text-[10px] " +
                (item.prioridad === "alta"
                  ? "bg-red-900/60 text-red-300"
                  : item.prioridad === "media"
                    ? "bg-amber-900/60 text-amber-300"
                    : "bg-neutral-800 text-neutral-400")
              }
            >
              {item.prioridad}
            </span>
          </p>
          <p className="text-[11px] text-neutral-500">{timeAgo(item.created_at)}</p>
        </div>
      </div>

      {/* Contenido específico por tipo */}
      {item.tipo === "registro" ? (
        <div className="space-y-2">
          <p className="text-sm text-white">
            {String(payload.nombre ?? "")} {String(payload.apellidos ?? "")}{" "}
            <span className="text-neutral-500">
              (@{String(payload.nickname ?? "")} · {String(payload.numero_cuenta ?? "")})
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                run("approve", () => onApproveUser(item.referencia_id!))
              }
              disabled={busy !== null}
              className="rounded-md bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-white"
            >
              {busy === "approve" ? "…" : "Aprobar cuenta"}
            </button>
            <button
              onClick={() => run("reject", () => onRejectUser(item.referencia_id!))}
              disabled={busy !== null}
              className="rounded-md border border-red-800 hover:bg-red-950/40 disabled:opacity-50 px-3 py-1.5 text-xs text-red-300"
            >
              {busy === "reject" ? "…" : "Rechazar"}
            </button>
          </div>
        </div>
      ) : item.tipo === "nombre_firma" ? (
        <div className="space-y-2">
          <p className="text-sm text-white">
            Equipo #{String(payload.team_id ?? "")}: &ldquo;{String(payload.propuesta ?? "")}
            &rdquo;{" "}
            <span className="text-neutral-500">
              — propuesto por @{String(payload.propuesto_por_nickname ?? "")}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                run("approve", () => onApproveProposal(item.referencia_id!))
              }
              disabled={busy !== null}
              className="rounded-md bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-white"
            >
              {busy === "approve" ? "…" : "Aprobar nombre"}
            </button>
            <button
              onClick={() =>
                run("reject", () => onRejectProposal(item.referencia_id!))
              }
              disabled={busy !== null}
              className="rounded-md border border-red-800 hover:bg-red-950/40 disabled:opacity-50 px-3 py-1.5 text-xs text-red-300"
            >
              {busy === "reject" ? "…" : "Rechazar"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {Object.entries(payload).map(([k, v]) => (
            <p key={k} className="text-xs text-neutral-400">
              <span className="text-neutral-500">{k}:</span> {String(v)}
            </p>
          ))}
          {Object.keys(payload).length === 0 && (
            <p className="text-xs text-neutral-500">Sin datos adicionales.</p>
          )}
        </div>
      )}

      {/* Acciones genéricas (fallback para cualquier tipo) */}
      <div className="pt-2 border-t border-surface-border/40">
        <button
          onClick={() => setShowMore((v) => !v)}
          className="text-xs text-neutral-500 hover:text-neutral-300"
        >
          {showMore ? "▲ Menos acciones" : "▼ Más acciones (posponer / descartar / marcar visto)"}
        </button>
        {showMore && (
          <div className="mt-2 space-y-2">
            <div className="flex items-end gap-2 flex-wrap">
              <label className="space-y-1">
                <span className="text-[10px] text-neutral-500 block">Posponer hasta</span>
                <input
                  type="datetime-local"
                  value={snoozeUntil}
                  onChange={(e) => setSnoozeUntil(e.target.value)}
                  className="rounded-md border border-surface-border bg-surface px-2 py-1 text-xs text-white"
                />
              </label>
              <button
                onClick={() =>
                  snoozeUntil &&
                  run("snooze", () =>
                    onSnooze(item.id, new Date(snoozeUntil).toISOString()),
                  )
                }
                disabled={busy !== null || !snoozeUntil}
                className="rounded-md border border-surface-border hover:bg-neutral-800 disabled:opacity-50 px-3 py-1 text-xs"
              >
                Posponer
              </button>
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              <label className="space-y-1 flex-1 min-w-[200px]">
                <span className="text-[10px] text-neutral-500 block">
                  Nota para descartar
                </span>
                <input
                  type="text"
                  value={dismissNota}
                  onChange={(e) => setDismissNota(e.target.value)}
                  placeholder="Motivo…"
                  className="w-full rounded-md border border-surface-border bg-surface px-2 py-1 text-xs text-white"
                />
              </label>
              <button
                onClick={() =>
                  dismissNota.trim() &&
                  run("dismiss", () => onDismiss(item.id, dismissNota.trim()))
                }
                disabled={busy !== null || !dismissNota.trim()}
                className="rounded-md border border-red-800 hover:bg-red-950/40 disabled:opacity-50 px-3 py-1 text-xs text-red-300"
              >
                Descartar
              </button>
            </div>
            <button
              onClick={() => run("seen", () => onMarkSeen(item.id))}
              disabled={busy !== null}
              className="rounded-md border border-surface-border hover:bg-neutral-800 disabled:opacity-50 px-3 py-1 text-xs"
            >
              Marcar como visto
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function InboxSection({
  items,
  onApproveUser,
  onRejectUser,
  onApproveProposal,
  onRejectProposal,
  onSnooze,
  onDismiss,
  onMarkSeen,
}: {
  items: InboxItemOut[];
  onApproveUser: (userId: number) => Promise<void>;
  onRejectUser: (userId: number) => Promise<void>;
  onApproveProposal: (proposalId: number) => Promise<void>;
  onRejectProposal: (proposalId: number) => Promise<void>;
  onSnooze: (itemId: number, until: string) => Promise<void>;
  onDismiss: (itemId: number, nota: string) => Promise<void>;
  onMarkSeen: (itemId: number) => Promise<void>;
}) {
  const [filterTipos, setFilterTipos] = useState<Set<InboxItemType>>(new Set());
  const [filterPrioridades, setFilterPrioridades] = useState<Set<InboxPriority>>(new Set());

  const presentTipos = useMemo(
    () => Array.from(new Set(items.map((i) => i.tipo))),
    [items],
  );

  const filtered = items.filter(
    (i) =>
      (filterTipos.size === 0 || filterTipos.has(i.tipo)) &&
      (filterPrioridades.size === 0 || filterPrioridades.has(i.prioridad)),
  );

  function toggleSet<T>(set: Set<T>, setter: (s: Set<T>) => void, value: T) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-surface-border pb-2 flex-wrap gap-2">
        <h2 className="text-lg font-semibold">
          Inbox de Aprobaciones ({items.length})
        </h2>
      </div>

      {presentTipos.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {presentTipos.map((t) => (
            <button
              key={t}
              onClick={() => toggleSet(filterTipos, setFilterTipos, t)}
              className={
                "px-2.5 py-1 rounded-md text-xs " +
                (filterTipos.has(t)
                  ? "bg-ibero-red text-white"
                  : "bg-surface hover:bg-surface-border text-neutral-300")
              }
            >
              {INBOX_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-neutral-500 bg-surface rounded-md p-4 text-center border border-surface-border">
          No hay items pendientes en el Inbox. 🎉
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((item) => (
            <InboxRow
              key={item.id}
              item={item}
              onApproveUser={onApproveUser}
              onRejectUser={onRejectUser}
              onApproveProposal={onApproveProposal}
              onRejectProposal={onRejectProposal}
              onSnooze={onSnooze}
              onDismiss={onDismiss}
              onMarkSeen={onMarkSeen}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sección 2: Feature flags
// ---------------------------------------------------------------------------

function FlagRow({
  flagKey,
  flag,
  onSet,
}: {
  flagKey: string;
  flag: SystemFlagOut | null;
  onSet: (key: string, enabled: boolean, description?: string) => Promise<void>;
}) {
  const [description, setDescription] = useState(flag?.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      await onSet(flagKey, !(flag?.enabled ?? false), description || undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(false);
    }
  }

  const enabled = flag?.enabled ?? false;

  return (
    <div className="rounded-md border border-surface-border bg-surface p-4 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-mono text-white">{flagKey}</p>
          {flag && (
            <p className="text-[11px] text-neutral-500">
              Última actualización: {new Date(flag.updated_at).toLocaleString("es-MX")}
            </p>
          )}
          {!flag && (
            <p className="text-[11px] text-amber-400">
              No configurado aún — referenciado por el catálogo, apagado por default.
            </p>
          )}
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          className={
            "rounded-full px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 " +
            (enabled
              ? "bg-emerald-800 hover:bg-emerald-700 text-white"
              : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300")
          }
        >
          {busy ? "…" : enabled ? "Encendido" : "Apagado"}
        </button>
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción / motivo (opcional)…"
        className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-ibero-red focus:outline-none"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function FlagsSection({
  flags,
  knownKeys,
  onSet,
}: {
  flags: SystemFlagOut[];
  knownKeys: string[];
  onSet: (key: string, enabled: boolean, description?: string) => Promise<void>;
}) {
  const configuredKeys = new Set(flags.map((f) => f.key));
  const unconfigured = knownKeys.filter((k) => !configuredKeys.has(k));

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold border-b border-surface-border pb-2">
        Feature flags
      </h2>
      <p className="text-xs text-neutral-500">
        Controlan privilegios sensibles del catálogo (§5.2), como &ldquo;Usar IA
        durante un examen parcial&rdquo;. Ausencia de flag = desactivado por
        default (safe default).
      </p>
      <div className="grid gap-2">
        {flags.map((f) => (
          <FlagRow key={f.key} flagKey={f.key} flag={f} onSet={onSet} />
        ))}
        {unconfigured.map((k) => (
          <FlagRow key={k} flagKey={k} flag={null} onSet={onSet} />
        ))}
        {flags.length === 0 && unconfigured.length === 0 && (
          <p className="text-sm text-neutral-500 bg-surface rounded-md p-4 text-center border border-surface-border">
            No hay privilegios con feature flag en el catálogo actualmente.
          </p>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function AdminSistemaPage() {
  const authState = useAuth({ requireAdmin: true });
  const token = authState.status === "authenticated" ? authState.token : null;

  const [inboxItems, setInboxItems] = useState<InboxItemOut[]>([]);
  const [flags, setFlags] = useState<SystemFlagOut[]>([]);
  const [knownKeys, setKnownKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [inbox, flagsList, known] = await Promise.all([
        api.adminGetInbox(token),
        api.adminListFlags(token),
        api.adminListKnownFlagKeys(token),
      ]);
      setInboxItems(inbox);
      setFlags(flagsList);
      setKnownKeys(known);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadAll();
  }, [token, loadAll]);

  async function reloadInboxOnly() {
    if (!token) return;
    setInboxItems(await api.adminGetInbox(token));
  }

  if (authState.status !== "authenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-4 pb-24 space-y-8">
      <header className="space-y-1 mt-4">
        <Link href="/inicio" className="text-sm text-neutral-400 hover:text-white">
          ← Volver al inicio
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-ibero-red pt-4">
          Admin · Sistema
        </h1>
        <p className="text-sm text-neutral-400">
          Bandeja de aprobaciones y feature flags. Los anuncios y la
          asistencia se manejan directamente en Brightspace.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-neutral-500">Cargando datos…</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <div className="space-y-10">
          <InboxSection
            items={inboxItems}
            onApproveUser={async (userId) => {
              await api.adminApproveUser(token!, userId);
              await reloadInboxOnly();
            }}
            onRejectUser={async (userId) => {
              await api.adminRejectUser(token!, userId);
              await reloadInboxOnly();
            }}
            onApproveProposal={async (proposalId) => {
              await api.adminApproveProposal(token!, proposalId);
              await reloadInboxOnly();
            }}
            onRejectProposal={async (proposalId) => {
              await api.adminRejectProposal(token!, proposalId);
              await reloadInboxOnly();
            }}
            onSnooze={async (itemId, until) => {
              await api.adminInboxSnooze(token!, itemId, until);
              await reloadInboxOnly();
            }}
            onDismiss={async (itemId, nota) => {
              await api.adminInboxDismiss(token!, itemId, nota);
              await reloadInboxOnly();
            }}
            onMarkSeen={async (itemId) => {
              await api.adminInboxMarkSeen(token!, itemId);
              await reloadInboxOnly();
            }}
          />

          <FlagsSection
            flags={flags}
            knownKeys={knownKeys}
            onSet={async (key, enabled, description) => {
              await api.adminSetFlag(token!, key, enabled, description);
              const [flagsList, known] = await Promise.all([
                api.adminListFlags(token!),
                api.adminListKnownFlagKeys(token!),
              ]);
              setFlags(flagsList);
              setKnownKeys(known);
            }}
          />
        </div>
      )}
    </main>
  );
}
