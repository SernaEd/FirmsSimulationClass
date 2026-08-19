import Link from "next/link";

// Rediseño "Bienvenida" — ver UiDesign/README.md §1 (fuente de verdad de
// layout, tipografía y animación de esta pantalla).
export default function Home() {
  return (
    <main className="max-w-[1080px] mx-auto px-4 sm:px-[22.4px] pt-[88px] pb-[100px]">
      <div className="grid md:grid-cols-[1fr_0.85fr] gap-8 sm:gap-[22.4px] items-center mb-[70px] md:mb-[110px]">
        <div>
          <p
            className="text-accent-300 text-xs uppercase tracking-[0.16em] mb-4 opacity-0 animate-fadeUp"
            style={{ animationDelay: "0s" }}
          >
            IBERO · Ecuaciones Diferenciales
          </p>
          <h1
            className="text-4xl sm:text-[56px] leading-[1.05] max-w-[13ch] font-medium mb-6 opacity-0 animate-fadeUp"
            style={{ animationDelay: ".05s" }}
          >
            Tu firma consultora empieza aquí.
          </h1>
          <p
            className="text-neutral-400 text-lg max-w-[46ch] opacity-0 animate-fadeUp"
            style={{ animationDelay: ".1s" }}
          >
            Resuelve casos reales de modelado matemático en equipo, gana
            Tokens por tu trabajo y canjéalos por privilegios académicos.
          </p>
        </div>

        <div
          className="opacity-0 animate-fadeUp rounded-lg overflow-hidden aspect-[4/5] shadow-lg bg-gradient-to-br from-surface-raised to-accent-900 flex flex-col items-center justify-center gap-3 border border-surface-border"
          style={{ animationDelay: ".15s" }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-neutral-600"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="11" r="2.5" />
            <path d="M21 16l-4.5-4.5a2 2 0 0 0-2.8 0L7 18" />
          </svg>
          <p className="text-neutral-500 text-xs text-center max-w-[70%]">
            Foto del equipo trabajando en clase
          </p>
        </div>
      </div>

      <p className="text-neutral-500 text-[11px] uppercase tracking-[0.12em] mb-6">
        Empieza en menos de un minuto
      </p>
      <div className="grid sm:grid-cols-2 gap-8 sm:gap-[56px]">
        <Link
          href="/registro"
          className="group block rounded-md border border-transparent bg-surface-raised px-4 sm:px-[16.8px] py-10 space-y-3 cursor-pointer transition-all duration-[250ms] ease-out hover:-translate-y-1.5 hover:shadow-lg hover:border-accent-700"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-300"
            aria-hidden="true"
          >
            <circle cx="9" cy="8" r="3.5" />
            <path d="M3 20c0-3.6 2.7-6.5 6-6.5s6 2.9 6 6.5" />
            <path d="M17 8v6M14 11h6" />
          </svg>
          <div className="text-[17px] font-medium mt-2">Crear cuenta</div>
          <p className="text-[13px] opacity-70">
            Regístrate con tu número de cuenta y contesta el test de perfil de
            equipo — te toma unos minutos.
          </p>
          <span className="inline-flex items-center gap-1.5 mt-2 rounded-md border border-accent-500 text-accent-300 px-3 py-2 text-sm font-medium transition-colors group-hover:bg-accent-500/10">
            Registrarme
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </Link>

        <Link
          href="/login"
          className="group block rounded-md border border-transparent bg-surface-raised px-4 sm:px-[16.8px] py-10 space-y-3 cursor-pointer transition-all duration-[250ms] ease-out hover:-translate-y-1.5 hover:shadow-lg hover:border-neutral-700"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-neutral-300"
            aria-hidden="true"
          >
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <div className="text-[17px] font-medium mt-2">Iniciar sesión</div>
          <p className="text-[13px] opacity-70">
            Con tu nickname y PIN. Si lo olvidaste, tu profesor puede
            restablecerlo.
          </p>
          <span className="inline-block mt-2 rounded-md border border-neutral-700 text-neutral-200 px-3 py-2 text-sm font-medium transition-colors group-hover:bg-white/5">
            Entrar
          </span>
        </Link>
      </div>

      <p className="text-neutral-500 text-[13px] mt-14">
        Antes de registrarte, consulta las{" "}
        <Link href="/reglas" className="underline hover:text-neutral-300">
          reglas y el aviso de privacidad
        </Link>
        .
      </p>
    </main>
  );
}
