"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { ApiError, ForumPostOut, UserOut, api } from "@/lib/api";
import { CARD_SM } from "@/lib/ui";

const DEFAULT_DESTACAR_MONTO = 15;

function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "?";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + second).toUpperCase();
}

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CommentBody({ cuerpo }: { cuerpo: string }) {
  return (
    <div className="prose prose-sm prose-invert max-w-none text-neutral-200">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {cuerpo}
      </ReactMarkdown>
    </div>
  );
}

function ComposerFields({
  cuerpo,
  onCuerpoChange,
  esAnonimo,
  onEsAnonimoChange,
  showAnonimoToggle,
  placeholder,
}: {
  cuerpo: string;
  onCuerpoChange: (v: string) => void;
  esAnonimo: boolean;
  onEsAnonimoChange: (v: boolean) => void;
  showAnonimoToggle: boolean;
  placeholder: string;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <textarea
        required
        rows={3}
        maxLength={4000}
        value={cuerpo}
        onChange={(e) => onCuerpoChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 font-mono"
      />
      <div className="w-full rounded-md border border-surface-border bg-surface p-3 text-sm min-h-[92px] overflow-auto">
        {cuerpo.trim() ? (
          <CommentBody cuerpo={cuerpo} />
        ) : (
          <p className="text-neutral-600 italic">La vista previa aparecerá aquí.</p>
        )}
      </div>
      {showAnonimoToggle && (
        <label className="md:col-span-2 flex items-center gap-2 text-xs text-neutral-400">
          <input
            type="checkbox"
            checked={esAnonimo}
            onChange={(e) => onEsAnonimoChange(e.target.checked)}
            className="rounded border-surface-border bg-surface accent-accent-500"
          />
          Publicar de forma anónima para mis compañeros (el profesor siempre ve tu nombre real)
        </label>
      )}
    </div>
  );
}

/** Estado + submit compartido entre el composer de nivel superior y el de
 * una respuesta — ambos son "publicar un ForumPost", solo cambia el
 * parent_post_id y qué pasa después de publicar. */
function useForumComposer(
  token: string,
  sessionId: number,
  parentPostId: number | null,
  onPosted: () => Promise<void>,
) {
  const [cuerpo, setCuerpo] = useState("");
  const [esAnonimo, setEsAnonimo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cuerpo.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createForumPost(token, sessionId, {
        cuerpo: cuerpo.trim(),
        es_anonimo_para_pares: esAnonimo,
        parent_post_id: parentPostId,
      });
      setCuerpo("");
      setEsAnonimo(false);
      await onPosted();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return { cuerpo, setCuerpo, esAnonimo, setEsAnonimo, submitting, error, submit };
}

function DestacadoBadge() {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase bg-accent-500/20 text-accent-300 border-accent-500/30">
      ★ Destacado
    </span>
  );
}

function CommentRow({
  post,
  sessionId,
  token,
  currentUser,
  isReply,
  onChanged,
}: {
  post: ForumPostOut;
  sessionId: number;
  token: string;
  currentUser: UserOut;
  isReply: boolean;
  onChanged: () => Promise<void>;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const reply = useForumComposer(token, sessionId, post.id, async () => {
    await onChanged();
    setReplyOpen(false);
  });

  const [montoDestacar, setMontoDestacar] = useState(DEFAULT_DESTACAR_MONTO);
  const [destacando, setDestacando] = useState(false);
  const [destacarError, setDestacarError] = useState<string | null>(null);

  async function destacar() {
    setDestacando(true);
    setDestacarError(null);
    try {
      await api.adminMarkPostDestacado(token, sessionId, post.id, { monto_tokens: montoDestacar });
      await onChanged();
    } catch (err) {
      setDestacarError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setDestacando(false);
    }
  }

  return (
    <li className="flex gap-3 items-start">
      <div className="shrink-0 h-9 w-9 rounded-full bg-accent-500/20 text-accent-300 text-xs font-semibold flex items-center justify-center">
        {initials(post.autor_nombre)}
      </div>
      <div className={`flex-1 min-w-0 rounded-md bg-surface p-3 space-y-2`}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium text-accent-300">{post.autor_nombre}</p>
          <p className="text-[11px] text-neutral-500">{formatCommentDate(post.created_at)}</p>
          {post.destacado && <DestacadoBadge />}
          {currentUser.is_admin && post.es_anonimo_para_pares && (
            <span className="inline-flex items-center rounded-full border border-surface-border px-2 py-0.5 text-[10px] text-neutral-400">
              Anónimo para pares
            </span>
          )}
          {!currentUser.is_admin && post.es_mio && post.es_anonimo_para_pares && (
            <span className="inline-flex items-center rounded-full border border-surface-border px-2 py-0.5 text-[10px] text-neutral-400">
              Tú · tus compañeros lo ven como anónimo
            </span>
          )}
        </div>

        <CommentBody cuerpo={post.cuerpo} />

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {!isReply && (
            <button
              onClick={() => setReplyOpen((v) => !v)}
              className="rounded-md border border-surface-border hover:bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors"
            >
              {replyOpen ? "Cancelar respuesta" : "Responder"}
            </button>
          )}

          {currentUser.is_admin && !post.destacado && (
            <div className="flex items-center gap-1.5">
              <label className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                <span>Bono para {post.autor_nombre}:</span>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={montoDestacar}
                  onChange={(e) => setMontoDestacar(Number(e.target.value) || DEFAULT_DESTACAR_MONTO)}
                  className="w-16 rounded-md border border-surface-border bg-surface-raised px-2 py-1 text-xs text-white focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
                <span>Tks</span>
              </label>
              <button
                onClick={destacar}
                disabled={destacando}
                title={`Marca este comentario como destacado y acredita ${montoDestacar} Tks al banco de ${post.autor_nombre}.`}
                className="rounded-md border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 px-2.5 py-1.5 text-xs font-medium transition-colors"
              >
                {destacando ? "Destacando…" : "Destacar"}
              </button>
            </div>
          )}
        </div>

        {destacarError && <p className="text-xs text-red-400">{destacarError}</p>}

        {replyOpen && (
          <form onSubmit={reply.submit} className="pt-2 space-y-2 border-t border-neutral-900">
            <ComposerFields
              cuerpo={reply.cuerpo}
              onCuerpoChange={reply.setCuerpo}
              esAnonimo={reply.esAnonimo}
              onEsAnonimoChange={reply.setEsAnonimo}
              showAnonimoToggle={!currentUser.is_admin}
              placeholder="Escribe tu respuesta… puedes usar LaTeX con $...$"
            />
            {reply.error && <p className="text-xs text-red-400">{reply.error}</p>}
            <button
              type="submit"
              disabled={reply.submitting}
              className="rounded-md border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 px-3 py-1.5 text-xs font-medium transition-colors"
            >
              {reply.submitting ? "Publicando…" : "Publicar respuesta"}
            </button>
          </form>
        )}

        {!isReply && post.replies.length > 0 && (
          <ul className="pt-2 space-y-3 border-t border-neutral-900">
            {post.replies.map((childPost) => (
              <CommentRow
                key={childPost.id}
                post={childPost}
                sessionId={sessionId}
                token={token}
                currentUser={currentUser}
                isReply
                onChanged={onChanged}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function SessionComments({
  sessionId,
  token,
  currentUser,
}: {
  sessionId: number;
  token: string;
  currentUser: UserOut;
}) {
  const [posts, setPosts] = useState<ForumPostOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      setPosts(await api.listForumPosts(token, sessionId));
    } catch (err) {
      setListError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setLoading(false);
    }
  }, [token, sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const composer = useForumComposer(token, sessionId, null, load);

  return (
    <section className={`${CARD_SM} p-6 space-y-4`}>
      <h2 className="text-sm font-semibold text-neutral-300">Comentarios</h2>

      <form onSubmit={composer.submit} className="space-y-2">
        <ComposerFields
          cuerpo={composer.cuerpo}
          onCuerpoChange={composer.setCuerpo}
          esAnonimo={composer.esAnonimo}
          onEsAnonimoChange={composer.setEsAnonimo}
          showAnonimoToggle={!currentUser.is_admin}
          placeholder="Escribe un comentario… puedes usar LaTeX con $...$"
        />
        {composer.error && <p className="text-xs text-red-400">{composer.error}</p>}
        <button
          type="submit"
          disabled={composer.submitting}
          className="rounded-md border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 px-4 py-2 text-sm font-medium transition-colors"
        >
          {composer.submitting ? "Publicando…" : "Publicar comentario"}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-neutral-500">Cargando comentarios…</p>
      ) : listError ? (
        <p className="text-sm text-red-400">{listError}</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-4">Sé el primero en comentar.</p>
      ) : (
        <ul className="space-y-4 pt-2 border-t border-neutral-900">
          {posts.map((post) => (
            <CommentRow
              key={post.id}
              post={post}
              sessionId={sessionId}
              token={token}
              currentUser={currentUser}
              isReply={false}
              onChanged={load}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
