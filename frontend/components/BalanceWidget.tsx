"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ApiError,
  BalanceOut,
  LedgerEntryOut,
  TOKEN_SOURCE_LABEL,
  api,
} from "@/lib/api";

/** Widget del saldo del banco (§14.2, Fila 1). Se pega en cualquier página
 *  autenticada; carga /me/tokens y muestra saldo + últimos 3 movimientos.
 */
export function BalanceWidget({ token }: { token: string }) {
  const [data, setData] = useState<BalanceOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .myTokens(token)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.detail : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <section className="rounded-lg border border-surface-border bg-surface-raised p-6 space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">Saldo del banco</p>
          <p className="text-4xl font-semibold mt-1 tabular-nums">
            {data ? data.balance.toLocaleString("es-MX") : "—"}
            <span className="text-base font-normal text-neutral-400 ml-1">Tks</span>
          </p>
        </div>
        <Link
          href="/movimientos"
          className="text-sm text-neutral-400 hover:text-white underline"
        >
          Ver movimientos
        </Link>
      </div>

      {error && <p className="text-xs text-red-400">Error: {error}</p>}

      {data && (
        <div className="pt-2 border-t border-surface-border/60">
          <p className="text-xs text-neutral-500 mb-2">Movimientos recientes</p>
          {data.recent.length === 0 ? (
            <p className="text-xs text-neutral-500">
              Aún no tienes movimientos. Aparecerán cuando ganes o gastes Tokens.
            </p>
          ) : (
            <ul className="divide-y divide-surface-border/40 text-sm">
              {data.recent.slice(0, 3).map((m) => (
                <MovementRow key={m.id} entry={m} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

export function MovementRow({ entry }: { entry: LedgerEntryOut }) {
  const positive = entry.delta > 0;
  return (
    <li className="py-2 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-neutral-300 text-xs truncate">
          {TOKEN_SOURCE_LABEL[entry.fuente]}
        </p>
        {entry.nota && (
          <p className="text-xs text-neutral-500 truncate">{entry.nota}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p
          className={
            "tabular-nums font-semibold " +
            (positive ? "text-emerald-400" : "text-red-400")
          }
        >
          {positive ? "+" : ""}
          {entry.delta}
        </p>
        <p className="text-[10px] text-neutral-500">
          {new Date(entry.created_at).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
          })}
        </p>
      </div>
    </li>
  );
}
