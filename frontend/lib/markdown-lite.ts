/**
 * Renderizador de markdown mínimo y seguro para el cuerpo de los anuncios
 * (§11.3.1). No es un parser completo — cubre **negrita**, *itálica*,
 * `código`, [enlaces](https://...) y saltos de línea, que es lo que un
 * profesor típicamente necesita en un anuncio corto.
 *
 * Seguridad: se escapa TODO el HTML del texto original primero; las
 * transformaciones de markdown corren después y solo insertan tags que
 * nosotros mismos controlamos, así que no hay forma de que el contenido
 * del usuario "escape" hacia HTML sin escapar (XSS). Los enlaces solo se
 * aceptan con esquema http(s) explícito, bloqueando `javascript:` URIs.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderMarkdownLite(md: string): string {
  let html = escapeHtml(md);

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  html = html.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "<em>$1</em>");
  html = html.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, "<em>$1</em>");
  html = html.replace(/`([^`\n]+?)`/g, "<code>$1</code>");
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="underline text-ibero-red">$1</a>',
  );
  html = html.replace(/\n/g, "<br />");

  return html;
}
