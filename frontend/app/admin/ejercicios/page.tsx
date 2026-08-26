"use client";

import { useEffect, useState, FormEvent } from "react";
import { api, DailyExerciseOut } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function AdminEjercicios() {
  const authState = useAuth({ requireAdmin: true });
  const [exercises, setExercises] = useState<DailyExerciseOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [fecha, setFecha] = useState("");
  const [tema, setTema] = useState("");
  const [numero, setNumero] = useState(1);
  const [enunciado, setEnunciado] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const loadExercises = async () => {
    if (authState.status !== "authenticated") return;
    setLoading(true);
    try {
      const data = await api.adminListExercises(authState.token);
      setExercises(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar ejercicios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.status === "authenticated") {
      loadExercises();
    }
  }, [authState.status]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (authState.status !== "authenticated") return;
    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("fecha", fecha);
    formData.append("tema", tema);
    formData.append("numero", String(numero));
    formData.append("enunciado", enunciado);
    if (file) {
      formData.append("imagen", file);
    }

    try {
      await api.adminCreateExercise(authState.token, formData);
      setFecha("");
      setTema("");
      setNumero(1);
      setEnunciado("");
      setFile(null);
      await loadExercises();
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
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-100">Banco de Ejercicios Diarios</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Programa los problemas del día para la racha. Puedes usar texto, LaTeX o adjuntar una imagen.
        </p>
      </header>

      {error && <div className="bg-red-900/30 text-red-200 border border-red-800 p-4 rounded mb-6">{error}</div>}

      <section className="bg-surface-raised rounded-lg shadow p-6 mb-8 border border-surface-border">
        <h2 className="text-lg font-semibold text-neutral-100 mb-4">Programar Nuevo Ejercicio</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Fecha de publicación</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-surface border-surface-border text-neutral-100 rounded-md shadow-sm focus:border-accent-500 focus:ring-accent-500 p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Tema (ej. Módulo 1, PVI)</label>
              <input
                type="text"
                required
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                className="w-full bg-surface border-surface-border text-neutral-100 rounded-md shadow-sm focus:border-accent-500 focus:ring-accent-500 p-2 border"
                placeholder="Módulo 1, Ecuación Exacta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Número de Ejercicio</label>
              <input
                type="number"
                min="1"
                required
                value={numero}
                onChange={(e) => setNumero(Number(e.target.value))}
                className="w-full bg-surface border-surface-border text-neutral-100 rounded-md shadow-sm focus:border-accent-500 focus:ring-accent-500 p-2 border"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1">Enunciado (Markdown/LaTeX)</label>
              <textarea
                required
                rows={6}
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
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
            <label className="block text-sm font-medium text-neutral-300 mb-1">Imagen complementaria (Opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-surface file:text-neutral-200 hover:file:bg-neutral-800"
            />
          </div>
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
              <th className="px-6 py-3 text-left font-semibold text-neutral-200">Tema</th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200 w-24">Número</th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200">Enunciado</th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200 w-32">Imagen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border bg-surface-raised">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-neutral-500">Cargando...</td></tr>
            ) : exercises.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-neutral-500">No hay ejercicios programados.</td></tr>
            ) : (
              exercises.map(ex => (
                <tr key={ex.id} className="hover:bg-surface transition-colors">
                  <td className="px-6 py-4 font-medium text-neutral-300">{ex.fecha}</td>
                  <td className="px-6 py-4 font-medium text-neutral-100">{ex.tema}</td>
                  <td className="px-6 py-4 font-medium text-neutral-400">#{ex.numero}</td>
                  <td className="px-6 py-4 prose prose-sm prose-invert max-w-none text-neutral-300">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {ex.enunciado}
                    </ReactMarkdown>
                  </td>
                  <td className="px-6 py-4">
                    {ex.imagen_path ? (
                      <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/daily-exercises/${ex.id}/image`} target="_blank" rel="noreferrer" className="text-accent-400 hover:text-accent-300 hover:underline">
                        Ver imagen
                      </a>
                    ) : (
                      <span className="text-neutral-500">N/A</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
