# Instructions for Claude

See [README.md](README.md) for the project overview and stack (FastAPI backend, Next.js frontend).

## Development workflow

For every coding task in this repo (new feature, bug fix, refactor), follow this sequence in order — do not skip ahead:

1. **Check for reuse before writing new code.** Search the codebase (`backend/`, `frontend/`) for existing functions, endpoints, models, schemas, hooks, components, or utilities that already do what the request needs, or that can be extended. Prefer reusing or extending existing code over duplicating logic. Only write new code when nothing suitable already exists.

2. **Implement the change.**

3. **Simplify.** Once the implementation works, run the `simplify` skill on the changed code to catch duplication, unnecessary abstraction, dead code, and other cleanups — then apply its suggested fixes.

4. **Self-review before opening a PR.** Review the diff for correctness, edge cases, and potential bugs — run the `code-review` skill (or `security-review` if the change touches auth, secrets, file uploads, or other user input) and fix anything it flags.

5. **Open the PR** only after steps 1–4 are complete.
