async function fetchBackendHealth() {
  // En SSR (dentro del contenedor), usamos el nombre del servicio Docker.
  // En cliente/navegador, usaríamos NEXT_PUBLIC_API_URL — pero este fetch
  // corre en servidor, así que preferimos INTERNAL_API_URL.
  const apiUrl =
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/health`, { cache: "no-store" });
    if (!res.ok) return { status: "error", error: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    return { status: "error", error: String(err) };
  }
}

export default async function Home() {
  const backend = await fetchBackendHealth();

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <header className="space-y-2">
          <p className="text-ibero-red text-sm uppercase tracking-widest">
            IBERO · Cálculo 3
          </p>
          <h1 className="text-4xl font-semibold">
            Plataforma de Aprendizaje
          </h1>
          <p className="text-neutral-400">
            Ecuaciones Diferenciales — consultoría de ingeniería aplicada.
          </p>
        </header>

        <section className="rounded-lg border border-surface-border bg-surface-raised p-6 space-y-3">
          <h2 className="text-lg font-semibold">Estado de servicios</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-neutral-400">Frontend</dt>
            <dd className="text-emerald-400">ok</dd>
            <dt className="text-neutral-400">Backend</dt>
            <dd className={backend.status === "ok" ? "text-emerald-400" : "text-red-400"}>
              {backend.status}
              {backend.timestamp ? ` · ${backend.timestamp}` : ""}
              {backend.error ? ` · ${backend.error}` : ""}
            </dd>
          </dl>
        </section>

        <footer className="text-xs text-neutral-500">
          MVP · Fundación en marcha. Consultar <code>plan_de_tareas_mvp.md</code>.
        </footer>
      </div>
    </main>
  );
}
