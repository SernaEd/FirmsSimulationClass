"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnnouncementCard } from "@/components/AnnouncementsWidget";
import { ApiError, StudentAnnouncementOut, api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

export default function Anuncios() {
  const authState = useAuth();
  const token = authState.status === "authenticated" ? authState.token : null;

  const [items, setItems] = useState<StudentAnnouncementOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await api.myAnnouncements(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  async function handleMarkRead(id: number) {
    if (!token) return;
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, leido: true } : a)));
    try {
      await api.markAnnouncementRead(token, id);
    } catch {
      load();
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
    <main className="min-h-screen max-w-2xl mx-auto p-8 space-y-6">
      <header className="space-y-1">
        <Link href="/inicio" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Regresar al inicio
        </Link>
        <h1 className="text-3xl font-semibold">Anuncios</h1>
        <p className="text-neutral-400 text-sm">
          Todos los anuncios activos, anclados y de prioridad alta primero.
        </p>
      </header>

      {error && (
        <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-neutral-500">Cargando…</p>}
      {!loading && items.length === 0 && (
        <p className="text-sm text-neutral-500 bg-surface rounded-md p-4 text-center border border-surface-border">
          No hay anuncios activos por el momento.
        </p>
      )}

      <div className="grid gap-3">
        {items.map((a) => (
          <AnnouncementCard key={a.id} announcement={a} onMarkRead={() => handleMarkRead(a.id)} />
        ))}
      </div>
    </main>
  );
}
