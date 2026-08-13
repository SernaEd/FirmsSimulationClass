"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Field } from "@/components/Field";
import { ApiError, UserPronouns, api, auth } from "@/lib/api";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

export default function Registro() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const pin = String(form.get("pin") ?? "");
    const pinConfirm = String(form.get("pin_confirm") ?? "");

    if (pin !== pinConfirm) {
      setStatus({ kind: "error", message: "El PIN y su confirmación no coinciden." });
      return;
    }

    setStatus({ kind: "submitting" });

    try {
      // El registro ya deja la sesión lista (RegisterOut trae el token):
      // la persona pasa directo al test de perfil (§3), sin loguearse
      // aparte con el PIN que acaba de crear.
      const result = await api.register({
        nombre: String(form.get("nombre") ?? "").trim(),
        apellidos: String(form.get("apellidos") ?? "").trim(),
        numero_cuenta: String(form.get("numero_cuenta") ?? "").trim(),
        nickname: String(form.get("nickname") ?? "").trim(),
        pin,
        correo_institucional: String(form.get("correo_institucional") ?? "").trim() || undefined,
        pronombres: (form.get("pronombres") as UserPronouns) ?? "prefiero_no_decir",
        acepta_reglas: form.get("acepta_reglas") === "on",
      });
      auth.setToken(result.access_token);
      router.push("/test-perfil");
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : String(err);
      setStatus({ kind: "error", message });
    }
  }

  return (
    <main className="min-h-screen max-w-lg mx-auto p-8 space-y-8">
      <header className="space-y-2">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Regresar
        </Link>
        <h1 className="text-3xl font-semibold">Registro</h1>
        <p className="text-neutral-400 text-sm">
          Al terminar tomarás un breve test de perfil de trabajo en equipo.
          Después, tu cuenta queda pendiente de aprobación del profesor.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre(s)" name="nombre" required minLength={1} maxLength={100} />
          <Field label="Apellidos" name="apellidos" required minLength={1} maxLength={100} />
        </div>
        <Field label="Número de cuenta (Sin Digito)" name="numero_cuenta" required minLength={4} maxLength={20} />
        <Field
          label="Nickname"
          name="nickname"
          required
          minLength={3}
          maxLength={40}
          hint="Es visible para el resto del grupo. Puedes usar letras, números y espacios."
        />
        <Field
          label="PIN"
          name="pin"
          type="password"
          required
          minLength={4}
          maxLength={32}
          hint="Mínimo 4 caracteres. Elige algo memorable pero no obvio."
        />
        <Field
          label="Confirmar PIN"
          name="pin_confirm"
          type="password"
          required
          minLength={4}
          maxLength={32}
          hint="Escríbelo de nuevo para confirmar."
        />
        <Field
          label="Correo institucional (opcional)"
          name="correo_institucional"
          type="email"
          hint="Solo lo pediremos si activas notificaciones desde tu perfil."
        />

        <label className="block space-y-1.5">
          <span className="block text-sm text-neutral-300">Pronombres (opcional)</span>
          <select
            name="pronombres"
            defaultValue="prefiero_no_decir"
            className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 text-white focus:border-ibero-red focus:outline-none focus:ring-1 focus:ring-ibero-red"
          >
            <option value="prefiero_no_decir">Prefiero no decirlo</option>
            <option value="ella">ella</option>
            <option value="el">él</option>
            <option value="elle">elle</option>
          </select>
          <span className="block text-xs text-neutral-500">
            Nos ayuda a personalizar mensajes contigo. Puedes cambiarlo después.
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm text-neutral-300 pt-2">
          <input
            type="checkbox"
            name="acepta_reglas"
            required
            className="mt-1 h-4 w-4 accent-ibero-red"
          />
          <span>
            He leído y acepto las{" "}
            <Link href="/reglas" target="_blank" className="underline hover:text-white">
              reglas y el aviso de privacidad
            </Link>
            .
          </span>
        </label>

        {status.kind === "error" && (
          <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
            {status.message}
          </p>
        )}

        <button
          type="submit"
          disabled={status.kind === "submitting"}
          className="w-full rounded-lg bg-ibero-red hover:bg-ibero-red-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-6 py-3 font-medium"
        >
          {status.kind === "submitting" ? "Registrando..." : "Crear cuenta"}
        </button>

        <p className="text-center text-sm text-neutral-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="underline hover:text-neutral-300">
            Inicia sesión
          </Link>
          .
        </p>
      </form>
    </main>
  );
}

