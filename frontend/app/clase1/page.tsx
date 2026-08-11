"use client";

import Link from "next/link";
import { useAuth } from "@/lib/useAuth";

const CONTENT_URL = "/clase1-content/index.html";

export default function Clase1() {
  const authState = useAuth();

  if (authState.status !== "authenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-5xl mx-auto p-8 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/inicio" className="text-sm text-neutral-500 hover:text-neutral-300">
            ← Regresar al inicio
          </Link>
          <h1 className="text-2xl font-semibold mt-1">Sesión 1</h1>
        </div>
        <a
          href={CONTENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-neutral-400 hover:text-white underline"
        >
          Abrir en pestaña nueva ↗
        </a>
      </header>

      <iframe
        src={CONTENT_URL}
        title="Presentación · Sesión 1"
        className="w-full rounded-lg border border-surface-border"
        style={{ height: "80vh" }}
      />
    </main>
  );
}
