"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, UserOut, api, auth, pickByPronoun } from "@/lib/api";

type Status =
  | { kind: "loading" }
  | { kind: "authenticated"; user: UserOut }
  | { kind: "unauthenticated" }
  | { kind: "error"; message: string };

export default function Inicio() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const router = useRouter();

  useEffect(() => {
    const token = auth.getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    api
      .me(token)
      .then((user) => setStatus({ kind: "authenticated", user }))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          auth.clearToken();
          router.replace("/login");
          return;
        }
        setStatus({ kind: "error", message: err instanceof ApiError ? err.detail : String(err) });
      });
  }, [router]);

  function handleLogout() {
    auth.clearToken();
    router.replace("/");
  }

  if (status.kind === "loading" || status.kind === "unauthenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  if (status.kind === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-4 text-center">
          <p className="text-red-400">Error: {status.message}</p>
          <button onClick={handleLogout} className="underline text-neutral-400">
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  const { user } = status;
  const isPending = user.estado !== "active";
  // Fraseo neutro por default; se personaliza si la persona declaró pronombres.
  const bienvenida = pickByPronoun(user.pronombres, "Bienvenida", "Bienvenido", "Te damos la bienvenida");

  return (
    <main className="min-h-screen max-w-3xl mx-auto p-8 space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-ibero-red text-xs uppercase tracking-widest">
            IBERO · Cálculo 3
          </p>
          <h1 className="text-3xl font-semibold mt-1">
            Hola, {user.nombre}
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Nickname: <code>{user.nickname}</code> · Cuenta:{" "}
            <code>{user.numero_cuenta}</code>
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-neutral-400 hover:text-white underline"
        >
          Cerrar sesión
        </button>
      </header>

      {isPending ? (
        <section className="rounded-lg border border-amber-800 bg-amber-950/30 p-6 space-y-2">
          <h2 className="text-lg font-semibold text-amber-300">
            Cuenta pendiente
          </h2>
          <p className="text-sm text-amber-100/80">
            Estado actual: <code>{user.estado}</code>. Tu cuenta requiere
            aprobación del profesor antes de acceder al Dashboard, catálogo de
            privilegios y demás secciones.
          </p>
        </section>
      ) : (
        <section className="rounded-lg border border-surface-border bg-surface-raised p-6 space-y-4">
          <h2 className="text-lg font-semibold">Cuenta activa</h2>
          <p className="text-sm text-neutral-400">
            {bienvenida} a la plataforma. En próximas iteraciones aquí verás tu
            Dashboard completo: racha, saldo del banco, catálogo, foros y más.
          </p>

          <div className="grid gap-2">
            <Link
              href="/mi-equipo"
              className="block rounded-md border border-surface-border hover:bg-surface px-4 py-3 text-sm"
            >
              → Mi equipo (integrantes y nombre de firma)
            </Link>
            {user.is_admin && (
              <Link
                href="/admin/equipos"
                className="block rounded-md border border-ibero-red/60 hover:bg-ibero-red/10 px-4 py-3 text-sm text-ibero-red"
              >
                → Admin · Equipos (generar y moderar nombres)
              </Link>
            )}
          </div>
        </section>
      )}

      <footer className="text-xs text-neutral-500 pt-4 border-t border-surface-border">
        MVP · Dominio 1 (Auth) completo · <Link href="/reglas" className="underline">reglas</Link>
      </footer>
    </main>
  );
}
