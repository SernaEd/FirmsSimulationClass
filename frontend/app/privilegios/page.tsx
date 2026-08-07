"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  PrivilegeCatalogOut,
  TicketOut,
  api,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

type Confirm =
  | { kind: "closed" }
  | { kind: "open"; entry: PrivilegeCatalogOut }
  | { kind: "submitting"; entry: PrivilegeCatalogOut }
  | { kind: "success"; entry: PrivilegeCatalogOut; ticket: TicketOut }
  | { kind: "error"; entry: PrivilegeCatalogOut; message: string };

export default function Privilegios() {
  const authState = useAuth();
  const token = authState.status === "authenticated" ? authState.token : null;

  const [entries, setEntries] = useState<PrivilegeCatalogOut[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>({ kind: "closed" });

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [privs, bal] = await Promise.all([
        api.listPrivileges(token),
        api.myTokens(token),
      ]);
      setEntries(privs);
      setBalance(bal.balance);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const grouped = useMemo(() => {
    const map = new Map<string, PrivilegeCatalogOut[]>();
    for (const e of entries) {
      const key = e.categoria ?? "otros";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    for (const list of map.values()) list.sort((a, b) => a.costo - b.costo);
    const orderedKeys = [
      ...CATEGORY_ORDER.filter((k) => map.has(k)),
      ...[...map.keys()].filter((k) => !CATEGORY_ORDER.includes(k)),
    ];
    return orderedKeys.map((k) => ({ key: k, items: map.get(k)! }));
  }, [entries]);

  async function confirmPurchase() {
    if (!token || confirm.kind !== "open") return;
    const entry = confirm.entry;
    setConfirm({ kind: "submitting", entry });
    try {
      const ticket = await api.purchasePrivilege(token, entry.id);
      setConfirm({ kind: "success", entry, ticket });
      // Refrescar saldo
      const bal = await api.myTokens(token);
      setBalance(bal.balance);
    } catch (err) {
      setConfirm({
        kind: "error",
        entry,
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
    <main className="min-h-screen max-w-3xl mx-auto p-8 space-y-6">
      <header className="space-y-1">
        <Link href="/inicio" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Regresar al inicio
        </Link>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h1 className="text-3xl font-semibold">Catálogo de privilegios</h1>
          <p className="text-sm text-neutral-400">
            Saldo:{" "}
            <span className="tabular-nums font-semibold text-white">
              {balance ?? "—"}
            </span>{" "}
            Tks
          </p>
        </div>
        <p className="text-neutral-400 text-sm">
          Canjea tus Tokens por privilegios académicos. Las compras generan un
          ticket con folio único que debes mostrar al profesor al usarlo.
        </p>
      </header>

      {error && (
        <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading && <p className="text-neutral-500 text-sm">Cargando catálogo…</p>}

      {!loading && grouped.length === 0 && !error && (
        <p className="text-sm text-neutral-500">
          Aún no hay privilegios visibles en el catálogo. Pídele al profesor
          que lo configure desde el panel administrativo.
        </p>
      )}

      {grouped.map((group) => (
        <section key={group.key} className="space-y-2">
          <h2 className="text-lg font-semibold text-neutral-300">
            {CATEGORY_LABEL[group.key] ?? group.key}
          </h2>
          <div className="grid gap-2">
            {group.items.map((e) => (
              <PrivilegeCard
                key={e.id}
                entry={e}
                balance={balance}
                onBuy={() => setConfirm({ kind: "open", entry: e })}
              />
            ))}
          </div>
        </section>
      ))}

      {confirm.kind !== "closed" && (
        <ConfirmDialog
          confirm={confirm}
          balance={balance}
          onCancel={() => setConfirm({ kind: "closed" })}
          onConfirm={confirmPurchase}
        />
      )}

      <footer className="text-xs text-neutral-500 pt-4 border-t border-surface-border">
        Los privilegios grupales (Split Bill) llegan en el siguiente commit
        (3.3).
      </footer>
    </main>
  );
}

function PrivilegeCard({
  entry,
  balance,
  onBuy,
}: {
  entry: PrivilegeCatalogOut;
  balance: number | null;
  onBuy: () => void;
}) {
  const canAfford = balance !== null && balance >= entry.costo;
  const disabledReason =
    entry.es_grupal
      ? "Split Bill · disponible en la próxima entrega"
      : !canAfford
        ? "Saldo insuficiente"
        : null;

  return (
    <div className="rounded-lg border border-surface-border bg-surface-raised p-4 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-white text-sm font-medium">{entry.nombre}</p>
        {entry.descripcion && (
          <p className="text-xs text-neutral-400">{entry.descripcion}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-neutral-500">
            {formatLimits(entry.limites_config)}
          </span>
          {entry.es_grupal && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-950/50 border border-blue-800/60 text-blue-300">
              Grupal
            </span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 space-y-1">
        <p className="text-xl font-semibold tabular-nums">
          {entry.costo}
          <span className="text-xs font-normal text-neutral-400 ml-1">Tks</span>
        </p>
        <button
          onClick={onBuy}
          disabled={!!disabledReason}
          className="text-xs rounded-md bg-ibero-red hover:bg-ibero-red-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-3 py-1.5 text-white font-medium"
          title={disabledReason ?? undefined}
        >
          {entry.es_grupal ? "Iniciar Split Bill" : "Comprar"}
        </button>
      </div>
    </div>
  );
}

function ConfirmDialog({
  confirm,
  balance,
  onCancel,
  onConfirm,
}: {
  confirm: Exclude<Confirm, { kind: "closed" }>;
  balance: number | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { entry } = confirm;
  const afterBalance = balance !== null ? balance - entry.costo : null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full rounded-lg border border-surface-border bg-surface-raised p-6 space-y-4">
        <h3 className="text-lg font-semibold">Confirmar compra</h3>

        <div className="space-y-2 text-sm">
          <p className="text-neutral-300">{entry.nombre}</p>
          {entry.descripcion && (
            <p className="text-neutral-400 text-xs">{entry.descripcion}</p>
          )}
        </div>

        <div className="rounded-md border border-surface-border/60 bg-surface p-3 text-sm space-y-1 tabular-nums">
          <div className="flex justify-between">
            <span className="text-neutral-400">Costo</span>
            <span>{entry.costo} Tks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Saldo actual</span>
            <span>{balance ?? "—"} Tks</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-surface-border/60">
            <span className="text-neutral-400">Saldo después</span>
            <span
              className={
                afterBalance !== null && afterBalance < 0
                  ? "text-red-400"
                  : "text-emerald-400"
              }
            >
              {afterBalance ?? "—"} Tks
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          La compra es irreversible. Se generará un ticket con folio único que
          debes mostrar al profesor al momento de usarlo (§5.4).
        </p>

        {confirm.kind === "error" && (
          <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
            {confirm.message}
          </p>
        )}

        {confirm.kind === "success" && (
          <div className="rounded-md border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-200 space-y-2">
            <p className="font-medium">Compra exitosa</p>
            <p className="text-xs">
              Folio:{" "}
              <code className="font-mono text-emerald-300">
                {confirm.ticket.folio}
              </code>
            </p>
            <Link
              href="/mis-tickets"
              className="inline-block text-xs underline text-emerald-300 hover:text-white"
            >
              Ver en mis tickets →
            </Link>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {confirm.kind === "success" ? (
            <button
              onClick={onCancel}
              className="rounded-md border border-surface-border hover:bg-surface px-4 py-2 text-sm"
            >
              Cerrar
            </button>
          ) : (
            <>
              <button
                onClick={onCancel}
                disabled={confirm.kind === "submitting"}
                className="rounded-md border border-surface-border hover:bg-surface px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={
                  confirm.kind === "submitting" ||
                  (afterBalance !== null && afterBalance < 0)
                }
                className="rounded-md bg-ibero-red hover:bg-ibero-red-dark disabled:opacity-50 px-4 py-2 text-sm font-medium"
              >
                {confirm.kind === "submitting" ? "Comprando…" : "Confirmar compra"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatLimits(limits: Record<string, number> | null): string {
  if (!limits || Object.keys(limits).length === 0) return "Sin límite explícito";
  const parts: string[] = [];
  const map: Record<string, string> = {
    por_semestre: "por semestre",
    por_tarea: "por tarea",
    por_examen: "por examen",
    por_modulo: "por módulo",
    por_proyecto: "por proyecto",
  };
  for (const [k, v] of Object.entries(limits)) {
    const label = map[k] ?? k;
    parts.push(`máx. ${v} ${label}`);
  }
  return parts.join(" · ");
}
