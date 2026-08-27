"use client";

import Link from "next/link";
import { useEffect, useState, FormEvent } from "react";
import { ActionBanner } from "@/components/ActionBanner";
import { BalanceWidget } from "@/components/BalanceWidget";
import { IconRings } from "@/components/icons";
import { TeamOut, UserStatus, api, pickByPronoun, StreakDayOut } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

// Rediseño "Dashboard" — ver UiDesign/README.md §2. Los enlaces de Admin ya
// no se duplican aquí (ver TopNav): el propio audit del prototipo (hallazgo
// #4) señala que mezclarlos con los enlaces de alumno es el patrón a evitar;
// TopNav ya ofrece el grupo "Admin" como affordance separado.
export default function Inicio() {
  const authState = useAuth();
  const token = authState.status === "authenticated" ? authState.token : null;
  // Cuentas no activas (pending_profile/pending_approval) no tienen acceso a
  // /me/team (403) y de cualquier forma useAuth() ya las redirige fuera de
  // /inicio — evita el fetch de equipo mientras eso ocurre.
  const isActive = authState.status === "authenticated" && authState.user.estado === "active";
  const [team, setTeam] = useState<TeamOut | null | undefined>(undefined);

  useEffect(() => {
    if (!token || !isActive) return;
    let cancelled = false;
    api
      .myTeam(token)
      .then((t) => {
        if (!cancelled) setTeam(t);
      })
      .catch(() => {
        if (!cancelled) setTeam(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token, isActive]);

  if (authState.status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  if (authState.status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-red-400">Error: {authState.error}</p>
      </main>
    );
  }

  const { user } = authState;
  const isPending = user.estado !== "active";
  // Fraseo neutro por default; se personaliza si la persona declaró pronombres.
  const bienvenida = pickByPronoun(
    user.pronombres,
    "Bienvenida",
    "Bienvenido",
    "Te damos la bienvenida",
  );

  return (
    <main className="max-w-[960px] mx-auto px-4 sm:px-8 pt-[22.4px] pb-20">
      <header className="mb-8">
        <p className="text-accent-400 text-xs uppercase tracking-[0.12em] mb-1">
          Cálculo 3
        </p>
        <h1 className="text-[30px] font-medium">Hola, {user.nombre}</h1>
        {team !== undefined && (
          <p className="text-neutral-500 text-[13px] mt-1">
            {team ? (
              <>
                Firma <strong className="text-neutral-100 font-medium">{team.nombre_firma ?? "(sin nombre)"}</strong>
              </>
            ) : (
              "Aún no tienes equipo asignado."
            )}
          </p>
        )}
      </header>

      {isPending ? (
        <PendingAccountCard estado={user.estado} />
      ) : (
        <>
          <div className="grid md:grid-cols-[1.1fr_.9fr] gap-5 mb-5">
            <StreakWidget token={authState.token} />
            <BalanceWidget token={authState.token} />
          </div>

          <ActionBanner
            href="/privilegios"
            icon={<IconRings />}
            title="Canjea tus Tokens"
            description="Explora el catálogo de privilegios académicos y usa tu saldo acumulado."
            cta="Ver catálogo"
          />
        </>
      )}

      <footer className="text-xs text-neutral-500 pt-8 mt-8 border-t border-surface-border">
        MVP · <Link href="/reglas" className="underline">reglas</Link>
        {!isPending && (
          <>
            {" "}
            · <span className="opacity-70">{bienvenida} a la plataforma.</span>
          </>
        )}
      </footer>
    </main>
  );
}

// La racha diaria (evidencia de WebAssign, backend/app/models/streak.py) no
// tiene endpoint todavía — solo existe el modelo/migración (ver
// UiDesign/README.md, "Implementation notes"). Se muestra la estructura
// completa del diseño en estado "próximamente" en vez de datos inventados;
// cuando exista /me/streak basta con reemplazar el contenido estático de
// abajo por los datos reales.
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { DailyExerciseOut } from "@/lib/api";

export function StreakWidget({ token }: { token: string }) {
  const [streakDays, setStreakDays] = useState<StreakDayOut[]>([]);
  const [todayExercise, setTodayExercise] = useState<DailyExerciseOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      const now = new Date();
      const [days, exercise] = await Promise.all([
        api.getMyStreak(token, now.getFullYear(), now.getMonth() + 1),
        api.getTodayExercise(token).catch(() => null)
      ]);
      setStreakDays(days);
      setTodayExercise(exercise);
    } catch (err: any) {
      setError(err.message || "Error al cargar la racha.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Debes proveer el archivo con la solución.");
      return;
    }
    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("solucion", file);

    try {
      await api.submitStreakEvidence(token, formData);
      setFile(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Error al subir evidencia.");
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  const todayStreak = streakDays.find((d) => d.fecha === todayStr);
  const daysInRow = streakDays.filter((d) => d.estado === "completado" || d.estado === "pase_aplicado").length;

  const getDayColor = (status: string) => {
    switch (status) {
      case "completado": return "bg-accent-600 border-accent-500 text-white";
      case "fallido": return "bg-red-900 border-red-700 text-red-200";
      case "neutro": return "bg-neutral-700 border-neutral-600 text-neutral-300";
      case "pase_aplicado": return "bg-accent2-700 border-accent2-600 text-white";
      case "pendiente_revision": return "bg-yellow-900 border-yellow-700 text-yellow-200";
      default: return "bg-neutral-900 border-neutral-800 text-neutral-600";
    }
  };

  return (
    <section className="rounded-md bg-surface-raised shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.1em] text-accent-400">Racha activa</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[38px] font-medium tabular-nums text-neutral-100">
              {loading ? "..." : daysInRow}
            </span>
            <span className="text-neutral-500 text-sm">días este mes</span>
          </div>
        </div>
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-600"
          aria-hidden="true"
        >
          <path d="M12 21c-4 0-7-2.7-7-6.5C5 10 8 7 9 3c.5 3 3 4 3 7 0-2 1.5-3 1.5-5C16 7 19 10 19 14.5 19 18.3 16 21 12 21Z" />
        </svg>
      </div>

      <div className="mb-4">
        {loading ? (
          <p className="text-xs text-neutral-500">Cargando historial...</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {streakDays.length === 0 && (
               <p className="text-[9px] text-neutral-500">Aún no hay historial este mes.</p>
            )}
            {streakDays.map((day) => (
              <div
                key={day.id}
                title={`${day.fecha} - ${day.estado}`}
                className={`flex flex-col items-center justify-center gap-0.5 w-8 h-8 rounded-sm border ${getDayColor(day.estado)}`}
              >
                <span className="text-[9px]">{day.fecha.split("-")[2]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && todayStreak?.estado === "completado" ? (
        <div className="text-sm text-accent-300 bg-accent-900/30 border border-accent-800 p-3 rounded">
          ✅ Evidencia del día registrada.
        </div>
      ) : (
        <div className="mt-6 border-t border-neutral-800 pt-4">
          <h3 className="text-sm font-medium text-neutral-200 mb-3 flex items-center flex-wrap gap-2">
            <span>Ejercicio del Día</span>
            {todayExercise && (
              <span className="text-neutral-500 font-normal text-xs">
                &mdash; {todayExercise.course_session ? (
                  <Link href={`/clases/${todayExercise.course_session.id}`} className="hover:text-accent-400 underline decoration-neutral-700">
                    {todayExercise.course_session.titulo}
                  </Link>
                ) : 'General'} #{todayExercise.numero}
              </span>
            )}
          </h3>
          {!todayExercise ? (
            <p className="text-xs text-neutral-500 italic bg-neutral-900/50 p-3 rounded border border-neutral-800">
              No hay ejercicio programado para hoy.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="prose prose-sm prose-invert max-w-none text-neutral-300 bg-neutral-900/50 p-4 rounded-md border border-neutral-800">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {todayExercise.enunciado}
                </ReactMarkdown>
                {todayExercise.imagen_path && (
                  <div className="mt-3">
                    <a 
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/daily-exercises/${todayExercise.id}/image`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-accent-400 text-xs hover:underline inline-flex items-center gap-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      Ver imagen adjunta
                    </a>
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Subir Solución (Imagen o PDF)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    required
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-neutral-800 file:text-neutral-200 hover:file:bg-neutral-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-accent-600 text-white text-sm py-2 rounded font-medium hover:bg-accent-500 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Enviando..." : "Enviar Solución"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// Estado no-activo del dashboard. Antes usaba colores ámbar de "advertencia"
// y mostraba el enum crudo (`user.estado`) — leía como si el registro
// hubiera fallado. `pending_profile` no debería llegar aquí en la práctica
// (useAuth ya redirige a /test-perfil), pero se cubre por si acaso; el caso
// real es pending_approval (en revisión, tono neutro/informativo) vs.
// rejected (necesita acción, tono con más énfasis) — dos estados con
// implicaciones distintas que antes se mostraban con el mismo mensaje.
function PendingAccountCard({ estado }: { estado: UserStatus }) {
  if (estado === "rejected") {
    return (
      <section className="rounded-md bg-surface-raised shadow-md p-8 text-center space-y-3">
        <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-accent-800 text-accent-100">
          <IconXCircle />
        </div>
        <h2 className="text-lg font-medium">Tu solicitud no fue aprobada</h2>
        <p className="text-neutral-400 text-sm max-w-sm mx-auto">
          Tu profesor revisó tu registro y no lo aprobó. Contáctalo
          directamente si crees que fue un error o quieres más información.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-md bg-surface-raised shadow-md p-8 text-center space-y-3">
      <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-accent2-800 text-accent2-100">
        <IconClock />
      </div>
      <h2 className="text-lg font-medium">Tu cuenta está en revisión</h2>
      <p className="text-neutral-400 text-sm max-w-sm mx-auto">
        {estado === "pending_profile"
          ? "Termina el test de perfil de trabajo en equipo para continuar."
          : "Ya completaste tu registro. Tu profesor debe aprobar tu cuenta antes de que puedas ver tu saldo, tu equipo y el resto de la plataforma — normalmente no tarda mucho."}
      </p>
      {estado === "pending_profile" && (
        <Link
          href="/test-perfil"
          className="inline-flex rounded-md border border-accent-500 text-accent-300 hover:bg-accent-500/10 transition-colors px-5 py-2 text-sm font-medium"
        >
          Continuar test de perfil
        </Link>
      )}
    </section>
  );
}

function IconClock() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function IconXCircle() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
    </svg>
  );
}
