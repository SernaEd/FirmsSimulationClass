"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/api";
import { useAuthContext } from "@/lib/AuthContext";

type NavLink = { href: string; label: string };

const STUDENT_LINKS: NavLink[] = [
  { href: "/inicio", label: "Inicio" },
  { href: "/clase1", label: "Sesión 1" },
  { href: "/mi-equipo", label: "Mi equipo" },
  { href: "/privilegios", label: "Privilegios" },
  { href: "/mis-tickets", label: "Mis tickets" },
  { href: "/movimientos", label: "Movimientos" },
  { href: "/decimas", label: "Décimas" },
];

const ADMIN_LINKS: NavLink[] = [
  { href: "/admin/equipos", label: "Admin · Equipos" },
  { href: "/admin/economia", label: "Admin · Economía" },
  { href: "/admin/sistema", label: "Admin · Sistema" },
];

/**
 * Barra superior fija en todas las páginas (montada en el layout raíz).
 * El logo siempre enlaza a "casa": /inicio si hay sesión activa, / si no.
 *
 * Con sesión iniciada muestra un menú desplegable para saltar entre
 * secciones sin volver primero a /inicio, y concentra "Cerrar sesión" aquí
 * (antes solo vivía en /inicio, dejando sin salida a cualquier otra
 * página — incluido /test-perfil, donde una cuenta pending_profile puede
 * quedarse varada). El menú se muestra también en estado "error" de
 * AuthContext para no dejar a la persona sin forma de cerrar sesión ahí.
 */
export function TopNav() {
  const authState = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const home = authState.status === "authenticated" ? "/inicio" : "/";
  const showMenu = authState.status === "authenticated" || authState.status === "error";

  function handleLogout() {
    setOpen(false);
    auth.clearToken();
    router.replace("/");
  }

  const links =
    authState.status === "authenticated" && authState.user.estado === "active"
      ? [...STUDENT_LINKS, ...(authState.user.is_admin ? ADMIN_LINKS : [])]
      : [];

  return (
    <div className="sticky top-0 z-50 border-b border-surface-border bg-surface/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
        <Link href={home} aria-label="Ir al inicio" className="inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="IBERO" className="h-7 w-auto" />
        </Link>

        {showMenu && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Abrir menú de navegación"
              className="flex items-center justify-center h-9 w-9 rounded-md text-neutral-400 hover:text-white hover:bg-surface-raised transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>

            {open && (
              <>
                {/* Backdrop invisible: cierra el menú al hacer click fuera. */}
                <button
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-surface-border bg-surface-raised shadow-lg py-2"
                >
                  {links.length > 0 && (
                    <div className="py-1">
                      {links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          role="menuitem"
                          onClick={() => setOpen(false)}
                          className={
                            "block px-4 py-2 text-sm transition-colors " +
                            (pathname === link.href
                              ? "text-ibero-red bg-ibero-red/10"
                              : link.href.startsWith("/admin")
                                ? "text-ibero-red hover:bg-ibero-red/10"
                                : "text-neutral-200 hover:bg-surface")
                          }
                        >
                          {link.label}
                        </Link>
                      ))}
                      <div className="my-1 border-t border-surface-border" />
                    </div>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-400 hover:text-white hover:bg-surface transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
