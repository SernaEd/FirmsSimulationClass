"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ActionBanner } from "@/components/ActionBanner";
import { MovementRow } from "@/components/BalanceWidget";
import { IconRings } from "@/components/icons";
import {
  ApiError,
  LedgerEntryOut,
  TOKEN_SOURCE_LABEL,
  TokenSource,
  api,
} from "@/lib/api";
import { CARD_SM } from "@/lib/ui";
import { useAuth } from "@/lib/useAuth";

const PAGE_SIZE = 25;
const ALL_SOURCES = Object.keys(TOKEN_SOURCE_LABEL) as TokenSource[];

export default function Movimientos() {
  const authState = useAuth();
  const token = authState.status === "authenticated" ? authState.token : null;

  const [entries, setEntries] = useState<LedgerEntryOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [selectedSources, setSelectedSources] = useState<TokenSource[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(
    async (opts: { offset: number; fuente: TokenSource[]; append: boolean }) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.myMovements(token, {
          limit: PAGE_SIZE,
          offset: opts.offset,
          fuente: opts.fuente.length > 0 ? opts.fuente : undefined,
        });
        setEntries((prev) => (opts.append ? [...prev, ...res] : res));
        setHasMore(res.length === PAGE_SIZE);
      } catch (err) {
        setError(err instanceof ApiError ? err.detail : String(err));
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!token) return;
    setOffset(0);
    load({ offset: 0, fuente: selectedSources, append: false });
  }, [token, selectedSources, load]);

  function toggleSource(s: TokenSource) {
    setSelectedSources((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function loadMore() {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    load({ offset: next, fuente: selectedSources, append: true });
  }

  if (authState.status !== "authenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  const totalDelta = entries.reduce((acc, e) => acc + e.delta, 0);

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <header className="space-y-1">
        <Link
          href="/inicio"
          className="text-sm text-neutral-500 hover:text-neutral-300"
        >
          ← Regresar al inicio
        </Link>
        <h1 className="text-3xl font-semibold">Movimientos del banco</h1>
        <p className="text-neutral-400 text-sm max-w-2xl">
          Historial de Tokens ganados y gastados. Es un registro append-only:
          nada se edita ni borra; los ajustes se hacen creando un movimiento
          compensatorio.
        </p>
      </header>

      <ActionBanner
        href="/privilegios"
        icon={<IconRings />}
        title="Tu saldo tiene para qué"
        description="Revisa el catálogo de privilegios académicos y canjea lo que has ganado."
        cta="Ver catálogo"
      />

      <div className="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
        {/* Filtros por fuente */}
        <section className={`${CARD_SM} p-5 space-y-3 lg:sticky lg:top-20`}>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-neutral-500">Filtrar por fuente</p>
            {selectedSources.length > 0 && (
              <button
                onClick={() => setSelectedSources([])}
                className="text-xs text-neutral-400 hover:text-white underline"
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="flex flex-wrap lg:flex-col gap-2">
            {ALL_SOURCES.map((s) => {
              const active = selectedSources.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSource(s)}
                  className={
                    "px-2.5 py-1.5 rounded-md text-xs text-left transition-colors " +
                    (active
                      ? "bg-accent-500/10 text-accent-300 ring-1 ring-inset ring-accent-500"
                      : "bg-surface hover:bg-surface-border text-neutral-300")
                  }
                >
                  {TOKEN_SOURCE_LABEL[s]}
                </button>
              );
            })}
          </div>
        </section>

        {/* Resumen y lista */}
        <section className={`${CARD_SM} p-6 space-y-3`}>
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-neutral-400">
              Mostrando {entries.length}{" "}
              {selectedSources.length > 0 && "(filtrados)"}
            </p>
            {entries.length > 0 && (
              <p className="text-xs text-neutral-500 tabular-nums">
                Suma visible:{" "}
                <span
                  className={
                    totalDelta > 0
                      ? "text-emerald-400"
                      : totalDelta < 0
                        ? "text-red-400"
                        : "text-neutral-300"
                  }
                >
                  {totalDelta > 0 ? "+" : ""}
                  {totalDelta} Tks
                </span>
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          {loading && entries.length === 0 ? (
            <p className="text-sm text-neutral-500">Cargando…</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No hay movimientos con los filtros actuales.
            </p>
          ) : (
            <ul className="divide-y divide-surface-border/60">
              {entries.map((e) => (
                <MovementRow key={e.id} entry={e} />
              ))}
            </ul>
          )}

          {hasMore && (
            <div className="pt-2 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="rounded-md border border-surface-border hover:bg-surface disabled:opacity-50 px-4 py-2 text-sm"
              >
                {loading ? "Cargando…" : "Cargar más"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
