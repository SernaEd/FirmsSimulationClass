"use client";

import { useEffect, useState, FormEvent } from "react";
import { api, ApiError, DailyExerciseOut, ModuleOut } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { todayMxStr } from "@/lib/date";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Link from "next/link";

function buildExerciseFormData(fecha: string, courseSessionId: string, enunciado: string, file: File | null): FormData {
  const formData = new FormData();
  formData.append("fecha", fecha);
  if (courseSessionId) formData.append("course_session_id", courseSessionId);
  formData.append("enunciado", enunciado);
  if (file) formData.append("imagen", file);
  return formData;
}

function ExerciseFormFields({
  fecha,
  onFechaChange,
  courseSessionId,
  onCourseSessionIdChange,
  modules,
  enunciado,
  onEnunciadoChange,
  onFileChange,
  imagenActual,
}: {
  fecha: string;
  onFechaChange: (v: string) => void;
  courseSessionId: string;
  onCourseSessionIdChange: (v: string) => void;
  modules: ModuleOut[];
  enunciado: string;
  onEnunciadoChange: (v: string) => void;
  onFileChange: (f: File | null) => void;
  imagenActual?: string | null;
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Fecha de publicación</label>
          <input
            type="date"
            required
            value={fecha}
            onChange={(e) => onFechaChange(e.target.value)}
            className="w-full bg-surface border-surface-border text-neutral-100 rounded-md shadow-sm focus:border-accent-500 focus:ring-accent-500 p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Clase vinculada (Opcional)</label>
          <select
            value={courseSessionId}
            onChange={(e) => onCourseSessionIdChange(e.target.value)}
            className="w-full bg-surface border-surface-border text-neutral-100 rounded-md shadow-sm focus:border-accent-500 focus:ring-accent-500 p-2 border"
          >
            <option value="">(Ninguna / General)</option>
            {modules.map((m) => (
              <optgroup key={m.id} label={`Módulo ${m.numero} - ${m.nombre}`}>
                {m.sessions.map((s) => (
                  <option key={s.id} value={s.id}>#{s.numero_sesion} - {s.titulo}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Enunciado (Markdown/LaTeX)</label>
          <textarea
            required
            rows={6}
            value={enunciado}
            onChange={(e) => onEnunciadoChange(e.target.value)}
            className="w-full bg-surface border-surface-border text-neutral-100 rounded-md shadow-sm focus:border-accent-500 focus:ring-accent-500 p-2 border font-mono text-sm placeholder:text-neutral-600"
            placeholder="Ejemplo: Resuelve la integral $\int_0^1 x^2 dx$"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">Vista Previa</label>
          <div className="w-full border border-surface-border rounded-md p-4 bg-surface h-[166px] overflow-auto prose prose-sm prose-invert text-neutral-300">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {enunciado || "*El enunciado renderizado aparecerá aquí.*"}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-1">
          Imagen complementaria (Opcional){imagenActual ? " — deja vacío para conservar la actual" : ""}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-surface file:text-neutral-200 hover:file:bg-neutral-800"
        />
      </div>
    </>
  );
}

function ExerciseRow({
  exercise,
  modules,
  token,
  todayStr,
  onChanged,
}: {
  exercise: DailyExerciseOut;
  modules: ModuleOut[];
  token: string;
  todayStr: string;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fecha, setFecha] = useState(exercise.fecha);
  const [courseSessionId, setCourseSessionId] = useState(
    exercise.course_session_id ? String(exercise.course_session_id) : ""
  );
  const [enunciado, setEnunciado] = useState(exercise.enunciado);
  const [file, setFile] = useState<File | null>(null);

  const editable = exercise.fecha >= todayStr;

  function startEditing() {
    setFecha(exercise.fecha);
    setCourseSessionId(exercise.course_session_id ? String(exercise.course_session_id) : "");
    setEnunciado(exercise.enunciado);
    setFile(null);
    setError(null);
    setEditing(true);
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await api.adminUpdateExercise(token, exercise.id, buildExerciseFormData(fecha, courseSessionId, enunciado, file));
      setEditing(false);
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={6} className="px-6 py-4 bg-surface">
          <form onSubmit={save} className="space-y-4">
            <ExerciseFormFields
              fecha={fecha}
              onFechaChange={setFecha}
              courseSessionId={courseSessionId}
              onCourseSessionIdChange={setCourseSessionId}
              modules={modules}
              enunciado={enunciado}
              onEnunciadoChange={setEnunciado}
              onFileChange={setFile}
              imagenActual={exercise.imagen_path}
            />
            {error && (
              <p className="text-xs text-red-300 border border-red-800 bg-red-950/40 rounded-md p-2">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 px-4 py-1.5 text-xs font-medium text-white"
              >
                {busy ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={busy}
                className="rounded-md border border-surface-border hover:bg-neutral-800 px-4 py-1.5 text-xs text-neutral-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-surface transition-colors">
      <td className="px-6 py-4 font-medium text-neutral-300">{exercise.fecha}</td>
      <td className="px-6 py-4 font-medium text-neutral-100">
        {exercise.course_session ? (
          <span className="text-accent-300">{exercise.course_session.titulo}</span>
        ) : (
          <span className="text-neutral-500">General</span>
        )}
      </td>
      <td className="px-6 py-4 font-medium text-neutral-400">#{exercise.numero}</td>
      <td className="px-6 py-4 prose prose-sm prose-invert max-w-none text-neutral-300">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {exercise.enunciado}
        </ReactMarkdown>
      </td>
      <td className="px-6 py-4">
        {exercise.imagen_path ? (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/daily-exercises/${exercise.id}/image`}
            target="_blank"
            rel="noreferrer"
            className="text-accent-400 hover:text-accent-300 hover:underline"
          >
            Ver imagen
          </a>
        ) : (
          <span className="text-neutral-500">N/A</span>
        )}
      </td>
      <td className="px-6 py-4">
        {editable ? (
          <button
            onClick={startEditing}
            className="rounded-md border border-surface-border hover:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300"
          >
            Editar
          </button>
        ) : (
          <span className="text-xs text-neutral-600">No editable</span>
        )}
      </td>
    </tr>
  );
}

export default function AdminEjercicios() {
  const authState = useAuth({ requireAdmin: true });
  const [exercises, setExercises] = useState<DailyExerciseOut[]>([]);
  const [modules, setModules] = useState<ModuleOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [fecha, setFecha] = useState("");
  const [courseSessionId, setCourseSessionId] = useState("");
  const [enunciado, setEnunciado] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const todayStr = todayMxStr();

  const loadData = async () => {
    if (authState.status !== "authenticated") return;
    setLoading(true);
    try {
      const [exData, modData] = await Promise.all([
        api.adminListExercises(authState.token),
        api.adminListModules(authState.token)
      ]);
      setExercises(exData);
      setModules(modData);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.status === "authenticated") {
      loadData();
    }
  }, [authState.status]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (authState.status !== "authenticated") return;
    setSubmitting(true);
    setError("");

    try {
      await api.adminCreateExercise(authState.token, buildExerciseFormData(fecha, courseSessionId, enunciado, file));
      setFecha("");
      setCourseSessionId("");
      setEnunciado("");
      setFile(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Error al crear ejercicio.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authState.status === "loading") return <p className="p-8 text-neutral-500">Cargando...</p>;
  if (authState.status === "error") return <p className="p-8 text-red-500">{authState.error}</p>;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8 space-y-1">
        <Link href="/inicio" className="text-sm text-neutral-400 hover:text-white">
          ← Volver al inicio
        </Link>
        <h1 className="text-2xl font-bold text-neutral-100 pt-4">Banco de Ejercicios Diarios</h1>
        <p className="text-sm text-neutral-400">
          Programa los problemas del día para la racha. Puedes usar texto, LaTeX o adjuntar una imagen.
        </p>
      </header>

      {error && <div className="bg-red-900/30 text-red-200 border border-red-800 p-4 rounded mb-6">{error}</div>}

      <section className="bg-surface-raised rounded-lg shadow p-6 mb-8 border border-surface-border">
        <h2 className="text-lg font-semibold text-neutral-100 mb-4">Programar Nuevo Ejercicio</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ExerciseFormFields
            fecha={fecha}
            onFechaChange={setFecha}
            courseSessionId={courseSessionId}
            onCourseSessionIdChange={setCourseSessionId}
            modules={modules}
            enunciado={enunciado}
            onEnunciadoChange={setEnunciado}
            onFileChange={setFile}
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-accent-600 text-white px-4 py-2 rounded hover:bg-accent-500 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Guardando..." : "Guardar Ejercicio"}
          </button>
        </form>
      </section>

      <section className="bg-surface-raised rounded-lg shadow overflow-hidden border border-surface-border">
        <table className="min-w-full divide-y divide-surface-border text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200 w-32">Fecha</th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200">Clase</th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200 w-24">Número</th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200">Enunciado</th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200 w-32">Imagen</th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200 w-32">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border bg-surface-raised">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-neutral-500">Cargando...</td></tr>
            ) : exercises.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-neutral-500">No hay ejercicios programados.</td></tr>
            ) : (
              exercises.map(ex => (
                <ExerciseRow
                  key={ex.id}
                  exercise={ex}
                  modules={modules}
                  token={authState.token}
                  todayStr={todayStr}
                  onChanged={loadData}
                />
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
