# Instructions for Claude

See [README.md](README.md) for the project overview and stack (FastAPI backend, Next.js frontend).

## Development workflow

For every coding task in this repo (new feature, bug fix, refactor), follow this sequence in order — do not skip ahead:

1. **Check for reuse before writing new code.** Search the codebase (`backend/`, `frontend/`) for existing functions, endpoints, models, schemas, hooks, components, or utilities that already do what the request needs, or that can be extended. Prefer reusing or extending existing code over duplicating logic. Only write new code when nothing suitable already exists.

2. **Implement the change.**

3. **Simplify.** Once the implementation works, run the `simplify` skill on the changed code to catch duplication, unnecessary abstraction, dead code, and other cleanups — then apply its suggested fixes.

4. **Self-review before opening a PR.** The `code-review` and `security-review` skills are reserved for explicit user invocation — Claude cannot trigger them directly and must not try to replicate their internal workflow by other means. Instead, do a manual self-review pass: re-read every changed file in the diff end-to-end (not just the touched lines), and check for logic errors, edge cases (empty/null/zero inputs, off-by-one, race conditions, error paths), consistency with existing patterns elsewhere in the codebase, and whether the change actually does what it claims to. Fix anything found. This is a lighter pass than the real skills, not a substitute for them — for changes touching auth, secrets, payments, file uploads, or other high-stakes surfaces, ask the user to run `/code-review` or `/security-review` themselves before merging.

5. **Open the PR** only after steps 1–4 are complete.
