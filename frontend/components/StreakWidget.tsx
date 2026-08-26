import { FormEvent, useEffect, useState } from "react";
import { api, StreakDayOut } from "../lib/api";

export function StreakWidget({ token }: { token: string }) {
  const [streakDays, setStreakDays] = useState<StreakDayOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchStreak = async () => {
    try {
      const now = new Date();
      const days = await api.getMyStreak(token, now.getFullYear(), now.getMonth() + 1);
      setStreakDays(days);
    } catch (err: any) {
      setError(err.message || "Error al cargar la racha.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url || !file) {
      setError("Debes proveer tanto el enlace como la captura de pantalla.");
      return;
    }
    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("webassign_report_url", url);
    formData.append("captura", file);

    try {
      await api.submitStreakEvidence(token, formData);
      setUrl("");
      setFile(null);
      await fetchStreak(); // Refrescar historial
    } catch (err: any) {
      setError(err.message || "Error al subir evidencia.");
    } finally {
      setSubmitting(false);
    }
  };

  // Buscar el día actual
  const todayStr = new Date().toISOString().split("T")[0];
  const todayStreak = streakDays.find((d) => d.fecha === todayStr);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completado": return "bg-green-500 text-white";
      case "fallido": return "bg-red-500 text-white";
      case "neutro": return "bg-gray-400 text-white";
      case "pase_aplicado": return "bg-blue-500 text-white";
      case "pendiente_revision": return "bg-yellow-500 text-white";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Evidencia del Día (Racha)</h2>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
              {error}
            </div>
          )}

          {todayStreak && todayStreak.estado === "completado" ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg mb-6 flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <p className="font-semibold">¡Evidencia recibida!</p>
                <p className="text-sm">Has completado tu racha del día de hoy.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enlace al reporte de WebAssign
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.webassign.net/..."
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Captura de pantalla
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? "Enviando..." : "Subir evidencia"}
              </button>
            </form>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Historial del mes</h3>
            <div className="flex flex-wrap gap-2">
              {streakDays.length === 0 && (
                <p className="text-sm text-gray-500">No hay historial este mes.</p>
              )}
              {streakDays.map((day) => (
                <div
                  key={day.id}
                  title={`${day.fecha} - ${day.estado}`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getStatusColor(day.estado)}`}
                >
                  {day.fecha.split("-")[2]}
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Completado</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Fallido</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Pase de racha</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span> Revisión</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
