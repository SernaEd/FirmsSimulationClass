"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BalanceWidget } from "@/components/BalanceWidget";
import { auth, pickByPronoun } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

export default function Inicio() {
  const authState = useAuth();
  const router = useRouter();

  function handleLogout() {
    auth.clearToken();
    router.replace("/");
  }

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
        <div className="max-w-md w-full space-y-4 text-center">
          <p className="text-red-400">Error: {authState.error}</p>
          <button onClick={handleLogout} className="underline text-neutral-400">
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  const { user, token } = authState;
  const isPending = user.estado !== "active";
  // Fraseo neutro por default; se personaliza si la persona declaró pronombres.
  const bienvenida = pickByPronoun(
    user.pronombres,
    "Bienvenida",
    "Bienvenido",
    "Te damos la bienvenida",
  );

  return (
    <main className="min-h-screen max-w-3xl mx-auto p-8 space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-ibero-red text-xs uppercase tracking-widest">
            IBERO · Cálculo 3
          </p>
          <h1 className="text-3xl font-semibold mt-1">Hola, {user.nombre}</h1>
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
        <>
          <BalanceWidget token={token} />

          <section className="rounded-lg border border-surface-border bg-surface-raised p-6 space-y-4">
            <h2 className="text-lg font-semibold">Accesos</h2>
            <p className="text-sm text-neutral-400">
              {bienvenida} a la plataforma. En próximas iteraciones aquí verás
              tu Dashboard completo: racha, catálogo de privilegios, foros y más.
            </p>

            <div className="grid gap-2">
              <Link
                href="/mi-equipo"
                className="block rounded-md border border-surface-border hover:bg-surface px-4 py-3 text-sm"
              >
                → Mi equipo (integrantes y nombre de firma)
              </Link>
              <Link
                href="/privilegios"
                className="block rounded-md border border-surface-border hover:bg-surface px-4 py-3 text-sm"
              >
                → Catálogo de privilegios (canjear Tokens)
              </Link>
              <Link
                href="/mis-tickets"
                className="block rounded-md border border-surface-border hover:bg-surface px-4 py-3 text-sm"
              >
                → Mis tickets (privilegios comprados)
              </Link>
              <Link
                href="/movimientos"
                className="block rounded-md border border-surface-border hover:bg-surface px-4 py-3 text-sm"
              >
                → Movimientos (historial del banco)
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
        </>
      )}

      <footer className="text-xs text-neutral-500 pt-4 border-t border-surface-border">
        MVP · <Link href="/reglas" className="underline">reglas</Link>
      </footer>
    </main>
  );
}
