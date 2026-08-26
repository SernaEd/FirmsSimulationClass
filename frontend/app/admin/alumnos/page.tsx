"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, StudentAdminOut, UserProfile, UserStatus, api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { toggleSet } from "@/lib/toggleSet";
import { PROFILE_LABEL } from "@/lib/profile";

const PROFILE_OPTIONS: UserProfile[] = ["analista", "modelador", "integrador"];

const STATUS_LABEL: Record<UserStatus, string> = {
  pending_profile: "Test de perfil pendiente",
  pending_approval: "Por aprobar",
  active: "Activo",
  rejected: "Rechazado",
};

const STATUS_BADGE: Record<UserStatus, string> = {
  pending_profile: "bg-amber-950/50 border border-amber-800/60 text-amber-300",
  pending_approval: "bg-amber-950/50 border border-amber-800/60 text-amber-300",
  active: "bg-emerald-950/40 border border-emerald-800/60 text-emerald-300",
  rejected: "bg-red-950/40 border border-red-800/60 text-red-300",
};

const STATUS_FILTER_OPTIONS: UserStatus[] = [
  "pending_approval",
  "pending_profile",
  "active",
  "rejected",
];

function StatusBadge({ estado }: { estado: UserStatus }) {
  return (
    <span
      className={
        "inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider " +
        STATUS_BADGE[estado]
      }
    >
      {STATUS_LABEL[estado]}
    </span>
  );
}

function StudentRow({
  student,
  onApprove,
  onReject,
  onResetPin,
  onReassignProfile,
}: {
  student: StudentAdminOut;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
  onResetPin: (id: number) => Promise<string>;
  onReassignProfile: (id: number, perfil: UserProfile) => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tempPin, setTempPin] = useState<string | null>(null);

  async function run(action: string, fn: () => Promise<void>) {
    setBusy(action);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(null);
    }
  }

  const handleResetPin = () =>
    run("reset-pin", async () => setTempPin(await onResetPin(student.id)));

  // Helper de JSX (no un componente): evita redefinir un tipo de componente
  // en cada render, que rompería el foco/estado si React lo tratara como
  // una identidad nueva por render.
  function rejectButton(label: string, confirmMsg: string) {
    return (
      <button
        onClick={() => {
          if (window.confirm(confirmMsg)) run("reject", () => onReject(student.id));
        }}
        disabled={busy !== null}
        className="rounded-md border border-red-800 px-2.5 py-1 text-[11px] text-red-300 hover:bg-red-950/40 disabled:opacity-50"
      >
        {busy === "reject" ? "…" : label}
      </button>
    );
  }

  const isPending = student.estado === "pending_approval" || student.estado === "pending_profile";
  const isRejected = student.estado === "rejected";
  const fullName = `${student.nombre} ${student.apellidos}`;

  return (
    <>
      <tr className="border-b border-surface-border/60 align-top hover:bg-surface/60 transition-colors">
        <td className="py-3 pr-4">
          <p className="text-sm font-medium text-white">{fullName}</p>
          <p className="text-xs text-neutral-500">@{student.nickname}</p>
        </td>
        <td className="py-3 pr-4 font-mono text-sm text-neutral-300">{student.numero_cuenta}</td>
        <td className="py-3 pr-4">
          <StatusBadge estado={student.estado} />
        </td>
        <td className="py-3 pr-4">
          {isRejected ? (
            <span className="text-xs text-neutral-600">—</span>
          ) : (
            <select
              value={student.perfil ?? ""}
              disabled={busy !== null}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                run("reassign", () => onReassignProfile(student.id, v as UserProfile));
              }}
              className="rounded-md border border-surface-border bg-surface px-2 py-1 text-xs text-white disabled:opacity-50 focus:border-ibero-red focus:outline-none"
            >
              <option value="" disabled>
                Sin perfil
              </option>
              {PROFILE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PROFILE_LABEL[p]}
                </option>
              ))}
            </select>
          )}
        </td>
        <td className="py-3 pr-4 text-sm text-neutral-300">
          {student.team_nombre ??
            (student.team_id ? (
              `Equipo #${student.team_id}`
            ) : (
              <span className="text-neutral-600">Sin equipo</span>
            ))}
        </td>
        <td className="py-3 pr-4 text-right text-sm tabular-nums text-white">{student.balance}</td>
        <td className="py-3 pl-0">
          <div className="flex flex-wrap justify-end gap-1.5">
            {isPending && (
              <>
                <button
                  onClick={() => run("approve", () => onApprove(student.id))}
                  disabled={busy !== null}
                  className="rounded-md bg-emerald-800 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy === "approve" ? "…" : "Aprobar"}
                </button>
                {rejectButton("Rechazar", `¿Rechazar la cuenta de ${fullName}?`)}
              </>
            )}
            {!isRejected && (
              <button
                onClick={handleResetPin}
                disabled={busy !== null}
                className="rounded-md border border-surface-border px-2.5 py-1 text-[11px] text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
              >
                {busy === "reset-pin" ? "…" : "Resetear PIN"}
              </button>
            )}
            {student.estado === "active" &&
              rejectButton(
                "Desactivar",
                `¿Rechazar (desactivar) la cuenta activa de ${fullName}? Perderá acceso a la plataforma.`,
              )}
          </div>
        </td>
      </tr>
      {(tempPin || error) && (
        <tr className="border-b border-surface-border/60">
          <td colSpan={7} className="pb-3">
            {tempPin && (
              <div className="flex items-center justify-between gap-3 rounded-md border border-accent-700/60 bg-accent-900/30 px-3 py-2">
                <p className="text-xs text-accent-200">
                  PIN temporal para @{student.nickname}:{" "}
                  <span className="font-mono text-sm tracking-wider text-white">{tempPin}</span> —
                  entrégalo al alumno de forma segura.
                </p>
                <button
                  onClick={() => setTempPin(null)}
                  className="shrink-0 text-[11px] text-neutral-400 hover:text-white"
                >
                  Listo
                </button>
              </div>
            )}
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminAlumnosPage() {
  const authState = useAuth({ requireAdmin: true });
  const token = authState.status === "authenticated" ? authState.token : null;

  const [students, setStudents] = useState<StudentAdminOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<UserStatus>>(new Set());

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setStudents(await api.adminListAllStudents(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) reload();
  }, [token, reload]);

  // Envuelve una mutación (approve/reject/reassign) con el reload posterior
  // que todas comparten — solo reset-pin no toca datos listados y por eso
  // no pasa por aquí.
  function mutateAndReload<Args extends unknown[]>(fn: (...args: Args) => Promise<unknown>) {
    return async (...args: Args) => {
      await fn(...args);
      await reload();
    };
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (statusFilter.size > 0 && !statusFilter.has(s.estado)) return false;
      if (!q) return true;
      return (
        s.nombre.toLowerCase().includes(q) ||
        s.apellidos.toLowerCase().includes(q) ||
        s.nickname.toLowerCase().includes(q) ||
        s.numero_cuenta.toLowerCase().includes(q)
      );
    });
  }, [students, search, statusFilter]);

  if (authState.status !== "authenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <header className="space-y-1">
        <Link href="/inicio" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Regresar al inicio
        </Link>
        <h1 className="text-3xl font-semibold">Admin · Alumnos</h1>
        <p className="text-neutral-400 text-sm">
          Todas las cuentas inscritas, con estado, perfil, equipo y saldo, y acciones directas
          por fila.
        </p>
      </header>

      {error && (
        <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, nickname o cuenta…"
          className="w-full sm:w-72 rounded-md border border-surface-border bg-surface px-3 py-1.5 text-sm text-white placeholder:text-neutral-600 focus:border-ibero-red focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTER_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => toggleSet(statusFilter, setStatusFilter, s)}
              className={
                "rounded-md px-2.5 py-1 text-xs " +
                (statusFilter.has(s)
                  ? "bg-accent-500/10 text-accent-300 ring-1 ring-inset ring-accent-500"
                  : "bg-surface text-neutral-300 hover:bg-surface-border")
              }
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        {loading ? "Cargando…" : `${filtered.length} de ${students.length} alumnos.`}
      </p>

      <section className="rounded-lg border border-surface-border bg-surface-raised p-4 sm:p-6">
        {loading ? (
          <p className="text-sm text-neutral-500">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">
            {students.length === 0
              ? "Aún no hay alumnos inscritos."
              : "Ningún alumno coincide con el filtro."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-surface-border text-left">
                  <th className="pb-2 pr-4 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
                    Alumno
                  </th>
                  <th className="pb-2 pr-4 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
                    Cuenta
                  </th>
                  <th className="pb-2 pr-4 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
                    Estado
                  </th>
                  <th className="pb-2 pr-4 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
                    Perfil
                  </th>
                  <th className="pb-2 pr-4 text-[11px] font-medium uppercase tracking-widest text-neutral-500">
                    Equipo
                  </th>
                  <th className="pb-2 pr-4 text-right text-[11px] font-medium uppercase tracking-widest text-neutral-500">
                    Saldo (Tks)
                  </th>
                  <th className="pb-2 text-right text-[11px] font-medium uppercase tracking-widest text-neutral-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    onApprove={mutateAndReload((id: number) => api.adminApproveUser(token!, id))}
                    onReject={mutateAndReload((id: number) => api.adminRejectUser(token!, id))}
                    onResetPin={async (id) => {
                      const res = await api.adminResetUserPin(token!, id);
                      return res.temp_pin;
                    }}
                    onReassignProfile={mutateAndReload((id: number, perfil: UserProfile) =>
                      api.adminReassignProfile(token!, id, perfil),
                    )}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
