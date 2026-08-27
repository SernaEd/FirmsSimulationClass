"use client";

import { useCallback, useEffect, useState, FormEvent, ReactNode } from "react";
import {
  ApiError,
  CasoOut,
  Consecuencia,
  LicitacionOut,
  LicitacionResponseOut,
  api,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { CARD_MD, CARD_SM } from "@/lib/ui";
import { useCountUp } from "@/components/BalanceWidget";

// Duración de la animación del tanque — no tiene que ver con `plazo_horas`
// del caso (esas son horas simuladas), solo con cuánto tarda en verse en
// pantalla el drenado del contaminante.
const ANIMATION_MS = 4200;

function CenteredMessage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <p className={className}>{children}</p>
    </main>
  );
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "sin-licitacion" }
  | { kind: "form"; licitacion: LicitacionOut }
  | { kind: "resultado"; licitacion: LicitacionOut; respuesta: LicitacionResponseOut };

export default function LicitacionesPage() {
  const authState = useAuth();
  const token = authState.status === "authenticated" ? authState.token : null;
  const [load, setLoad] = useState<LoadState>({ kind: "loading" });
  const [q, setQ] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchActiva = useCallback(async () => {
    if (!token) return;
    setLoad({ kind: "loading" });
    try {
      const licitacion = await api.licitacionActiva(token);
      if (!licitacion) {
        setLoad({ kind: "sin-licitacion" });
        return;
      }
      const miRespuesta = await api.miRespuestaLicitacion(token, licitacion.id);
      setLoad(
        miRespuesta
          ? { kind: "resultado", licitacion, respuesta: miRespuesta }
          : { kind: "form", licitacion },
      );
    } catch (err) {
      setLoad({ kind: "error", message: err instanceof ApiError ? err.detail : String(err) });
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchActiva();
  }, [token, fetchActiva]);

  if (authState.status === "loading") {
    return <CenteredMessage className="text-neutral-500">Cargando…</CenteredMessage>;
  }
  if (authState.status === "error") {
    return <CenteredMessage className="text-red-400">Error: {authState.error}</CenteredMessage>;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || load.kind !== "form") return;
    const qValue = Number(q);
    if (!Number.isFinite(qValue) || qValue <= 0) {
      setSubmitError("Ingresa un caudal Q mayor que 0.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const respuesta = await api.responderLicitacion(token, load.licitacion.id, qValue);
      setLoad({ kind: "resultado", licitacion: load.licitacion, respuesta });
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <header className="space-y-2">
        <p className="text-accent-400 text-xs uppercase tracking-[0.12em]">Licitaciones</p>
        <h1 className="text-3xl font-semibold">Sala de licitación</h1>
        <p className="text-neutral-400 text-sm max-w-2xl">
          Resuelve el caso con tu equipo. Tu propuesta se simula al enviarla: si tu solución no
          cumple el plazo o el límite de presión, verás la consecuencia tal como ocurrió en el
          caso real — no solo una gráfica.
        </p>
      </header>

      {load.kind === "loading" && <p className="text-neutral-500 text-sm">Cargando…</p>}

      {load.kind === "error" && (
        <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          {load.message}
        </p>
      )}

      {load.kind === "sin-licitacion" && (
        <div className="rounded-md border border-dashed border-surface-border p-8 text-center space-y-2">
          <p className="text-neutral-300 font-medium">No hay ninguna licitación abierta ahora mismo.</p>
          <p className="text-neutral-500 text-sm">
            Tu profesor abre una licitación al inicio de la sesión — vuelve a esta página cuando
            la anuncie.
          </p>
        </div>
      )}

      {load.kind === "form" && (
        <CasoForm
          caso={load.licitacion.caso}
          q={q}
          setQ={setQ}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitError={submitError}
        />
      )}

      {load.kind === "resultado" && (
        <ResultadoView licitacion={load.licitacion} respuesta={load.respuesta} />
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Formulario: contexto del caso + envío de Q
// ---------------------------------------------------------------------------

function CasoForm({
  caso,
  q,
  setQ,
  onSubmit,
  submitting,
  submitError,
}: {
  caso: CasoOut;
  q: string;
  setQ: (v: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  submitError: string | null;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      <div className={`${CARD_MD} p-6 space-y-4`}>
        <p className="text-xs uppercase tracking-[0.1em] text-accent-400">{caso.modulo}</p>
        <h2 className="text-xl font-medium">{caso.titulo}</h2>
        <p className="text-sm text-neutral-400 leading-relaxed">{caso.contexto}</p>
        <dl className="grid grid-cols-2 gap-3 pt-2 text-sm">
          <ParamRow label="Volumen del tanque" value={`${caso.volumen_l.toLocaleString("es-MX")} L`} />
          <ParamRow label="Concentración inicial" value={String(caso.concentracion_inicial)} />
          <ParamRow label="Máximo aceptable" value={String(caso.concentracion_max)} />
          <ParamRow label="Plazo" value={`${caso.plazo_horas} h`} />
          <ParamRow
            label="Límite de presión de la línea"
            value={`${caso.presion_max_q.toLocaleString("es-MX")} L/h`}
          />
        </dl>
      </div>

      <form onSubmit={onSubmit} className={`${CARD_MD} p-6 space-y-4 h-fit`}>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Caudal de purga propuesto (Q, en L/h)</span>
          <input
            type="number"
            step="any"
            min={0}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej. 550"
            className="w-full rounded-md border border-surface-border bg-surface px-4 py-2.5 text-sm focus:border-ibero-red focus:ring-1 focus:ring-ibero-red outline-none"
          />
        </label>

        {submitError && (
          <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !q}
          className="w-full rounded-lg border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-6 py-3 font-medium"
        >
          {submitting ? "Enviando..." : "Enviar respuesta final"}
        </button>
        <p className="text-xs text-neutral-500">
          Tu equipo solo puede enviar una respuesta final por licitación — revísala bien antes de
          enviar.
        </p>
      </form>
    </div>
  );
}

function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-500 text-xs">{label}</dt>
      <dd className="tabular-nums font-medium">{value}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resultado: animación del tanque + consecuencias tangibles
// ---------------------------------------------------------------------------

function useAnimatedProgress(durationMs: number, resetKey: number): { progress: number; done: boolean } {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setProgress(0);
    setDone(false);
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, resetKey]);

  return { progress, done };
}

// Misma forma cerrada que el backend (`simular_tanque`): A(t) = A0*exp(-Q*t/V).
// Se recalcula aquí en vez de recibir una serie muestreada por API — con los
// parámetros del caso (ya en el cliente) la curva exacta es más barata y más
// precisa que interpolar una serie de puntos.
function concentracionEnT(caso: CasoOut, q: number, t: number): number {
  return caso.concentracion_inicial * Math.exp((-q * t) / caso.volumen_l);
}

const CONSECUENCIA_COLOR: Record<Consecuencia, string> = {
  ninguna: "#34d399", // emerald-400
  linea_danada: "#fbbf24", // amber-400
  lote_perdido: "#f87171", // red-400
};

function ResultadoView({
  licitacion,
  respuesta,
}: {
  licitacion: LicitacionOut;
  respuesta: LicitacionResponseOut;
}) {
  const { progress, done } = useAnimatedProgress(ANIMATION_MS, respuesta.id);
  const caso = licitacion.caso;

  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      <div className={`${CARD_MD} p-6 flex flex-col items-center gap-4`}>
        <p className="text-xs uppercase tracking-[0.1em] text-accent-400 self-start">{caso.titulo}</p>
        <TankVisual
          caso={caso}
          q={respuesta.q_propuesta}
          consecuencia={respuesta.resultado.consecuencia}
          progress={progress}
          done={done}
        />
        <p className="text-sm text-neutral-400 text-center">
          Q enviada:{" "}
          <span className="tabular-nums font-medium text-neutral-200">
            {respuesta.q_propuesta.toLocaleString("es-MX")} L/h
          </span>
        </p>
      </div>

      <div>
        {!done && (
          <div className={`${CARD_SM} p-6 text-center text-sm text-neutral-500`}>
            Simulando tu propuesta…
          </div>
        )}
        {done && <ConsequenceCard respuesta={respuesta} caso={caso} />}
      </div>
    </div>
  );
}

function TankVisual({
  caso,
  q,
  consecuencia,
  progress,
  done,
}: {
  caso: CasoOut;
  q: number;
  consecuencia: Consecuencia;
  progress: number;
  done: boolean;
}) {
  const currentT = caso.plazo_horas * progress;
  const currentA = concentracionEnT(caso, q, currentT);
  const pct = Math.max(0, Math.min(100, (currentA / caso.concentracion_inicial) * 100));
  const umbralPct = Math.max(
    0,
    Math.min(100, (caso.concentracion_max / caso.concentracion_inicial) * 100),
  );
  const tankHeight = 196;
  const tankTop = 12;
  const color = done ? CONSECUENCIA_COLOR[consecuencia] : "#9690c9";
  const clipId = `tank-clip-${caso.id}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 160 220" width="160" height="220" role="img" aria-label="Nivel de contaminante en el tanque">
        <rect x="10" y="10" width="140" height="200" rx="8" fill="none" stroke="#595d6c" strokeWidth="2" />
        <clipPath id={clipId}>
          <rect x="12" y={tankTop} width="136" height={tankHeight} rx="6" />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          <rect
            x="12"
            y={tankTop + tankHeight * (1 - pct / 100)}
            width="136"
            height={tankHeight * (pct / 100)}
            fill={color}
            opacity={0.55}
          />
        </g>
        <line
          x1="10"
          x2="150"
          y1={tankTop + tankHeight * (1 - umbralPct / 100)}
          y2={tankTop + tankHeight * (1 - umbralPct / 100)}
          stroke="#ee9fab"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      </svg>
      <div className="text-center space-y-0.5">
        <p className="text-xs text-neutral-500">
          t = {currentT.toFixed(1)} h de {caso.plazo_horas} h
        </p>
        <p className="tabular-nums text-sm">
          Concentración: <span className="font-medium">{currentA.toFixed(2)}</span>
          <span className="text-neutral-500"> (máximo {caso.concentracion_max})</span>
        </p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  );
}

function ConsequenceCard({ respuesta, caso }: { respuesta: LicitacionResponseOut; caso: CasoOut }) {
  const r = respuesta.resultado;
  const dinero = useCountUp(r.consecuencia === "lote_perdido" ? r.dinero_perdido_mxn : null);
  const costoReparacion = useCountUp(r.consecuencia === "linea_danada" ? r.costo_reparacion_mxn : null);

  if (r.correcta) {
    return (
      <div className={`${CARD_MD} p-6 space-y-3 text-center animate-fadeUp`}>
        <div
          className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-400 animate-popIn"
          style={{ animationDelay: ".1s" }}
        >
          <CheckIcon />
        </div>
        <h3 className="text-xl font-medium text-emerald-300">Lote salvado</h3>
        <p className="text-sm text-neutral-400">
          Tu caudal descontaminó el tanque a tiempo (concentración final {r.a_final}, máximo{" "}
          {caso.concentracion_max}) sin exceder el límite de presión de la línea.
        </p>
        <PuntosNota respuesta={respuesta} />
      </div>
    );
  }

  if (r.consecuencia === "lote_perdido") {
    return (
      <div className={`${CARD_MD} p-6 space-y-4 text-center animate-fadeUp`}>
        <div
          className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-red-500/15 text-red-400 animate-popIn"
          style={{ animationDelay: ".1s" }}
        >
          <WarningIcon />
        </div>
        <h3 className="text-xl font-medium text-red-300">Lote perdido</h3>
        <p className="text-sm text-neutral-400">
          Tu caudal no bajó la concentración a tiempo (llegó a {r.a_final}, el máximo era{" "}
          {caso.concentracion_max}). Como en el caso real, el lote en proceso se desecha.
        </p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <ConsequenceStat label="Pérdida estimada" value={`$${dinero.toLocaleString("es-MX")} MXN`} />
          <ConsequenceStat
            label="Pacientes con tratamiento limitado"
            value={r.pacientes_afectados.toLocaleString("es-MX")}
          />
        </div>
        <PuntosNota respuesta={respuesta} />
      </div>
    );
  }

  return (
    <div className={`${CARD_MD} p-6 space-y-4 text-center animate-fadeUp`}>
      <div
        className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/15 text-amber-400 animate-popIn"
        style={{ animationDelay: ".1s" }}
      >
        <WarningIcon />
      </div>
      <h3 className="text-xl font-medium text-amber-300">Línea de purga dañada</h3>
      <p className="text-sm text-neutral-400">
        Tu caudal ({respuesta.q_propuesta.toLocaleString("es-MX")} L/h) superó el límite de presión
        de la línea ({caso.presion_max_q.toLocaleString("es-MX")} L/h): la descontaminación fue
        exitosa, pero el equipo se dañó.
      </p>
      <ConsequenceStat
        label="Costo de reparación"
        value={`$${costoReparacion.toLocaleString("es-MX")} MXN`}
      />
      <PuntosNota respuesta={respuesta} />
    </div>
  );
}

function ConsequenceStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.1em] text-neutral-500">{label}</p>
      <p className="text-lg font-medium tabular-nums">{value}</p>
    </div>
  );
}

function PuntosNota({ respuesta }: { respuesta: LicitacionResponseOut }) {
  return (
    <p className="text-xs text-neutral-500 pt-2 border-t border-surface-border">
      {respuesta.puntos_tokens != null
        ? `Tokens acreditados: +${respuesta.puntos_tokens}${
            respuesta.orden_llegada ? ` (lugar #${respuesta.orden_llegada})` : ""
          }`
        : "Los Tokens se acreditan cuando el profesor cierre la licitación."}
    </p>
  );
}
