"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  EulerModelInfo,
  EulerModelKey,
  EulerSimulateIn,
  EulerSimulateOut,
  api,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { CARD_MD, CARD_SM } from "@/lib/ui";

const DEFAULT_H = 1;
const DEFAULT_N_PASOS = 5;

// Geometría del SVG del chart — viewBox fijo, escalado responsivo vía
// `w-full h-auto` (mismo enfoque que TankVisual en /licitaciones).
const CHART_W = 680;
const CHART_H = 380;
const MARGIN = { top: 16, right: 16, bottom: 30, left: 50 };
const PLOT_W = CHART_W - MARGIN.left - MARGIN.right;
const PLOT_H = CHART_H - MARGIN.top - MARGIN.bottom;

// Longitud fija (en px de pantalla) de cada flecha del campo de direcciones.
const ARROW_HALF_PX = 8;

function fmtNum(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return Number(n.toFixed(digits)).toString();
}

function ticks(min: number, max: number, count: number): number[] {
  if (max <= min) return [min];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + i * step);
}

function toErrorMessage(err: unknown): string {
  return err instanceof ApiError ? err.detail : String(err);
}

export default function EulerPage() {
  const authState = useAuth();
  const token = authState.status === "authenticated" ? authState.token : null;

  const [models, setModels] = useState<EulerModelInfo[]>([]);
  const [modelo, setModelo] = useState<EulerModelKey>("paracaidista");
  const [expresion, setExpresion] = useState("");
  const [x0, setX0] = useState("0");
  const [y0, setY0] = useState("0");
  const [h, setH] = useState(String(DEFAULT_H));
  const [nPasos, setNPasos] = useState(String(DEFAULT_N_PASOS));
  const [showField, setShowField] = useState(true);

  const [result, setResult] = useState<EulerSimulateOut | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSimulate = useCallback(
    async (payload: EulerSimulateIn) => {
      if (!token) return;
      setSimulating(true);
      setError(null);
      try {
        setResult(await api.eulerSimulate(token, payload));
      } catch (err) {
        setError(toErrorMessage(err));
        setResult(null);
      } finally {
        setSimulating(false);
      }
    },
    [token],
  );

  const loadModels = useCallback(async () => {
    if (!token) return;
    setLoadingModels(true);
    setError(null);
    try {
      const list = await api.eulerModels(token);
      setModels(list);
      const first = list[0];
      if (first) {
        setModelo(first.key as EulerModelKey);
        setX0(String(first.x0));
        setY0(String(first.y0));
        await doSimulate({
          modelo: first.key as EulerModelKey,
          x0: first.x0,
          y0: first.y0,
          h: DEFAULT_H,
          n_pasos: DEFAULT_N_PASOS,
        });
      }
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoadingModels(false);
    }
  }, [token, doSimulate]);

  useEffect(() => {
    if (token) loadModels();
  }, [token, loadModels]);

  const selectedPreset = models.find((m) => m.key === modelo) ?? null;

  const maxRelErrorPct = useMemo(() => {
    if (!result || !result.tiene_exacta) return null;
    let max = 0;
    for (const p of result.pasos) {
      if (p.exacta != null && p.error_abs != null && Math.abs(p.exacta) > 1e-9) {
        max = Math.max(max, Math.abs(p.error_abs / p.exacta));
      }
    }
    return max * 100;
  }, [result]);

  function handleModeloChange(nextKey: string) {
    const key = nextKey as EulerModelKey;
    setModelo(key);
    if (key === "custom") return;
    const preset = models.find((m) => m.key === key);
    if (preset) {
      setX0(String(preset.x0));
      setY0(String(preset.y0));
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const xv = Number(x0);
    const yv = Number(y0);
    const hv = Number(h);
    const nv = Number(nPasos);
    if (![xv, yv, hv, nv].every(Number.isFinite)) {
      setError("Revisa que x0, y0, h y el número de pasos sean números válidos.");
      return;
    }
    if (modelo === "custom" && !expresion.trim()) {
      setError("Escribe una ecuación dy/dx = f(x, y) para el modelo personalizado.");
      return;
    }
    doSimulate({
      modelo,
      expresion: modelo === "custom" ? expresion.trim() : undefined,
      x0: xv,
      y0: yv,
      h: hv,
      n_pasos: Math.round(nv),
    });
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
      <header className="space-y-2">
        <Link href="/inicio" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Regresar al inicio
        </Link>
        <p className="text-accent-400 text-xs uppercase tracking-[0.12em]">
          Sesión 8 · Métodos numéricos
        </p>
        <h1 className="text-3xl font-semibold">Solver de Euler</h1>
        <p className="text-neutral-400 text-sm max-w-2xl">
          Aproxima la solución de dy/dx = f(x, y) con el método de Euler: elige un modelo
          preconstruido o escribe tu propia ecuación, ajusta x0, y0, el paso h y el número de
          pasos, y compara la poligonal de Euler contra la solución exacta (cuando existe) sobre
          el campo de direcciones.
        </p>
      </header>

      {error && (
        <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid md:grid-cols-[320px_1fr] gap-6 items-start">
        <form onSubmit={handleSubmit} className={`${CARD_MD} p-6 space-y-4`}>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Modelo</span>
            <select
              value={modelo}
              onChange={(e) => handleModeloChange(e.target.value)}
              disabled={loadingModels}
              className="w-full bg-surface border-surface-border text-neutral-100 rounded-md p-2 border text-sm"
            >
              {models.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.nombre}
                </option>
              ))}
              <option value="custom">Personalizada — dy/dx = f(x, y)</option>
            </select>
          </label>

          {modelo !== "custom" ? (
            selectedPreset && <p className="text-xs text-neutral-500">{selectedPreset.descripcion}</p>
          ) : (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">f(x, y)</span>
              <input
                type="text"
                value={expresion}
                onChange={(e) => setExpresion(e.target.value)}
                placeholder="Ej. sin(x) - y^2"
                className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm font-mono focus:border-ibero-red focus:ring-1 focus:ring-ibero-red outline-none"
              />
              <span className="block text-xs text-neutral-500">
                Usa x, y, + − * / ^, paréntesis y sin, cos, tan, exp, log, sqrt.
              </span>
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <NumberField label="x0" value={x0} onChange={setX0} />
            <NumberField label="y0" value={y0} onChange={setY0} />
            <NumberField label="Paso h" value={h} onChange={setH} min={0} />
            <NumberField label="N.º de pasos" value={nPasos} onChange={setNPasos} min={1} step={1} />
          </div>

          {result && (
            <p className="text-xs text-neutral-500">
              Ecuación interpretada: <code className="text-neutral-300">dy/dx = {result.expresion_evaluada}</code>
            </p>
          )}

          <button
            type="submit"
            disabled={simulating || loadingModels}
            className="w-full rounded-lg border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-6 py-3 font-medium"
          >
            {simulating ? "Simulando…" : "Simular"}
          </button>
        </form>

        <div className="space-y-6">
          {result ? (
            <>
              <div className={`${CARD_MD} p-6 space-y-4`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-sm font-semibold text-neutral-300">
                    Gráfica y campo de direcciones
                  </h2>
                  <label className="flex items-center gap-2 text-xs text-neutral-400">
                    <input
                      type="checkbox"
                      checked={showField}
                      onChange={(e) => setShowField(e.target.checked)}
                    />
                    Mostrar campo de direcciones
                  </label>
                </div>

                <EulerChart result={result} showField={showField} />

                {result.diverged_at != null && (
                  <p className="rounded-md border border-amber-800 bg-amber-950/30 p-3 text-xs text-amber-300">
                    La aproximación diverge en el paso {result.diverged_at} (salió del dominio de f
                    o el valor creció demasiado) — se muestran solo los {result.pasos.length - 1}{" "}
                    pasos válidos.
                  </p>
                )}

                {maxRelErrorPct != null && (
                  <p className="text-xs text-neutral-500">
                    Error relativo máximo frente a la solución exacta:{" "}
                    <span className="text-neutral-300 font-medium">
                      {fmtNum(maxRelErrorPct, 2)}%
                    </span>
                    . Reto: ¿cuál es el h más grande que lo mantiene por debajo del 1%?
                  </p>
                )}
              </div>

              <div className={`${CARD_SM} p-6 space-y-3`}>
                <h2 className="text-sm font-semibold text-neutral-300">Tabla de pasos</h2>
                <StepsTable result={result} />
              </div>
            </>
          ) : (
            <div className={`${CARD_SM} p-6 text-center text-sm text-neutral-500`}>
              {simulating || loadingModels ? "Cargando…" : "Simula para ver la gráfica."}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  step = "any",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  step?: number | "any";
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-neutral-400">{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm tabular-nums focus:border-ibero-red focus:ring-1 focus:ring-ibero-red outline-none"
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
// Gráfica: campo de direcciones (capa de fondo, togglable) + solución exacta
// (curva punteada) + poligonal de Euler (línea sólida con marcadores) sobre
// los mismos ejes — mismo diseño que ilustra la Diapositiva 3 del guión
// (sesion8/guion_presentacion.md): "un campo de pendientes con una poligonal
// de Euler dibujada sobre la curva exacta".
// ---------------------------------------------------------------------------

function EulerChart({ result, showField }: { result: EulerSimulateOut; showField: boolean }) {
  const { x_min, x_max, y_min, y_max } = result;
  const xRange = x_max - x_min || 1;
  const yRange = y_max - y_min || 1;

  const sx = (x: number) => MARGIN.left + ((x - x_min) / xRange) * PLOT_W;
  const sy = (y: number) => MARGIN.top + PLOT_H - ((y - y_min) / yRange) * PLOT_H;

  const xTicks = ticks(x_min, x_max, 6);
  const yTicks = ticks(y_min, y_max, 6);

  const eulerPoints = result.pasos.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ");
  const exactPoints = result.curva_exacta.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ");
  const lastValid = result.pasos[result.pasos.length - 1] ?? null;
  // Loop-invariant respecto a `campo_direcciones` — se calcula una vez en
  // vez de en cada punto del .map() de abajo.
  const fieldEps = xRange * 0.004;

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Gráfica de la poligonal de Euler, la solución exacta y el campo de direcciones"
      >
        {xTicks.map((t, i) => (
          <line
            key={`gx${i}`}
            x1={sx(t)}
            x2={sx(t)}
            y1={MARGIN.top}
            y2={MARGIN.top + PLOT_H}
            stroke="#292b31"
            strokeWidth={1}
          />
        ))}
        {yTicks.map((t, i) => (
          <line
            key={`gy${i}`}
            x1={MARGIN.left}
            x2={MARGIN.left + PLOT_W}
            y1={sy(t)}
            y2={sy(t)}
            stroke="#292b31"
            strokeWidth={1}
          />
        ))}

        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={PLOT_W}
          height={PLOT_H}
          fill="none"
          stroke="#3f424d"
          strokeWidth={1}
        />

        {x_min < 0 && x_max > 0 && (
          <line
            x1={sx(0)}
            x2={sx(0)}
            y1={MARGIN.top}
            y2={MARGIN.top + PLOT_H}
            stroke="#595d6c"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
        {y_min < 0 && y_max > 0 && (
          <line
            x1={MARGIN.left}
            x2={MARGIN.left + PLOT_W}
            y1={sy(0)}
            y2={sy(0)}
            stroke="#595d6c"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {showField &&
          result.campo_direcciones.map((p, i) => {
            const cx = sx(p.x);
            const cy = sy(p.y);
            // Dirección calculada en espacio de pantalla (no de datos) y
            // normalizada a una longitud fija en px — así una pendiente
            // casi vertical no produce una flecha gigante o fuera de
            // proporción con el resto del campo.
            const dx = sx(p.x + fieldEps) - cx;
            const dy = sy(p.y + p.pendiente * fieldEps) - cy;
            const len = Math.hypot(dx, dy) || 1;
            const ux = (dx / len) * ARROW_HALF_PX;
            const uy = (dy / len) * ARROW_HALF_PX;
            return (
              <line
                key={`f${i}`}
                x1={cx - ux}
                y1={cy - uy}
                x2={cx + ux}
                y2={cy + uy}
                stroke="#7972a9"
                strokeWidth={1.5}
                strokeLinecap="round"
                opacity={0.6}
              />
            );
          })}

        {result.tiene_exacta && result.curva_exacta.length > 1 && (
          <polyline points={exactPoints} fill="none" stroke="#cfd3e5" strokeWidth={2} strokeDasharray="5 4" />
        )}

        <polyline points={eulerPoints} fill="none" stroke="#e26775" strokeWidth={2.25} />
        {result.pasos.map((p, i) => (
          <circle key={`p${i}`} cx={sx(p.x)} cy={sy(p.y)} r={3} fill="#ee9fab" />
        ))}

        {result.diverged_at != null && lastValid && (
          <circle
            cx={sx(lastValid.x)}
            cy={sy(lastValid.y)}
            r={7}
            fill="none"
            stroke="#f87171"
            strokeWidth={2}
          />
        )}

        {xTicks.map((t, i) => (
          <text
            key={`xl${i}`}
            x={sx(t)}
            y={MARGIN.top + PLOT_H + 16}
            fontSize={10}
            fill="#9397ab"
            textAnchor="middle"
          >
            {fmtNum(t)}
          </text>
        ))}
        {yTicks.map((t, i) => (
          <text key={`yl${i}`} x={MARGIN.left - 6} y={sy(t) + 3} fontSize={10} fill="#9397ab" textAnchor="end">
            {fmtNum(t)}
          </text>
        ))}
      </svg>

      <div className="flex flex-wrap gap-4 text-xs text-neutral-400">
        <LegendSwatch color="#e26775" label="Poligonal de Euler" />
        {result.tiene_exacta && <LegendSwatch color="#cfd3e5" dashed label="Solución exacta" />}
        {showField && <LegendSwatch color="#7972a9" label="Campo de direcciones" />}
      </div>
    </div>
  );
}

function LegendSwatch({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="16" height="8" aria-hidden="true">
        <line x1="0" y1="4" x2="16" y2="4" stroke={color} strokeWidth={2} strokeDasharray={dashed ? "4 3" : undefined} />
      </svg>
      {label}
    </span>
  );
}

function StepsTable({ result }: { result: EulerSimulateOut }) {
  return (
    <div className="max-h-72 overflow-y-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-surface-raised">
          <tr className="border-b border-surface-border text-left">
            <th className="py-2 pr-3 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
              n
            </th>
            <th className="py-2 pr-3 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
              x
            </th>
            <th className="py-2 pr-3 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
              y (Euler)
            </th>
            {result.tiene_exacta && (
              <>
                <th className="py-2 pr-3 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
                  Exacta
                </th>
                <th className="py-2 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
                  Error abs.
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {result.pasos.map((p) => (
            <tr key={p.n} className="border-b border-surface-border/60">
              <td className="py-1.5 pr-3 tabular-nums text-neutral-400">{p.n}</td>
              <td className="py-1.5 pr-3 tabular-nums">{fmtNum(p.x, 3)}</td>
              <td className="py-1.5 pr-3 tabular-nums font-medium">{fmtNum(p.y, 4)}</td>
              {result.tiene_exacta && (
                <>
                  <td className="py-1.5 pr-3 tabular-nums text-neutral-300">
                    {p.exacta != null ? fmtNum(p.exacta, 4) : "—"}
                  </td>
                  <td className="py-1.5 tabular-nums text-neutral-400">
                    {p.error_abs != null ? fmtNum(p.error_abs, 4) : "—"}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
