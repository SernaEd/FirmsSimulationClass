"use client";

import { useEffect, useState, FormEvent } from "react";
import { api, AcademicCalendarDayOut, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

export default function AdminCalendario() {
  const authState = useAuth({ requireAdmin: true });
  const [holidays, setHolidays] = useState<AcademicCalendarDayOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [fecha, setFecha] = useState("");
  const [motivo, setMotivo] = useState("");

  const loadData = async () => {
    if (authState.status !== "authenticated") return;
    setLoading(true);
    try {
      setHolidays(await api.adminListHolidays(authState.token));
    } catch (err: any) {
      setError(err.message || "Error al cargar el calendario.");
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
      await api.adminCreateHoliday(authState.token, fecha, motivo);
      setFecha("");
      setMotivo("");
      await loadData();
    } catch (err: any) {
      setError(err instanceof ApiError ? err.detail : err.message || "Error al marcar el día.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (authState.status !== "authenticated") return;
    if (!window.confirm("¿Quitar este día del calendario académico?")) return;
    try {
      await api.adminDeleteHoliday(authState.token, id);
      await loadData();
    } catch (err: any) {
      setError(err instanceof ApiError ? err.detail : err.message || "Error al eliminar.");
    }
  };

  if (authState.status === "loading") return <p className="p-8 text-neutral-500">Cargando...</p>;
  if (authState.status === "error") return <p className="p-8 text-red-500">{authState.error}</p>;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-100">Calendario académico</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Marca días festivos o sin clase (§11.5). Un lunes-jueves marcado aquí cuenta como neutro para la
          racha diaria — no la rompe ni exige evidencia. Viernes, sábado y domingo ya son neutros por
          diseño; no hace falta marcarlos.
        </p>
      </header>

      {error && <div className="bg-red-900/30 text-red-200 border border-red-800 p-4 rounded mb-6">{error}</div>}

      <section className="bg-surface-raised rounded-lg shadow p-6 mb-8 border border-surface-border">
        <h2 className="text-lg font-semibold text-neutral-100 mb-4">Marcar día</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Fecha</label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-surface border-surface-border text-neutral-100 rounded-md shadow-sm focus:border-accent-500 focus:ring-accent-500 p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Motivo</label>
            <input
              type="text"
              required
              maxLength={200}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Puente, suspensión de clases"
              className="w-full bg-surface border-surface-border text-neutral-100 rounded-md shadow-sm focus:border-accent-500 focus:ring-accent-500 p-2 border"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-accent-600 text-white px-4 py-2 rounded hover:bg-accent-500 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Guardando..." : "Marcar día"}
          </button>
        </form>
      </section>

      <section className="bg-surface-raised rounded-lg shadow overflow-hidden border border-surface-border">
        <table className="min-w-full divide-y divide-surface-border text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200 w-32">Fecha</th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200">Motivo</th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border bg-surface-raised">
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-neutral-500">Cargando...</td></tr>
            ) : holidays.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-neutral-500">No hay días marcados todavía.</td></tr>
            ) : (
              holidays.map((h) => (
                <tr key={h.id} className="hover:bg-surface transition-colors">
                  <td className="px-6 py-4 font-medium text-neutral-300">{h.fecha}</td>
                  <td className="px-6 py-4 text-neutral-100">{h.motivo}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="text-red-400 hover:text-red-300 hover:underline text-xs"
                    >
                      Quitar
                    </button>
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
