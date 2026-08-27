"use client";

import { useEffect, useState } from "react";
import { api, StreakEvidenceOut } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

export default function AdminRachaSpotCheck() {
  const authState = useAuth({ requireAdmin: true });
  const [evidence, setEvidence] = useState<StreakEvidenceOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [previewLoading, setPreviewLoading] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<{ url: string; type: string; filename: string } | null>(null);

  const loadEvidence = async () => {
    if (authState.status !== "authenticated") return;
    setLoading(true);
    try {
      const data = await api.adminGetStreakEvidence(authState.token, 0, 50);
      setEvidence(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar la evidencia");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authState.status === "authenticated") {
      loadEvidence();
    }
  }, [authState.status]);

  useEffect(() => {
    return () => {
      if (previewData) URL.revokeObjectURL(previewData.url);
    };
  }, [previewData]);

  const handlePreview = async (id: number, path: string) => {
    if (authState.status !== "authenticated") return;
    setPreviewLoading(id);
    try {
      const { url, type } = await api.adminGetStreakEvidenceUrl(authState.token, id);
      const filename = path.split('/').pop() || "solucion.pdf";
      setPreviewData({ url, type, filename });
    } catch (err: any) {
      setError(err.message || "Error al cargar la previsualización");
    } finally {
      setPreviewLoading(null);
    }
  };

  if (authState.status === "loading") return <p className="p-8 text-neutral-500">Cargando...</p>;
  if (authState.status === "error") return <p className="p-8 text-red-500">{authState.error}</p>;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-100">Verificación Puntual (Racha)</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Aquí puedes revisar las soluciones subidas por los alumnos en caso de auditoría o disputas.
        </p>
      </header>

      {error && <div className="bg-red-900/30 border border-red-800 text-red-200 p-4 rounded mb-6">{error}</div>}

      <div className="bg-surface-raised shadow rounded-lg overflow-hidden border border-surface-border">
        <table className="min-w-full divide-y divide-surface-border text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200">Fecha/Hora</th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200">Usuario ID</th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200">Ejercicio</th>
              <th className="px-6 py-3 text-left font-semibold text-neutral-200">Solución Adjunta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border bg-surface-raised">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-neutral-500">Cargando datos...</td>
              </tr>
            ) : evidence.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-neutral-500">No hay evidencias subidas aún.</td>
              </tr>
            ) : (
              evidence.map((ev) => (
                <tr key={ev.id} className="hover:bg-surface transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-400">
                      {new Date(ev.submitted_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-neutral-100">
                      {ev.user.nombre} {ev.user.apellidos} <span className="text-neutral-500 font-normal text-xs ml-1">({ev.user.numero_cuenta})</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ev.daily_exercise_id ? (
                        <span className="text-accent-400 font-medium">Ej. #{ev.daily_exercise_id}</span>
                      ) : (
                        <span className="text-neutral-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handlePreview(ev.id, ev.solucion_path)}
                        disabled={previewLoading === ev.id}
                        className="text-accent-400 hover:text-accent-300 hover:underline flex items-center gap-1 disabled:opacity-50 disabled:no-underline"
                      >
                        {previewLoading === ev.id ? (
                          "Cargando..."
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            Ver Solución
                          </>
                        )}
                      </button>
                    </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeUp">
          <div className="bg-surface-raised border border-surface-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-popIn">
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <h2 className="text-lg font-medium text-white truncate">{previewData.filename}</h2>
              <button
                onClick={() => setPreviewData(null)}
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Cerrar modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-neutral-900 flex items-center justify-center p-4 min-h-[50vh]">
              {previewData.type.startsWith("image/") ? (
                <img src={previewData.url} alt={previewData.filename} className="max-w-full max-h-[70vh] object-contain rounded" />
              ) : previewData.type === "application/pdf" ? (
                <iframe src={previewData.url} className="w-full h-[70vh] rounded" />
              ) : (
                <div className="text-center">
                  <p className="text-neutral-400 mb-4">No hay vista previa disponible para este tipo de archivo.</p>
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = previewData.url;
                      link.download = previewData.filename;
                      link.click();
                    }}
                    className="bg-accent-600 text-white px-4 py-2 rounded hover:bg-accent-500"
                  >
                    Descargar Archivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
