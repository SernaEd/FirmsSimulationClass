"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, FormEvent } from "react";
import {
  ApiError,
  DecimalRedemptionOut,
  api,
  DecimalRequestStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { useFeatureFlag } from "@/lib/useFeatureFlag";
import { CARD_MD, CARD_SM } from "@/lib/ui";
import { BalanceWidget } from "@/components/BalanceWidget";

function StatusBadge({ estado }: { estado: DecimalRequestStatus }) {
  const styles: Record<DecimalRequestStatus, string> = {
    pendiente: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    aprobado: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    rechazado: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  const labels: Record<DecimalRequestStatus, string> = {
    pendiente: "Pendiente",
    aprobado: "Aprobada",
    rechazado: "Rechazada",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase ${styles[estado]}`}
    >
      {labels[estado]}
    </span>
  );
}

export default function DecimasPage() {
  const authState = useAuth();
  const token = authState.status === "authenticated" ? authState.token : null;
  const decimasEnabled = useFeatureFlag("decimas_enabled");

  const [history, setHistory] = useState<DecimalRedemptionOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [desc, setDesc] = useState("");
  const [ref, setRef] = useState("");
  const [amount, setAmount] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.listDecimalRedemptions(token);
      setHistory(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    if (amount < 1) {
      setFormError("Debes solicitar al menos 1 décima.");
      return;
    }
    if (!desc.trim()) {
      setFormError("Debes incluir la descripción de la entrega.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await api.requestDecimalRedemption(token, {
        entrega_descripcion: desc.trim(),
        entrega_ref: ref.trim() || undefined,
        decimas_solicitadas: amount,
      });
      // Refresh list
      await load();
      // Reset form
      setDesc("");
      setRef("");
      setAmount(1);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setSubmitting(false);
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
    <main className="mx-auto max-w-5xl px-4 sm:px-8 py-8 pb-24 space-y-6">
      <header className="space-y-1">
        <Link href="/inicio" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Regresar al inicio
        </Link>
        <h1 className="text-3xl font-semibold">Canje de Décimas</h1>
        <p className="text-neutral-400 text-sm max-w-xl">
          Usa tus Tokens para subir tu calificación en entregas o parciales.
        </p>
      </header>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
        <div className="space-y-6 lg:sticky lg:top-20">
          <BalanceWidget token={token!} />

          {decimasEnabled === false && (
            // === false explícito (no solo falsy): mientras el flag todavía se
            // está consultando (null), no queremos mostrar "no disponible" y
            // luego el formulario real — sería un aviso falso momentáneo.
            <section className="rounded-md border border-dashed border-surface-border p-6 text-center">
              <p className="text-sm text-neutral-400">
                El canje por décimas todavía no está disponible — se abre en
                las últimas semanas del semestre. Tu historial de solicitudes
                previas sigue visible al lado.
              </p>
            </section>
          )}

          {decimasEnabled === true && (
            <section className={`${CARD_MD} p-6 space-y-4`}>
              <h2 className="text-lg font-semibold">Solicitar Décimas</h2>
              <p className="text-xs text-neutral-400">
                Nota: El costo estándar es de <strong>50 Tks</strong> por décima, aunque el costo final puede variar según la configuración del sistema. Al enviar esta solicitud, los tokens serán descontados de inmediato. Si es rechazada, se te devolverán.
              </p>

              <form onSubmit={submit} className="space-y-4 mt-4">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-neutral-300">
                    ¿Sobre qué entrega aplica?
                  </span>
                  <input
                    type="text"
                    required
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Ej. Parcial 1"
                    className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-ibero-red focus:outline-none focus:ring-1 focus:ring-ibero-red"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-neutral-300">
                    Referencia / Enlace (Opcional)
                  </span>
                  <input
                    type="text"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    placeholder="Ej. link de Canvas"
                    className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-ibero-red focus:outline-none focus:ring-1 focus:ring-ibero-red"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-neutral-300">
                    Décimas solicitadas
                  </span>
                  <input
                    type="number"
                    required
                    min={1}
                    step={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 1)}
                    className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-white focus:border-ibero-red focus:outline-none focus:ring-1 focus:ring-ibero-red"
                  />
                </label>

                {formError && (
                  <p className="text-xs text-red-300 border border-red-800 bg-red-950/40 rounded-md p-2">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 px-4 py-2 text-sm font-medium transition-colors"
                >
                  {submitting ? "Enviando solicitud…" : "Enviar solicitud"}
                </button>
              </form>
            </section>
          )}
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Historial de Solicitudes</h2>

          {loading ? (
            <p className="text-sm text-neutral-500">Cargando historial…</p>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : history.length === 0 ? (
            <p className={`text-sm text-neutral-500 ${CARD_SM} p-4 text-center`}>
              No tienes solicitudes previas.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {history.map((req) => (
                <div
                  key={req.id}
                  className={`${CARD_SM} p-4 flex flex-col gap-2`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{req.entrega_descripcion}</p>
                      {req.entrega_ref && (
                        <p className="text-xs text-neutral-400 truncate max-w-[200px]">
                          Ref: {req.entrega_ref}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge estado={req.estado} />
                      <p className="text-xs font-medium text-neutral-300 mt-1">
                        {req.decimas_solicitadas} décima{req.decimas_solicitadas > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-end mt-2 pt-2 border-t border-neutral-900 text-[11px] text-neutral-500">
                    <p>
                      {new Date(req.created_at).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="font-mono text-neutral-400">
                      Costo: {req.pts_costo} Tks
                    </p>
                  </div>
                  {req.nota_profesor && (
                    <div className="mt-2 rounded bg-neutral-900 p-2 text-xs text-neutral-300 border border-neutral-800">
                      <span className="font-semibold block mb-0.5 text-neutral-500">Nota del profesor:</span>
                      {req.nota_profesor}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
