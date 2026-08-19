"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  BalanceOut,
  LedgerEntryOut,
  TOKEN_SOURCE_LABEL,
  api,
} from "@/lib/api";

// Cuenta ascendente ease-out-cubic desde 0 hasta `target`, ~1s (UiDesign/README.md
// §2 "Token count-up"). Corre una sola vez por valor real recibido (guardado en
// un ref), no en cada re-render — evita reanimar al hacer focus/blur de la
// pestaña o en updates que no cambian el saldo.
function useCountUp(target: number | null): number {
  const [value, setValue] = useState(0);
  const animatedFor = useRef<number | null>(null);

  useEffect(() => {
    if (target === null || animatedFor.current === target) return;
    animatedFor.current = target;
    const start = performance.now();
    const duration = 1000;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return value;
}

/** Widget del saldo del banco (§14.2, Fila 1; UiDesign/README.md §2 "Token
 *  balance card"). Se pega en cualquier página autenticada; carga /me/tokens
 *  y muestra saldo (con count-up) + últimos 3 movimientos.
 */
export function BalanceWidget({ token }: { token: string }) {
  const [data, setData] = useState<BalanceOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const displayBalance = useCountUp(data ? data.balance : null);

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
    <section className="rounded-md bg-surface-raised shadow-md p-6 space-y-3 flex flex-col">
      <p className="text-[10px] uppercase tracking-[0.1em] text-accent-400">Saldo del banco</p>
      <p className="flex items-baseline gap-1.5">
        <span className="text-4xl font-medium tabular-nums">
          {data ? displayBalance.toLocaleString("es-MX") : "—"}
        </span>
        <span className="text-neutral-400 text-sm">Tks</span>
      </p>

      {error && <p className="text-xs text-red-400">Error: {error}</p>}

      <div className="flex-1">
        {data && data.recent.length === 0 && (
          <p className="text-xs text-neutral-500">
            Aún no tienes movimientos. Aparecerán cuando ganes o gastes Tokens.
          </p>
        )}
        {data && data.recent.length > 0 && (
          <ul className="divide-y divide-neutral-900">
            {data.recent.slice(0, 3).map((m) => (
              <MovementRow key={m.id} entry={m} />
            ))}
          </ul>
        )}
      </div>

      <Link
        href="/movimientos"
        className="w-full text-center rounded-md text-accent-300 text-sm py-2 transition-colors hover:bg-accent-500/10"
      >
        Ver movimientos
      </Link>
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
