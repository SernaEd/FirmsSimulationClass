import Link from "next/link";

export const metadata = {
  title: "Reglas y políticas · Plataforma Cálculo 3",
};

export default function Reglas() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto p-8 space-y-10">
      <header className="space-y-2">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Regresar
        </Link>
        <h1 className="text-4xl font-semibold">Reglas y políticas</h1>
        <p className="text-neutral-400">
          Léelas antes de registrarte. Al hacerlo declaras conocerlas y aceptarlas.
        </p>
      </header>

      {/* §18.1 */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-ibero-red">
          1. Aviso de privacidad
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-neutral-300">
          <li>
            <strong className="text-white">Datos que se recolectan:</strong> nombre,
            apellidos, número de cuenta, nickname, PIN (almacenado con hash bcrypt) y
            correo institucional (opcional, solo si activas notificaciones).
          </li>
          <li>
            <strong className="text-white">Finalidad:</strong> administración del
            curso de Cálculo 3.
          </li>
          <li>
            <strong className="text-white">Retención:</strong> hasta 60 días después
            del cierre administrativo del semestre.
          </li>
          <li>
            <strong className="text-white">Terceros:</strong> solo Notion (para
            temario) y proveedor de correo (solo si activas notificaciones).
          </li>
          <li>
            <strong className="text-white">Derechos:</strong> acceso, rectificación
            o cancelación mediante solicitud escrita al profesor.
          </li>
        </ul>
      </section>

      {/* §18.2 */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-ibero-red">
          2. Reglas del curso en la plataforma
        </h2>
        <ul className="list-disc pl-5 space-y-2 text-neutral-300">
          <li>
            Los puntos ganados no se suman al promedio. Se canjean por privilegios
            académicos desde el catálogo, con folio único por ticket.
          </li>
          <li>
            El examen final y el proyecto final <strong>no admiten</strong> ningún
            privilegio que altere su formato o contenido.
          </li>
          <li>
            El foro admite publicar con nickname o de forma anónima para pares. El
            profesor siempre ve el autor real.
          </li>
          <li>
            Los kudos cuestan puntos al emisor (10 pts). Solo circulan al interior
            del propio equipo y con justificación escrita.
          </li>
          <li>
            La racha diaria corre de lunes a jueves. Viernes y fin de semana son
            días neutros. Los días festivos marcados por el profesor no cuentan
            para romper la racha.
          </li>
        </ul>
      </section>

      {/* §18.3 */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-ibero-red">
          3. Política de disputas
        </h2>
        <p className="text-neutral-300">
          Puedes abrir una disputa por: privilegio no consumido correctamente,
          ajuste discrecional considerado injusto, racha marcada como fallida
          por error, o evaluación de retroalimentación.
        </p>
        <ul className="list-disc pl-5 space-y-2 text-neutral-300">
          <li>
            <strong className="text-white">Canal:</strong> formulario en tu perfil
            (&quot;Levantar una disputa&quot;), que llega a la bandeja del profesor.
          </li>
          <li>
            <strong className="text-white">Plazo de respuesta:</strong> 5 días
            hábiles.
          </li>
          <li>
            <strong className="text-white">Escalamiento:</strong> si la respuesta
            del profesor no es satisfactoria, puedes acudir a la coordinación
            académica del programa.
          </li>
        </ul>
      </section>

      {/* §18.4 */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-ibero-red">
          4. Uso aceptable y procedimiento sancionatorio
        </h2>
        <p className="text-neutral-300 font-medium">Está prohibido:</p>
        <ul className="list-disc pl-5 space-y-2 text-neutral-300">
          <li>Compartir cuentas, PINs o respuestas.</li>
          <li>Intentar explotar bugs para obtener puntos, tickets o privilegios.</li>
          <li>Usar la plataforma para acoso, discriminación o lenguaje ofensivo.</li>
          <li>
            Suplantar la identidad de otra persona del curso en cualquier flujo
            (kudos, retroalimentación, foro, chat).
          </li>
        </ul>
        <p className="text-neutral-300 pt-2">
          Ante un presunto abuso, la persona recibe notificación por correo con la
          evidencia y tiene <strong className="text-white">48 horas hábiles</strong>{" "}
          para responder por escrito antes de que se aplique cualquier sanción
          (derecho de audiencia). Toda sanción queda registrada y puede apelarse
          ante la coordinación académica dentro de los 5 días hábiles siguientes.
        </p>
      </section>

      <footer className="text-xs text-neutral-500 pt-8 border-t border-surface-border">
        Última actualización: agosto de 2026.
      </footer>
    </main>
  );
}
