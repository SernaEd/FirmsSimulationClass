# Instructions for Claude

See [README.md](README.md) for the project overview and stack (FastAPI backend, Next.js frontend).

## UI design model

[`UiDesign/`](UiDesign/README.md) is the canonical source of truth for this app's visual design — layout, spacing, color tokens, type scale, component states, and motion/interaction patterns. It's built on the **Nocturne** design system with an IBERO red accent override (see [`UiDesign/README.md`](UiDesign/README.md) for the full rationale and the token table).

**Any UI change** (new screen, new component, restyle, layout/spacing tweak) must be based on this model, not improvised:

1. Read the relevant screen section and the Design Tokens table in [`UiDesign/README.md`](UiDesign/README.md).
2. Check the clickable reference mock, `UiDesign/prototype/IBERO Cálculo 3 - Rediseño.dc.html` (open directly in a browser), for the actual look, spacing, and interaction behavior. **Never copy this HTML into the Next.js app** — recreate the design as real React/Tailwind components in `frontend/`, wired to real data, following existing component conventions (`frontend/components/`).
3. For base token values and component-level rationale, check `UiDesign/prototype/_ds/nocturne-.../styles.css` and its `readme.md`. Don't invent new colors, spacing, or type-scale values that aren't already in the token set.

**Whenever a UI/UX decision changes the design model** — a new or adjusted color/token, a different spacing or type value, a new component pattern, a changed interaction/animation, a new screen layout — update `UiDesign/README.md` (and the token values under `UiDesign/prototype/_ds/` if applicable) to reflect it, so this folder never drifts out of sync with what's actually shipped. Treat it as part of the change, not a follow-up.

## Development workflow

For every coding task in this repo (new feature, bug fix, refactor), follow this sequence in order — do not skip ahead:

1. **Check for reuse before writing new code.** Search the codebase (`backend/`, `frontend/`) for existing functions, endpoints, models, schemas, hooks, components, or utilities that already do what the request needs, or that can be extended. Prefer reusing or extending existing code over duplicating logic. Only write new code when nothing suitable already exists. For UI work specifically, also follow the [UI design model](#ui-design-model) above.

2. **Implement the change.**

3. **Simplify.** Once the implementation works, run the `simplify` skill on the changed code to catch duplication, unnecessary abstraction, dead code, and other cleanups — then apply its suggested fixes.

4. **Self-review before opening a PR.** The `code-review` and `security-review` skills are reserved for explicit user invocation — Claude cannot trigger them directly and must not try to replicate their internal workflow by other means. Instead, do a manual self-review pass: re-read every changed file in the diff end-to-end (not just the touched lines), and check for logic errors, edge cases (empty/null/zero inputs, off-by-one, race conditions, error paths), consistency with existing patterns elsewhere in the codebase, and whether the change actually does what it claims to. Fix anything found. This is a lighter pass than the real skills, not a substitute for them — for changes touching auth, secrets, payments, file uploads, or other high-stakes surfaces, ask the user to run `/code-review` or `/security-review` themselves before merging.

5. **Open the PR** only after steps 1–4 are complete.
