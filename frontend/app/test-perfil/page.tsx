"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { ApiError, ProfileTestQuestionOut, UserOut, UserProfile, api, auth } from "@/lib/api";
import { PROFILE_DESCRIPTION, profileAvatarClass, profileLabel } from "@/lib/profile";
import { useAuth } from "@/lib/useAuth";

function CenteredMessage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      {className ? <p className={className}>{children}</p> : children}
    </main>
  );
}

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; questions: ProfileTestQuestionOut[] };

export default function TestPerfil() {
  const authState = useAuth({ allowPendingProfile: true });
  const router = useRouter();
  const [load, setLoad] = useState<LoadState>({ kind: "loading" });
  const [answers, setAnswers] = useState<Record<number, UserProfile>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<UserOut | null>(null);

  useEffect(() => {
    if (authState.status !== "authenticated" || authState.user.estado !== "pending_profile") return;
    api
      .getProfileTest(authState.token)
      .then((questions) => setLoad({ kind: "ready", questions }))
      .catch((err) =>
        setLoad({ kind: "error", message: err instanceof ApiError ? err.detail : String(err) }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.status]);

  if (authState.status === "loading") {
    return <CenteredMessage className="text-neutral-500">Cargando…</CenteredMessage>;
  }

  if (authState.status === "error") {
    return <CenteredMessage className="text-red-400">Error: {authState.error}</CenteredMessage>;
  }

  const { user, token } = authState;

  // Se revisa antes que el guard de abajo: al enviar, `auth.setUser()` ya
  // movió `user.estado` a "pending_approval" (vía AuthContext), así que sin
  // este chequeo el guard de "test ya no disponible" se adelantaría y nunca
  // se vería la pantalla de resultado.
  if (result) {
    return <ProfileResultScreen user={result} />;
  }

  if (user.estado !== "pending_profile") {
    return (
      <CenteredMessage>
        <div className="max-w-md w-full space-y-4 text-center">
          <h1 className="text-2xl font-semibold">El test ya no está disponible</h1>
          <p className="text-neutral-400 text-sm">
            {user.perfil
              ? `Tu perfil asignado es "${profileLabel(user.perfil)}". No es editable; si crees que necesita ajustarse, pídeselo al profesor.`
              : "Tu cuenta ya no está en la etapa de test de perfil."}
          </p>
          <Link href="/inicio" className="inline-block underline text-neutral-300">
            Ir al inicio
          </Link>
        </div>
      </CenteredMessage>
    );
  }

  if (load.kind === "loading") {
    return <CenteredMessage className="text-neutral-500">Cargando preguntas…</CenteredMessage>;
  }

  if (load.kind === "error") {
    return <CenteredMessage className="text-red-400">Error: {load.message}</CenteredMessage>;
  }

  const { questions } = load;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const respuestas = questions.map((q) => ({
        question_id: q.id,
        perfil_elegido: answers[q.id],
      }));
      const updatedUser = await api.submitProfileTest(token, { respuestas });
      auth.setUser(updatedUser);
      setResult(updatedUser);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.detail : String(err));
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen max-w-2xl mx-auto p-8 space-y-8">
      <header className="space-y-2">
        <p className="text-ibero-red text-xs uppercase tracking-widest">Cálculo 3</p>
        <h1 className="text-3xl font-semibold">Test de perfil de trabajo en equipo</h1>
        <p className="text-neutral-400 text-sm">
          Responde cómo tiendes a actuar en cada escenario. No hay respuestas
          correctas o incorrectas: el resultado ayuda a formar equipos
          balanceados y no es editable una vez enviado (el profesor puede
          reasignarlo manualmente en casos justificados).
        </p>
      </header>

      <div className="space-y-6">
        {questions.map((q, idx) => (
          // Nota: se usa un <div> con role="radiogroup" en vez de
          // <fieldset>/<legend> — el <legend> nativo se posiciona sobre el
          // borde superior del contenedor (comportamiento fijo del user
          // agent, no controlable con CSS), lo que rompía visualmente el
          // borde redondeado de la tarjeta.
          <div key={q.id} className="space-y-3">
            <p id={`q-${q.id}-label`} className="text-sm font-medium px-1">
              {idx + 1}. {q.enunciado}
            </p>
            <div
              role="radiogroup"
              aria-labelledby={`q-${q.id}-label`}
              className="rounded-lg border border-surface-border bg-surface-raised p-5 space-y-2"
            >
              {q.opciones.map((opcion) => (
                <label
                  key={opcion.perfil}
                  className={
                    "flex items-start gap-3 rounded-md border px-4 py-3 text-sm cursor-pointer transition-colors " +
                    (answers[q.id] === opcion.perfil
                      ? "border-accent-500 bg-accent-500/10"
                      : "border-surface-border hover:bg-surface")
                  }
                >
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={opcion.perfil}
                    checked={answers[q.id] === opcion.perfil}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opcion.perfil }))}
                    className="mt-1 accent-ibero-red"
                  />
                  <span>{opcion.texto}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {submitError && (
        <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          {submitError}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className="w-full rounded-lg border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-6 py-3 font-medium"
      >
        {submitting ? "Enviando..." : "Enviar respuestas"}
      </button>
      {!allAnswered && (
        <p className="text-center text-xs text-neutral-500">
          Responde las {questions.length} preguntas para poder enviar.
        </p>
      )}

      <footer className="text-xs text-neutral-500 pt-4 border-t border-surface-border">
        Basado en una adaptación reducida de Belbin, R. M. (2010).{" "}
        <em>Team Roles at Work</em> (2ª ed.), Routledge; Belbin, R. M. (1981).{" "}
        <em>Management Teams: Why They Succeed or Fail</em>, Butterworth-Heinemann;
        y Felder, R. M., &amp; Brent, R. (2005). &quot;Understanding student
        differences.&quot; <em>Journal of Engineering Education</em>, 94(1), 57-72.
      </footer>
    </main>
  );
}

// Pantalla de resultado tras enviar el test — no está en el mock de
// UiDesign/ (cubre solo Bienvenida/Dashboard/Mi equipo); se diseñó siguiendo
// los mismos tokens (card, kicker, colores por rol de @/lib/profile, botón
// outline) y se documentó en UiDesign/README.md.
function ProfileResultScreen({ user }: { user: UserOut }) {
  const router = useRouter();
  const perfil = user.perfil;

  return (
    <CenteredMessage>
      <div className="max-w-md w-full text-center space-y-5 rounded-md bg-surface-raised shadow-lg p-8 animate-fadeUp">
        <p className="text-accent-400 text-xs uppercase tracking-[0.12em]">
          Tu perfil de equipo
        </p>
        <div
          className={
            "mx-auto flex items-center justify-center w-16 h-16 rounded-full animate-popIn " +
            profileAvatarClass(perfil)
          }
          style={{ animationDelay: ".1s" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="5" />
            <path d="M9 12.5 7 21l5-3 5 3-2-8.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-medium">
          {perfil ? profileLabel(perfil) : "Perfil pendiente"}
        </h1>
        <p className="text-neutral-400 text-sm">
          {perfil
            ? PROFILE_DESCRIPTION[perfil]
            : "El profesor asignará tu perfil manualmente."}
        </p>
        <p className="text-xs text-neutral-500">
          No es editable; si crees que necesita ajustarse, pídeselo al profesor.
        </p>
        <button
          onClick={() => router.push("/inicio")}
          className="w-full rounded-lg border border-accent-500 text-accent-300 hover:bg-accent-500/10 transition-colors px-6 py-3 font-medium"
        >
          Ir a mi dashboard
        </button>
      </div>
    </CenteredMessage>
  );
}
