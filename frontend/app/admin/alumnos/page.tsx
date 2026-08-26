"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  StudentAdminOut,
  TeamOut,
  UserProfile,
  UserStatus,
  api,
} from "@/lib/api";
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

// Edición diferida (§ pedido: "no cambiar en vivo, agregar botón Guardar"):
// cada fila mantiene un draft local independiente de `students`; nada llama
// a la API hasta "Guardar cambios". Ver AdminAlumnosPage.handleSaveAll.
type RowDraft = {
  nombre: string;
  apellidos: string;
  perfil: UserProfile | "";
  team_id: number | null;
  balance: number;
};

function toDraft(s: StudentAdminOut): RowDraft {
  return {
    nombre: s.nombre,
    apellidos: s.apellidos,
    perfil: s.perfil ?? "",
    team_id: s.team_id,
    balance: s.balance,
  };
}

function draftsEqual(a: RowDraft, b: RowDraft): boolean {
  return (
    a.nombre === b.nombre &&
    a.apellidos === b.apellidos &&
    a.perfil === b.perfil &&
    a.team_id === b.team_id &&
    a.balance === b.balance
  );
}

function teamLabel(team: TeamOut): string {
  return team.nombre_firma ?? `Equipo #${team.id}`;
}

// Input de texto (no type="number") con buffer local: un <input type="number">
// controlado por React pierde el "-" en cuanto se escribe, porque el DOM
// reporta value="" para un número incompleto y React lo vuelve a pintar como
// "0" en el siguiente render — imposible teclear un saldo negativo. Aquí se
// guarda el texto tal cual se escribe y solo se "commitea" al draft cuando ya
// parsea a un entero completo; el efecto resincroniza el buffer si el valor
// cambia desde afuera (descartar cambios, recarga tras guardar).
function BalanceInput({
  value,
  onCommit,
  className,
}: {
  value: number;
  onCommit: (n: number) => void;
  className: string;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        if (!/^-?\d*$/.test(raw)) return;
        setText(raw);
        if (raw !== "" && raw !== "-") onCommit(Number(raw));
      }}
      className={className}
    />
  );
}

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
  draft,
  dirty,
  saveError,
  teams,
  onDraftChange,
  onApprove,
  onReject,
  onResetPin,
}: {
  student: StudentAdminOut;
  draft: RowDraft;
  dirty: boolean;
  saveError: string | null;
  teams: TeamOut[];
  onDraftChange: (patch: Partial<RowDraft>) => void;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
  onResetPin: (id: number) => Promise<string>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [tempPin, setTempPin] = useState<string | null>(null);

  async function run(action: string, fn: () => Promise<void>) {
    setBusy(action);
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.detail : String(err));
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
  const inputClass =
    "w-full rounded-md border border-surface-border bg-surface px-2 py-1 text-xs text-white focus:border-ibero-red focus:outline-none";

  return (
    <>
      <tr
        className={
          "border-b border-surface-border/60 align-top transition-colors hover:bg-surface/60 " +
          (dirty ? "bg-accent-900/10" : "")
        }
      >
        <td className="py-3 pr-4">
          {isRejected ? (
            <p className="text-sm font-medium text-white">
              {student.nombre} {student.apellidos}
            </p>
          ) : (
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-1.5">
              <input
                value={draft.nombre}
                onChange={(e) => onDraftChange({ nombre: e.target.value })}
                placeholder="Nombre"
                className={inputClass + " sm:w-28"}
              />
              <input
                value={draft.apellidos}
                onChange={(e) => onDraftChange({ apellidos: e.target.value })}
                placeholder="Apellidos"
                className={inputClass + " sm:w-32"}
              />
            </div>
          )}
          <p className="mt-1 text-xs text-neutral-500">@{student.nickname}</p>
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
              value={draft.perfil}
              onChange={(e) => onDraftChange({ perfil: e.target.value as UserProfile | "" })}
              className={inputClass}
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
        <td className="py-3 pr-4">
          {isRejected ? (
            student.team_nombre ?? (
              <span className="text-xs text-neutral-600">Sin equipo</span>
            )
          ) : (
            <select
              value={draft.team_id ?? ""}
              onChange={(e) =>
                onDraftChange({ team_id: e.target.value === "" ? null : Number(e.target.value) })
              }
              className={inputClass}
            >
              <option value="">Sin equipo</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {teamLabel(t)}
                </option>
              ))}
            </select>
          )}
        </td>
        <td className="py-3 pr-4 text-right">
          {isRejected ? (
            <span className="text-sm tabular-nums text-white">{student.balance}</span>
          ) : (
            <BalanceInput
              value={draft.balance}
              onCommit={(n) => onDraftChange({ balance: n })}
              className={inputClass + " text-right tabular-nums"}
            />
          )}
        </td>
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
                {rejectButton("Rechazar", `¿Rechazar la cuenta de ${student.nombre} ${student.apellidos}?`)}
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
                `¿Rechazar (desactivar) la cuenta activa de ${student.nombre} ${student.apellidos}? Perderá acceso a la plataforma.`,
              )}
          </div>
        </td>
      </tr>
      {(tempPin || actionError || saveError) && (
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
            {actionError && <p className="mt-1 text-xs text-red-400">{actionError}</p>}
            {saveError && (
              <p className="mt-1 text-xs text-red-400">No se guardó: {saveError}</p>
            )}
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
  const [teams, setTeams] = useState<TeamOut[]>([]);
  const [drafts, setDrafts] = useState<Record<number, RowDraft>>({});
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<UserStatus>>(new Set());
  const [tokenNote, setTokenNote] = useState("");
  const [saving, setSaving] = useState(false);

  // `preserveIds`: filas cuyo draft NO debe pisarse con el valor recién
  // llegado del servidor — usado tras guardar, para las filas que fallaron
  // (así el admin no pierde lo que intentó guardar).
  const reload = useCallback(
    async (preserveIds?: Set<number>) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const [studentList, teamList] = await Promise.all([
          api.adminListAllStudents(token),
          api.adminListTeams(token),
        ]);
        setStudents(studentList);
        setTeams(teamList);
        setDrafts((prev) => {
          const next: Record<number, RowDraft> = {};
          for (const s of studentList) {
            next[s.id] = preserveIds?.has(s.id) ? (prev[s.id] ?? toDraft(s)) : toDraft(s);
          }
          return next;
        });
      } catch (err) {
        setError(err instanceof ApiError ? err.detail : String(err));
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (token) reload();
  }, [token, reload]);

  const studentById = useMemo(() => {
    const map: Record<number, StudentAdminOut> = {};
    for (const s of students) map[s.id] = s;
    return map;
  }, [students]);

  // Una sola pasada sobre `drafts` para las tres derivadas que el resto de
  // la página necesita: qué filas están sucias (como Set, para lookup O(1)
  // por fila al renderizar la tabla), en qué orden, y cuáles tocan el saldo.
  const { dirtySet, dirtyIds, balanceChangedIds } = useMemo(() => {
    const dirtySet = new Set<number>();
    const dirtyIds: number[] = [];
    const balanceChangedIds: number[] = [];
    for (const idStr of Object.keys(drafts)) {
      const id = Number(idStr);
      const student = studentById[id];
      if (!student) continue;
      const baseline = toDraft(student);
      if (draftsEqual(drafts[id], baseline)) continue;
      dirtySet.add(id);
      dirtyIds.push(id);
      if (drafts[id].balance !== baseline.balance) balanceChangedIds.push(id);
    }
    return { dirtySet, dirtyIds, balanceChangedIds };
  }, [drafts, studentById]);

  // Aplica una respuesta del servidor (aprobar/rechazar) a `students` y
  // resincroniza el draft de esa fila con el nuevo valor. Sin esto, un draft
  // sin guardar (ej. un nombre a medio editar) sobrevive a un "Rechazar" en
  // la misma fila — la fila pasa a solo-lectura pero el draft queda "sucio"
  // y se reenviaría igual en el siguiente "Guardar cambios".
  function applyServerUpdate(id: number, patch: Partial<StudentAdminOut>) {
    const current = studentById[id];
    if (!current) return;
    const merged = { ...current, ...patch };
    setStudents((prev) => prev.map((s) => (s.id === id ? merged : s)));
    setDrafts((prev) => ({ ...prev, [id]: toDraft(merged) }));
  }

  function discardChanges() {
    setDrafts(Object.fromEntries(students.map((s) => [s.id, toDraft(s)])));
    setRowErrors({});
    setError(null);
  }

  async function handleSaveAll() {
    if (dirtyIds.length === 0) return;
    if (balanceChangedIds.length > 0 && !tokenNote.trim()) {
      setError("Escribe una nota para justificar el cambio de saldo antes de guardar.");
      return;
    }
    setSaving(true);
    setError(null);
    const nextErrors: Record<number, string> = {};

    // Los hasta 4 campos de una fila son escrituras independientes (cada una
    // pega a un endpoint distinto) — se disparan en paralelo con
    // allSettled en vez de encadenarlas con await secuencial, y un fallo en
    // un campo no le impide intentarse a los demás de la misma fila.
    await Promise.all(
      dirtyIds.map(async (id) => {
        const student = studentById[id];
        const draft = drafts[id];
        const baseline = toDraft(student);

        const calls: Promise<unknown>[] = [];
        if (draft.nombre.trim() !== baseline.nombre || draft.apellidos.trim() !== baseline.apellidos) {
          calls.push(api.adminRenameUser(token!, id, draft.nombre.trim(), draft.apellidos.trim()));
        }
        if (draft.perfil && draft.perfil !== baseline.perfil) {
          calls.push(api.adminReassignProfile(token!, id, draft.perfil));
        }
        if (draft.team_id !== baseline.team_id) {
          calls.push(api.adminSetUserTeam(token!, id, draft.team_id));
        }
        if (draft.balance !== baseline.balance) {
          calls.push(
            api.adminAdjustTokens(token!, {
              user_id: id,
              delta: draft.balance - baseline.balance,
              nota: tokenNote.trim(),
            }),
          );
        }

        const results = await Promise.allSettled(calls);
        const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
        if (failed.length > 0) {
          nextErrors[id] = failed
            .map((r) => (r.reason instanceof ApiError ? r.reason.detail : String(r.reason)))
            .join(" · ");
        }
      }),
    );

    setRowErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) setTokenNote("");
    await reload(new Set(Object.keys(nextErrors).map(Number)));
    setSaving(false);
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
          Todas las cuentas inscritas. Edita nombre, perfil, equipo y saldo directamente en la
          tabla — los cambios no se aplican hasta que presionas &ldquo;Guardar cambios&rdquo;.
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
            <table className="w-full min-w-[820px] border-collapse text-sm">
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
                    draft={drafts[s.id] ?? toDraft(s)}
                    dirty={dirtySet.has(s.id)}
                    saveError={rowErrors[s.id] ?? null}
                    teams={teams}
                    onDraftChange={(patch) =>
                      setDrafts((prev) => ({ ...prev, [s.id]: { ...prev[s.id], ...patch } }))
                    }
                    onApprove={async (id) => {
                      const updated = await api.adminApproveUser(token!, id);
                      applyServerUpdate(id, updated);
                    }}
                    onReject={async (id) => {
                      const updated = await api.adminRejectUser(token!, id);
                      applyServerUpdate(id, updated);
                    }}
                    onResetPin={async (id) => {
                      const res = await api.adminResetUserPin(token!, id);
                      return res.temp_pin;
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-surface-border/60 pt-4">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {balanceChangedIds.length > 0 && (
                <input
                  value={tokenNote}
                  onChange={(e) => setTokenNote(e.target.value)}
                  placeholder="Nota que justifica el/los ajuste(s) de saldo (obligatoria)…"
                  className="min-w-[240px] flex-1 rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-ibero-red focus:outline-none"
                />
              )}
              <p className="text-xs text-neutral-500">
                {dirtyIds.length === 0
                  ? "Sin cambios pendientes."
                  : `${dirtyIds.length} fila(s) con cambios sin guardar.`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={discardChanges}
                disabled={dirtyIds.length === 0 || saving}
                className="rounded-md border border-surface-border px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
              >
                Descartar cambios
              </button>
              <button
                onClick={handleSaveAll}
                disabled={dirtyIds.length === 0 || saving}
                className="rounded-lg border border-accent-500 px-5 py-2 text-sm font-medium text-accent-300 hover:bg-accent-500/10 disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
