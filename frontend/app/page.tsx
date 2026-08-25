import Link from "next/link";
import { IconArrowRight } from "@/components/icons";

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
            Ecuaciones Diferenciales
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
          className="opacity-0 animate-fadeUp rounded-lg overflow-hidden aspect-[4/5] shadow-lg bg-gradient-to-br from-surface-raised to-accent-900 border border-surface-border"
          style={{ animationDelay: ".15s" }}
        >
          <svg
            viewBox="0 0 480 600"
            className="h-full w-full"
            fill="none"
            role="img"
            aria-labelledby="equation-illustration-title equation-illustration-description"
          >
            <title id="equation-illustration-title">
              Gráfica de una ecuación diferencial
            </title>
            <desc id="equation-illustration-description">
              Campo de pendientes con curvas de solución alrededor de un eje de
              coordenadas.
            </desc>
            <defs>
              <pattern id="graph-paper" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M32 0H0V32" stroke="#ffffff" strokeOpacity=".055" />
              </pattern>
              <linearGradient id="glow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#d8143a" stopOpacity=".22" />
                <stop offset="1" stopColor="#d8143a" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="480" height="600" fill="#15151a" />
            <rect width="480" height="600" fill="url(#graph-paper)" />
            <circle cx="390" cy="84" r="190" fill="url(#glow)" />

            <g stroke="#e7e7eb" strokeOpacity=".25" strokeWidth="1.5" strokeLinecap="round">
              <path d="M92 126l18-9M132 126l18-9M172 126l18-9M212 126l18-9M252 126l18-9M292 126l18-9M332 126l18-9" />
              <path d="M92 166l18-9M132 166l18-9M172 166l18-9M212 166l18-9M252 166l18-9M292 166l18-9M332 166l18-9" />
              <path d="M92 206l18-9M132 206l18-9M172 206l18-9M212 206l18-9M252 206l18-9M292 206l18-9M332 206l18-9" />
              <path d="M92 246l18-9M132 246l18-9M172 246l18-9M212 246l18-9M252 246l18-9M292 246l18-9M332 246l18-9" />
              <path d="M92 286l18-9M132 286l18-9M172 286l18-9M212 286l18-9M252 286l18-9M292 286l18-9M332 286l18-9" />
              <path d="M92 326l18-9M132 326l18-9M172 326l18-9M212 326l18-9M252 326l18-9M292 326l18-9M332 326l18-9" />
              <path d="M92 366l18-9M132 366l18-9M172 366l18-9M212 366l18-9M252 366l18-9M292 366l18-9M332 366l18-9" />
            </g>

            <g stroke="#f4f4f5" strokeOpacity=".72" strokeWidth="2" strokeLinecap="round">
              <path d="M76 326H392M236 106V434" />
              <path d="M392 326l-10-6M392 326l-10 6M236 106l-6 10M236 106l6 10" />
            </g>
            <g fill="#f4f4f5" fillOpacity=".64" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="14">
              <text x="400" y="322">x</text>
              <text x="244" y="98">y</text>
              <text x="245" y="348">0</text>
            </g>
            <path d="M82 392C137 361 145 282 196 244C246 206 274 249 307 207C340 165 356 119 391 82" stroke="#f2b6c1" strokeOpacity=".35" strokeWidth="12" strokeLinecap="round" />
            <path d="M82 392C137 361 145 282 196 244C246 206 274 249 307 207C340 165 356 119 391 82" stroke="#f05a78" strokeWidth="3" strokeLinecap="round" />
            <path d="M82 214C130 258 164 302 218 309C273 316 314 277 348 232C365 210 379 188 397 166" stroke="#ffffff" strokeOpacity=".85" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="236" cy="326" r="5" fill="#ffffff" />
            <g fill="#f4f4f5" fontFamily="Georgia, serif" fontStyle="italic">
              <text x="286" y="142" fontSize="24" fill="#f2b6c1">dy/dx = f(x, y)</text>
              <text x="82" y="486" fontSize="18" fillOpacity=".72">soluciones · modelos · cambio</text>
            </g>
          </svg>
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
            <IconArrowRight />
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
