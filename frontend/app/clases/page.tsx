"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, ModuleOut, api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

export default function ClasesPage() {
  const authState = useAuth();
  const token = authState.status === "authenticated" ? authState.token : null;

  const [modules, setModules] = useState<ModuleOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setModules(await api.listModules(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

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
        <h1 className="text-3xl font-semibold">Clases</h1>
        <p className="text-neutral-400 text-sm">
          Apuntes y material de cada sesión, agrupados por módulo.
        </p>
      </header>

      {error && (
        <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Cargando…</p>
      ) : modules.length === 0 ? (
        <p className="text-sm text-neutral-500 bg-surface rounded-md p-4 text-center border border-surface-border">
          Todavía no hay módulos desbloqueados.
        </p>
      ) : (
        <div className="space-y-6">
          {modules.map((m) => (
            <section
              key={m.id}
              className="rounded-lg border border-surface-border bg-surface-raised p-6 space-y-3"
            >
              <h2 className="text-lg font-semibold text-white">
                Módulo {m.numero} · {m.nombre}
              </h2>
              {m.sessions.length === 0 ? (
                <p className="text-sm text-neutral-500">Aún sin sesiones publicadas.</p>
              ) : (
                <ul className="divide-y divide-surface-border/60">
                  {m.sessions.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/clases/${s.id}`}
                        className="flex items-center justify-between gap-3 py-3 group"
                      >
                        <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">
                          <span className="text-neutral-500">#{s.numero_sesion}</span> {s.titulo}
                        </span>
                        <span className="text-xs text-neutral-500 group-hover:text-accent-300 transition-colors">
                          Ver →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
