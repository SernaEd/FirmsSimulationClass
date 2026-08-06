import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-10">
        <header className="space-y-3">
          <p className="text-ibero-red text-sm uppercase tracking-widest">
            IBERO · Cálculo 3
          </p>
          <h1 className="text-5xl font-semibold leading-tight">
            Plataforma de Aprendizaje
          </h1>
          <p className="text-neutral-400 text-lg">
            Ecuaciones Diferenciales — consultoría de ingeniería aplicada.
          </p>
        </header>

        <section className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/registro"
            className="flex-1 text-center rounded-lg bg-ibero-red hover:bg-ibero-red-dark transition-colors px-6 py-4 text-white font-medium"
          >
            Registrarme
          </Link>
          <Link
            href="/login"
            className="flex-1 text-center rounded-lg border border-surface-border hover:bg-surface-raised transition-colors px-6 py-4 font-medium"
          >
            Iniciar sesión
          </Link>
        </section>

        <p className="text-sm text-neutral-500">
          Antes de registrarte, consulta las{" "}
          <Link href="/reglas" className="underline hover:text-neutral-300">
            reglas y aviso de privacidad
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
