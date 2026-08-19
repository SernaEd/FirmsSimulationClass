"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/api";
import { useAuthContext } from "@/lib/AuthContext";
import { toggleSet } from "@/lib/toggleSet";

type NavLink = { href: string; label: string };
/** Página principal del navtree con sub-páginas propias (p. ej. Sesiones, Admin). */
type NavGroup = { label: string; links: NavLink[]; accent?: boolean };
type NavEntry = NavLink | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "links" in entry;
}

const STUDENT_ENTRIES: NavEntry[] = [
  { href: "/inicio", label: "Inicio" },
  { label: "Sesiones", links: [{ href: "/clase1", label: "Sesión 1" }] },
  { href: "/mi-equipo", label: "Mi equipo" },
  { href: "/privilegios", label: "Privilegios" },
  { href: "/mis-tickets", label: "Mis tickets" },
  { href: "/movimientos", label: "Movimientos" },
  { href: "/decimas", label: "Décimas" },
];

const ADMIN_GROUP: NavGroup = {
  label: "Admin",
  accent: true,
  links: [
    { href: "/admin/equipos", label: "Equipos" },
    { href: "/admin/economia", label: "Economía" },
    { href: "/admin/sistema", label: "Sistema" },
  ],
};

const ALL_GROUPS: NavGroup[] = [...STUDENT_ENTRIES.filter(isGroup), ADMIN_GROUP];

function groupsContaining(pathname: string): string[] {
  return ALL_GROUPS.filter((g) => g.links.some((link) => link.href === pathname)).map(
    (g) => g.label,
  );
}

function linkClassName(active: boolean, indent: boolean) {
  return (
    "block py-2 text-sm transition-colors " +
    (indent ? "pl-8 pr-4 " : "px-4 ") +
    (active
      ? "text-accent-300 bg-accent-500/10"
      : indent
        ? "text-neutral-300 hover:bg-surface"
        : "text-neutral-200 hover:bg-surface")
  );
}

/** Una entrada del navtree: enlace directo, o grupo expandible con sub-enlaces. */
function NavMenuEntry({
  entry,
  pathname,
  expanded,
  onToggleGroup,
  onNavigate,
}: {
  entry: NavEntry;
  pathname: string;
  expanded: boolean;
  onToggleGroup: (label: string) => void;
  onNavigate: () => void;
}) {
  if (!isGroup(entry)) {
    return (
      <Link
        href={entry.href}
        role="menuitem"
        onClick={onNavigate}
        className={linkClassName(pathname === entry.href, false)}
      >
        {entry.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => onToggleGroup(entry.label)}
        aria-expanded={expanded}
        className={
          "flex w-full items-center justify-between px-4 py-2 text-sm transition-colors " +
          (entry.accent
            ? "text-accent-300 hover:bg-accent-500/10"
            : "text-neutral-200 hover:bg-surface")
        }
      >
        {entry.label}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={"transition-transform " + (expanded ? "rotate-180" : "")}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {expanded && (
        <div role="group">
          {entry.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={onNavigate}
              className={linkClassName(pathname === link.href, true)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(groupsContaining(pathname)));
  const home = authState.status === "authenticated" ? "/inicio" : "/";
  const showMenu = authState.status === "authenticated" || authState.status === "error";

  // Al navegar a una página dentro de un grupo, ese grupo se abre solo (sin
  // cerrar los demás) para no esconder la sección donde la persona está parada.
  useEffect(() => {
    const active = groupsContaining(pathname);
    if (active.some((label) => !expandedGroups.has(label))) {
      setExpandedGroups((prev) => new Set([...prev, ...active]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function handleLogout() {
    setOpen(false);
    auth.clearToken();
    router.replace("/");
  }

  const entries: NavEntry[] =
    authState.status === "authenticated" && authState.user.estado === "active"
      ? [...STUDENT_ENTRIES, ...(authState.user.is_admin ? [ADMIN_GROUP] : [])]
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
                  {entries.length > 0 && (
                    <div className="py-1">
                      {entries.map((entry) => (
                        <NavMenuEntry
                          key={isGroup(entry) ? entry.label : entry.href}
                          entry={entry}
                          pathname={pathname}
                          expanded={isGroup(entry) && expandedGroups.has(entry.label)}
                          onToggleGroup={(label) => toggleSet(expandedGroups, setExpandedGroups, label)}
                          onNavigate={() => setOpen(false)}
                        />
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
