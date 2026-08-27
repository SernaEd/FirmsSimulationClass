"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ActionBanner } from "@/components/ActionBanner";
import { BalanceWidget } from "@/components/BalanceWidget";
import { IconRings, RoleIcon } from "@/components/icons";
import { TeamOut, UserStatus, api, pickByPronoun } from "@/lib/api";
import { profileLabel, profileAvatarClass } from "@/lib/profile";
import { useAuth } from "@/lib/useAuth";

// Rediseño "Dashboard" — ver UiDesign/README.md §2. Los enlaces de Admin ya
// no se duplican aquí (ver TopNav): el propio audit del prototipo (hallazgo
// #4) señala que mezclarlos con los enlaces de alumno es el patrón a evitar;
// TopNav ya ofrece el grupo "Admin" como affordance separado.
export default function Inicio() {
  const authState = useAuth();
  const token = authState.status === "authenticated" ? authState.token : null;
  // Cuentas no activas (pending_profile/pending_approval) no tienen acceso a
  // /me/team (403) y de cualquier forma useAuth() ya las redirige fuera de
  // /inicio — evita el fetch de equipo mientras eso ocurre.
  const isActive = authState.status === "authenticated" && authState.user.estado === "active";
  const [team, setTeam] = useState<TeamOut | null | undefined>(undefined);

  useEffect(() => {
    if (!token || !isActive) return;
    let cancelled = false;
    api
      .myTeam(token)
      .then((t) => {
        if (!cancelled) setTeam(t);
      })
      .catch(() => {
        if (!cancelled) setTeam(null);
      });
    return () => {
      cancelled = true;
    };
  }, [token, isActive]);

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
        <p className="text-red-400">Error: {authState.error}</p>
      </main>
    );
  }

  const { user } = authState;
  const isPending = user.estado !== "active";
  // Fraseo neutro por default; se personaliza si la persona declaró pronombres.
  const bienvenida = pickByPronoun(
    user.pronombres,
    "Bienvenida",
    "Bienvenido",
    "Te damos la bienvenida",
  );

  return (
    <main className="max-w-[960px] mx-auto px-4 sm:px-8 pt-[22.4px] pb-20">
      <header className="mb-8">
        <p className="text-accent-400 text-xs uppercase tracking-[0.12em] mb-1">
          Cálculo 3
        </p>
        <h1 className="text-[30px] font-medium">Hola, {user.nombre}</h1>
        {user.perfil && (
          <div className={`mt-5 inline-flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm border border-black/10 ${profileAvatarClass(user.perfil)}`}>
            <RoleIcon perfil={user.perfil} />
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-80 mb-0.5">Rol de equipo</p>
              <p className="text-xl font-semibold leading-none">{profileLabel(user.perfil)}</p>
            </div>
          </div>
        )}
        {team !== undefined && (
          <p className="text-neutral-500 text-[13px] mt-1">
            {team ? (
              <>
                Firma <strong className="text-neutral-100 font-medium">{team.nombre_firma ?? "(sin nombre)"}</strong>
              </>
            ) : (
              "Aún no tienes equipo asignado."
            )}
          </p>
        )}
      </header>

      {isPending ? (
        <PendingAccountCard estado={user.estado} />
      ) : (
        <>
          <div className="grid md:grid-cols-[1.1fr_.9fr] gap-5 mb-5">
            <StreakCard />
            <BalanceWidget token={authState.token} />
          </div>

          <ActionBanner
            href="/privilegios"
            icon={<IconRings />}
            title="Canjea tus Tokens"
            description="Explora el catálogo de privilegios académicos y usa tu saldo acumulado."
            cta="Ver catálogo"
          />
        </>
      )}

      <footer className="text-xs text-neutral-500 pt-8 mt-8 border-t border-surface-border">
        MVP · <Link href="/reglas" className="underline">reglas</Link>
        {!isPending && (
          <>
            {" "}
            · <span className="opacity-70">{bienvenida} a la plataforma.</span>
          </>
        )}
      </footer>
    </main>
  );
}

// La racha diaria (evidencia de WebAssign, backend/app/models/streak.py) no
// tiene endpoint todavía — solo existe el modelo/migración (ver
// UiDesign/README.md, "Implementation notes"). Se muestra la estructura
// completa del diseño en estado "próximamente" en vez de datos inventados;
// cuando exista /me/streak basta con reemplazar el contenido estático de
// abajo por los datos reales.
function StreakCard() {
  const days = ["L", "M", "X", "J", "L", "M", "X", "J"];
  return (
    <section className="rounded-md bg-surface-raised shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-[0.1em] text-accent-400">Racha activa</p>
            <span className="inline-flex items-center text-[10px] tracking-wide px-1.5 py-0.5 rounded border border-accent-500 text-accent-300">
              Próximamente
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[38px] font-medium tabular-nums text-neutral-600">—</span>
            <span className="text-neutral-500 text-sm">días seguidos</span>
          </div>
        </div>
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-600"
          aria-hidden="true"
        >
          <path d="M12 21c-4 0-7-2.7-7-6.5C5 10 8 7 9 3c.5 3 3 4 3 7 0-2 1.5-3 1.5-5C16 7 19 10 19 14.5 19 18.3 16 21 12 21Z" />
        </svg>
      </div>

      <div className="grid grid-cols-8 gap-1.5 mb-4">
        {days.map((d, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center gap-0.5 h-10 rounded-sm bg-neutral-900 border border-neutral-800 text-neutral-600"
          >
            <span className="text-[9px] opacity-60">{d}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-neutral-500">
        Se activa en cuanto subas tu primera evidencia de racha (reporte de
        WebAssign).
      </p>
    </section>
  );
}

// Estado no-activo del dashboard. Antes usaba colores ámbar de "advertencia"
// y mostraba el enum crudo (`user.estado`) — leía como si el registro
// hubiera fallado. `pending_profile` no debería llegar aquí en la práctica
// (useAuth ya redirige a /test-perfil), pero se cubre por si acaso; el caso
// real es pending_approval (en revisión, tono neutro/informativo) vs.
// rejected (necesita acción, tono con más énfasis) — dos estados con
// implicaciones distintas que antes se mostraban con el mismo mensaje.
function PendingAccountCard({ estado }: { estado: UserStatus }) {
  if (estado === "rejected") {
    return (
      <section className="rounded-md bg-surface-raised shadow-md p-8 text-center space-y-3">
        <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-accent-800 text-accent-100">
          <IconXCircle />
        </div>
        <h2 className="text-lg font-medium">Tu solicitud no fue aprobada</h2>
        <p className="text-neutral-400 text-sm max-w-sm mx-auto">
          Tu profesor revisó tu registro y no lo aprobó. Contáctalo
          directamente si crees que fue un error o quieres más información.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-md bg-surface-raised shadow-md p-8 text-center space-y-3">
      <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-accent2-800 text-accent2-100">
        <IconClock />
      </div>
      <h2 className="text-lg font-medium">
        {estado === "pending_profile" ? "Perfil de equipo pendiente" : "Tu cuenta está en revisión"}
      </h2>
      <p className="text-neutral-400 text-sm max-w-sm mx-auto">
        {estado === "pending_profile"
          ? "Termina el test de perfil de trabajo en equipo para continuar."
          : "Ya completaste tu registro. Tu profesor debe aprobar tu cuenta antes de que puedas ver tu saldo, tu equipo y el resto de la plataforma — normalmente no tarda mucho."}
      </p>
      {estado === "pending_profile" && (
        <Link
          href="/test-perfil"
          className="inline-flex rounded-md border border-accent-500 text-accent-300 hover:bg-accent-500/10 transition-colors px-5 py-2 text-sm font-medium"
        >
          Continuar test de perfil
        </Link>
      )}
    </section>
  );
}

function IconClock() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function IconXCircle() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
    </svg>
  );
}
