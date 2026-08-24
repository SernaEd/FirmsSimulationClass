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
import { CARD_MD, CARD_SM } from "@/lib/ui";

type Confirm =
  | { kind: "closed" }
  | { kind: "open"; entry: PrivilegeCatalogOut; splitAmount: number }
  | { kind: "submitting"; entry: PrivilegeCatalogOut; splitAmount: number }
  | { kind: "success"; entry: PrivilegeCatalogOut; ticket: TicketOut }
  | { kind: "error"; entry: PrivilegeCatalogOut; splitAmount: number; message: string };

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
    const { entry, splitAmount } = confirm;
    setConfirm({ kind: "submitting", entry, splitAmount });
    try {
      const ticket = entry.es_grupal
        ? await api.initSplitBill(token, entry.id, splitAmount)
        : await api.purchasePrivilege(token, entry.id);
      setConfirm({ kind: "success", entry, ticket });
      // Refrescar saldo
      const bal = await api.myTokens(token);
      setBalance(bal.balance);
    } catch (err) {
      setConfirm({
        kind: "error",
        entry,
        splitAmount,
        message: err instanceof ApiError ? err.detail : String(err),
      });
    }
  }

  function updateSplitAmount(v: number) {
    if (confirm.kind !== "open") return;
    setConfirm({ ...confirm, splitAmount: v });
  }

  if (authState.status !== "authenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <header className="space-y-1">
        <Link href="/inicio" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Regresar al inicio
        </Link>
        <h1 className="text-3xl font-semibold">Catálogo de privilegios</h1>
        <p className="text-neutral-400 text-sm max-w-2xl">
          Canjea tus Tokens por privilegios académicos. Las compras generan un
          ticket con folio único que debes mostrar al profesor al usarlo.
        </p>
      </header>

      <div className={`${CARD_MD} p-6 flex items-center justify-between gap-4 flex-wrap`}>
        <p className="text-[10px] uppercase tracking-[0.1em] text-accent-400">Saldo disponible</p>
        <p className="flex items-baseline gap-1.5">
          <span className="text-3xl font-medium tabular-nums">{balance ?? "—"}</span>
          <span className="text-neutral-400 text-sm">Tks</span>
        </p>
      </div>

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
        <section key={group.key} className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-300">
            {CATEGORY_LABEL[group.key] ?? group.key}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {group.items.map((e) => (
              <PrivilegeCard
                key={e.id}
                entry={e}
                balance={balance}
                onBuy={() =>
                  setConfirm({
                    kind: "open",
                    entry: e,
                    // Split Bill default: sugerimos que el iniciador aporte
                    // el costo dividido entre 4 (tamaño típico de equipo).
                    splitAmount: e.es_grupal ? Math.max(1, Math.round(e.costo / 4)) : e.costo,
                  })
                }
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
          onChangeAmount={updateSplitAmount}
        />
      )}
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
  const canAffordFull = balance !== null && balance >= entry.costo;
  // Para split bill basta con poder aportar al menos 1 Tk.
  const canAffordSplit = balance !== null && balance >= 1;
  const disabledReason = entry.es_grupal
    ? !canAffordSplit
      ? "Necesitas al menos 1 Tk para iniciar el Split Bill"
      : null
    : !canAffordFull
      ? "Saldo insuficiente"
      : null;

  return (
    <div className={`${CARD_SM} p-4 flex items-start justify-between gap-4`}>
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
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent2-800 text-accent2-100">
              De Equipo
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
          className="text-xs rounded-md border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-3 py-1.5 font-medium"
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
  onChangeAmount,
}: {
  confirm: Exclude<Confirm, { kind: "closed" }>;
  balance: number | null;
  onCancel: () => void;
  onConfirm: () => void;
  onChangeAmount: (v: number) => void;
}) {
  const { entry } = confirm;
  const grupal = entry.es_grupal;

  // Cantidad efectivamente descontada al iniciador.
  const deducted = confirm.kind === "success"
    ? entry.es_grupal
      ? confirm.ticket.contribuciones.find((c) => !c.refunded_at)?.amount ?? 0
      : entry.costo
    : "splitAmount" in confirm
      ? confirm.splitAmount
      : entry.costo;

  const afterBalance = balance !== null ? balance - deducted : null;
  const editing = confirm.kind === "open" || confirm.kind === "error";
  const currentAmount = "splitAmount" in confirm ? confirm.splitAmount : entry.costo;

  const invalidAmount = grupal && (currentAmount < 1 || currentAmount > entry.costo);
  const insufficient = afterBalance !== null && afterBalance < 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full rounded-lg border border-surface-border bg-surface-raised p-6 space-y-4">
        <h3 className="text-lg font-semibold">
          {grupal ? "Iniciar Split Bill" : "Confirmar compra"}
        </h3>

        <div className="space-y-2 text-sm">
          <p className="text-neutral-300">{entry.nombre}</p>
          {entry.descripcion && (
            <p className="text-neutral-400 text-xs">{entry.descripcion}</p>
          )}
          {grupal && (
            <p className="text-xs text-accent2-300 bg-accent2-900/50 border border-accent2-800 rounded-md p-2">
              Este privilegio es <strong>de equipo</strong>. Aportas la cantidad
              que quieras; el resto del equipo puede aportar después. El ticket
              se emite cuando la suma llega a {entry.costo} Tks.
            </p>
          )}
        </div>

        {grupal && editing && (
          <label className="block space-y-1">
            <span className="text-xs text-neutral-400">Tu aportación inicial (Tks)</span>
            <input
              type="number"
              min={1}
              max={Math.min(entry.costo, balance ?? entry.costo)}
              step={1}
              value={currentAmount}
              onChange={(e) => onChangeAmount(Number(e.target.value) || 0)}
              className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-white tabular-nums focus:border-ibero-red focus:outline-none focus:ring-1 focus:ring-ibero-red"
            />
            <span className="text-[10px] text-neutral-500">
              Entre 1 y {Math.min(entry.costo, balance ?? entry.costo)} Tks.
              Cubrir el 100% ({entry.costo}) emite el ticket de inmediato.
            </span>
          </label>
        )}

        <div className="rounded-md border border-surface-border/60 bg-surface p-3 text-sm space-y-1 tabular-nums">
          <div className="flex justify-between">
            <span className="text-neutral-400">
              {grupal ? "Costo total del equipo" : "Costo"}
            </span>
            <span>{entry.costo} Tks</span>
          </div>
          {grupal && (
            <div className="flex justify-between">
              <span className="text-neutral-400">Tu aportación</span>
              <span>{Number(deducted)} Tks</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-400">Saldo actual</span>
            <span>{balance ?? "—"} Tks</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-surface-border/60">
            <span className="text-neutral-400">Saldo después</span>
            <span className={insufficient ? "text-red-400" : "text-emerald-400"}>
              {afterBalance ?? "—"} Tks
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          {grupal
            ? "Puedes cancelar el ticket mientras esté en 'funding' para recibir un reembolso completo. Una vez emitido no se puede reembolsar."
            : "La compra es irreversible. Se generará un ticket con folio único que debes mostrar al profesor al momento de usarlo (§5.4)."}
        </p>

        {confirm.kind === "error" && (
          <div className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300 space-y-2">
            <p>{confirm.message}</p>
            {confirm.message.includes("financiamiento") && (
              <Link href="/mis-tickets" className="inline-block text-xs underline text-red-300 hover:text-white">
                Ir a mis tickets →
              </Link>
            )}
          </div>
        )}

        {confirm.kind === "success" && (
          <div className="rounded-md border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-200 space-y-2">
            <p className="font-medium">
              {confirm.ticket.estado === "emitted"
                ? grupal
                  ? "Split Bill cubierto al 100%: ticket emitido"
                  : "Compra exitosa"
                : "Split Bill iniciado (esperando aportaciones del equipo)"}
            </p>
            <p className="text-xs">
              Folio:{" "}
              <code className="font-mono text-emerald-300">
                {confirm.ticket.folio}
              </code>{" "}
              · pagado {confirm.ticket.pagado_total}/{confirm.ticket.costo_total} Tks
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
                disabled={confirm.kind === "submitting" || invalidAmount || insufficient}
                className="rounded-md border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 px-4 py-2 text-sm font-medium"
              >
                {confirm.kind === "submitting"
                  ? grupal
                    ? "Iniciando…"
                    : "Comprando…"
                  : grupal
                    ? "Iniciar Split Bill"
                    : "Confirmar compra"}
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
