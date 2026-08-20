# Handoff: IBERO Cálculo 3 — UI/UX Redesign

## Overview
A UI/UX redesign for the "Plataforma Cálculo 3" LMS-style app (repo: `SernaEd/FirmsSimulationClass`, branch `main`, Next.js 14 App Router + Tailwind frontend, FastAPI backend). The redesign covers the welcome/auth screen, the student dashboard ("Inicio"), and the team screen ("Mi equipo"), plus a written UX audit of the rest of the app. The goal: move the product's currently plain/bordered-box UI toward a dark, IBERO-branded interface with real visual hierarchy and lightweight gamification motion (token count-up, streak calendar, hover micro-interactions), since the platform's core purpose is a token/privilege economy students should *want* to open daily.

## About the Design Files
The `prototype/` folder is a **design reference built in HTML** (an internal "Design Component" format, self-contained and viewable directly in a browser — open `prototype/IBERO Cálculo 3 - Rediseño.dc.html`). It is a clickable, non-functional mockup: navigation between the three screens works, buttons don't call any real API. **Do not copy this HTML into the Next.js app.** The task is to recreate this design's layout, spacing, color, type, and interactions as real React components inside the existing `frontend/` Next.js + Tailwind + TypeScript codebase, wired to its real data (`lib/api.ts`, `useAuth`, etc.), following the app's existing component conventions (see `frontend/components/`, e.g. `BalanceWidget`).

## Fidelity
**High-fidelity.** Colors, spacing, type scale and component states below are final — implement pixel-close using Tailwind utilities/theme extension, not placeholders.

## Design system this build is grounded in
The mockups use the **Nocturne** design system (bundled in `prototype/_ds/nocturne-.../`) as the base token set and component vocabulary, with one deliberate override: Nocturne's default blurple accent is replaced with an IBERO red, and the blurple ramp is kept as a secondary accent (used for the "Modelador" role tag and similar secondary indicators). Read `prototype/_ds/nocturne-172cc265-6033-42f0-8772-f22fcece377d/readme.md` for the full system rationale (spacing scale, elevation, "why outlined buttons," etc.) — the app's Tailwind config should encode these same tokens (see Design Tokens below) so future screens stay consistent without re-deriving them.

## Screens

### 1. Bienvenida (Welcome / auth)
- **Purpose**: Landing + register/login entry point (maps to `frontend/app/page.tsx`, `login/`, `registro/`).
- **Layout**: Centered column, max-width 1080px, top padding 88px. Two-part vertical stack:
  1. Hero row: `grid-template-columns: 1fr 0.85fr`, gap 22.4px (`--space-8`), vertically centered. Left: kicker + H1 + subhead. Right: a photo (4:5 aspect ratio, `border-radius: 14px` / `--radius-lg`, `box-shadow: var(--shadow-lg)`), wrapped in the design system's `.lighten` class (`mix-blend-mode: lighten`) if the photo has a dark/black background — prefer a real photo of students/team working.
  2. Below (56px+ gap): a small uppercase label ("Empieza en menos de un minuto"), then a 2-column card grid (gap 56px) — "Crear cuenta" and "Iniciar sesión" cards.
- **Hero copy** (verbatim):
  - Kicker: "IBERO · Ecuaciones Diferenciales"
  - H1: "Tu firma consultora empieza aquí." — 56px, line-height 1.05, max-width ~13ch, weight 500 (Inter — never bolder)
  - Subhead: "Resuelve casos reales de modelado matemático en equipo, gana Tokens por tu trabajo y canjéalos por privilegios académicos." — 18px, color `--color-neutral-400`, max-width ~46ch
- **Cards**: each `padding: 40px 16.8px` (`--space-6` horizontal), an outline icon (36px, stroke `--color-accent-300` for the register card / `--color-neutral-300` for login), a title (17px, card-title style), a body line (13px, 70% opacity), and one button (`.btn-primary` for register — outlined red; `.btn-secondary` for login — outlined neutral).
- **Card hover**: `transform: translateY(-6px)`, `box-shadow: var(--shadow-lg)`, border fades in (`--color-accent-700` on the register card, `--color-neutral-700` on login), transition `.25s ease` on transform/shadow/border-color. Cursor pointer on the whole card, not just the button.
- **Fade-in on load**: each hero/card block animates in with a `fadeUp` keyframe (opacity 0→1, translateY 10px→0, `.5s ease`), staggered ~50ms apart (kicker → H1 → subhead → hero image → cards).
- Footer line: "Antes de registrarte, consulta las reglas y el aviso de privacidad." — 13px, `--color-neutral-500`.

### 2. Dashboard ("Inicio")
- **Purpose**: Student home — replaces the current plain link-list `frontend/app/inicio/page.tsx`.
- **Layout**: max-width 880px, padding `22.4px 11.2px 80px` (`--space-8 --space-4`).
  - Header: kicker "IBERO · Cálculo 3", H1 "Hola, {nombre}" (30px), a meta line showing firm name + active module.
  - Row 1 (grid `1.1fr .9fr`, gap 11.2px): **Racha (streak) card** and **Saldo del banco (token balance) card**.
  - Row 2: "Accesos rápidos" — a 4-column card grid of quick-access tiles (icon + label), one tile flagged "Nuevo" for the not-yet-built file upload/preview feature.
- **Streak card**: kicker "Racha activa", a big number (38px, tabular) + "días seguidos" label, a flame icon (outline, `--color-accent-400`) top-right. Below: an 8-cell grid (2 weeks × Mon–Thu, the only days that count per the app's streak rules) — each cell 40px tall, rounded (`--radius-sm`), showing a weekday-letter + either a checkmark (done, tinted `--color-accent-800` bg / `--color-accent-300` text), a shield icon (streak-freeze used, tinted with the *secondary* accent ramp `--color-accent-2-800`/`-300`), an outlined "today" state (`--color-accent-400` border, no fill), or a plain neutral cell (future/not-yet-reached). Cells pop in on mount (`popIn` keyframe: scale .6→1, opacity 0→1, staggered 60ms apart, `cubic-bezier(.2,1.4,.4,1)` for a slight overshoot). Below the grid: "Siguiente hito: N días" / "+30 Tks" row, then a 6px rounded progress bar (`--color-neutral-800` track, gradient fill `--color-accent-600`→`--color-accent-400`, animates width on change over 1s).
- **Token balance card**: kicker "Saldo del banco", a large number (40px, tabular nums) that **counts up** from 0 to the real balance on mount/screen-enter (ease-out cubic, ~1000ms, via `requestAnimationFrame`) + "Tks" unit label. Below: last 3 ledger movements (source name left, `+N Tks` right in `--color-accent-300`), each row separated by a 1px `--color-neutral-900` bottom border. Footer: a ghost button "Ver movimientos" linking to the full paginated ledger (existing `/movimientos` page).
- **Quick-access tiles**: 4-column grid, gap 8.4px (`--space-3`), each a card (elev-sm) with an outline icon (20px, `--color-accent-400`) + 13px label, `cursor:pointer`, hover: lift 2px + border tint `--color-accent-600`. Tiles: Mi equipo, Privilegios, Foro, **Entregas y archivos** (new — tag "Nuevo" top-right in an outlined tag).

### 3. Mi equipo (My team)
- **Purpose**: Team roster + team chat (maps to `frontend/app/mi-equipo/page.tsx`).
- **Layout**: max-width 1080px, padding `64px 11.2px 100px`.
  - Header (flex row, space-between, 56px bottom margin, 32px bottom padding, 1px `--color-neutral-900` bottom border): firm name (34px H1) + a red "N integrantes" tag on the left; an overlapping avatar cluster (38px circles, initials, -10px negative margin, 2px `--color-bg` border acting as a separator ring) on the right.
  - Body: 3-column grid (`1.1fr 1fr 0.8fr`, gap 36px, align-items:start):
    1. **Integrantes** card — one row per member: 38px initials avatar (background/text from that member's role ramp — red ramp for "Integrador", secondary/blurple ramp for "Modelador", neutral ramp for "Analista"), name (14px) + role-hint subtext (12px, muted) + a role tag on the right. Row hover: subtle `--color-surface` background fill, rounded.
    2. **Chat del equipo** card — one row per message: avatar (same initials style) + a message bubble (`--color-surface` bg, rounded, sender name in 11px `--color-accent-300`, message 13px). Each message row gets 20px bottom padding + a 1px `--color-neutral-900` bottom border so consecutive messages read as distinct entries (this replaced a too-tight original pass — keep the divider). A message input pinned at the bottom of the card.
    3. Right column (28px gap, two stacked cards): a "Resumen" card (team Tokens total, last licitación placement — each stat as a 22px number + 12px muted label) and a "Nombre de la firma aprobado" card with a ghost "Solicitar cambio" button.
- **Role → color mapping** (consistent everywhere a role shows): Analista → neutral ramp / outlined tag; Integrador → primary (red) ramp / filled tag; Modelador → secondary (blurple) ramp / filled tag.

## Interactions & Behavior
- **Screen nav**: top nav bar (`.nav` component) persists across all three screens — brand mark left, "Inicio"/"Mi equipo" real nav links, right-aligned segmented control (Bienvenida / Auditoría UX) in the prototype only — in the real app this becomes normal top-level routing, no segmented control needed.
- **Token count-up**: on entering the dashboard, animate the balance number from 0 to its real value, ease-out-cubic, ~1s. Re-run this only on a real balance *change* (not on every re-render) in production — e.g. animate from old value to new value when a purchase/kudos changes the balance.
- **Card hover states**: every clickable card lifts (`translateY(-2px)` to `-6px` depending on size) and gains a colored border on hover — never just a background darken, which is too subtle to read as "clickable" against Nocturne's already-dark surfaces.
- **Streak cell entrance**: stagger-animate in on first paint of the dashboard (not on every re-render — guard with a "seen" flag/localStorage or component-mount-only state).
- **Focus states**: rely on Nocturne's existing `:focus-visible { outline: 2px solid var(--color-accent) }` — don't override.

## State Management
- Dashboard needs: `user` (name, pronouns, active module), `tokenBalance` (number, drives the count-up), `movements` (last 3 ledger entries), `streakDays` + `streakCells` (last 8 school-day states: done/shield/today/future), `nextMilestone` + `progressPct`.
- Team screen needs: `team` (name, member list with id/name/role/avatar-initials), `chatMessages` (paginated/live via the existing team WebSocket chat, not built in this mock), `teamStats` (Tokens total, last licitación placement).
- Both screens are currently static/mocked in the prototype — wire to real endpoints (`GET /me/tokens`, `GET /me/tokens/movements`, `GET /me/team`, team chat websocket) per `implementation_plan_v2.md`.

## Design Tokens
Base tokens come from Nocturne (`prototype/_ds/.../styles.css` — copy this file's `:root` block as your source of truth). The IBERO override on top of it:

```css
--color-bg: #161826;
--color-surface: #232532;
--color-text: #e9e9ed;

/* IBERO red — now the PRIMARY accent (was Nocturne's blurple) */
--color-accent: #c8102e;
--color-accent-100: #fdecee;
--color-accent-200: #f7cfd5;
--color-accent-300: #ee9fab;   /* use for accent-colored body/paragraph text */
--color-accent-400: #e26775;
--color-accent-500: #c8102e;   /* base */
--color-accent-600: #a30e26;
--color-accent-700: #7c0b1e;
--color-accent-800: #571626;   /* tinted fills/hovers on dark ground */
--color-accent-900: #34121b;

/* Nocturne's original blurple — now SECONDARY accent (role tags, info notes) */
--color-accent-2-100: #f5f4ff;
--color-accent-2-300: #d2cefd;
--color-accent-2-800: #423e5d;
--color-accent-2-900: #2b293a;

/* Neutral ramp, spacing, radius, shadow — unchanged from Nocturne, see styles.css */
```
Font: Inter for heading and body (`--font-heading` / `--font-body`), weight 500 max for headings (never bolder — hierarchy is via size/space, not weight). Spacing/radius/shadow: use Nocturne's `--space-*` / `--radius-*` / `--shadow-*` scale as-is, do not invent new values.

**Contrast note**: don't use `--color-accent` (500, fully saturated) directly as *text* on the dark surfaces — it fails readability. Always use `--color-accent-300` for accent-colored text/labels/icons at body sizes, and reserve full-saturation `--color-accent` for borders, large icons, and background tints.

## Assets
- Hero photo on the welcome screen: placeholder only (`image-slot` in the prototype) — needs a real photo of students/team working, ideally shot on a dark/black background so it can use Nocturne's `.lighten` blend treatment.
- Icons: simple outline SVGs (24×24 viewbox, `stroke-width:1.75`, `stroke-linecap/linejoin:round`, `currentColor`) approximating Phosphor's style — swap for real Phosphor icons (per the design system) during implementation: flame (streak), coin/rings (tokens), users (team), chat bubble (forum), folder+arrow (uploads), check (streak done), shield (streak freeze).

## Files
- `prototype/IBERO Cálculo 3 - Rediseño.dc.html` — the clickable design reference (open directly in a browser).
- `prototype/_ds/nocturne-172cc265-6033-42f0-8772-f22fcece377d/` — the full Nocturne design system source (tokens, component HTML references, readme) the mock is built on.
- `prototype/support.js`, `prototype/image-slot.js` — runtime dependencies of the `.dc.html` file; needed only to view the prototype, not to implement it.

## Also produced this session (not included as files)
A written UX audit covering the screens *not* mocked here (privileges catalog, tickets, admin inbox, registration) is included as its own screen inside the prototype (click "Auditoría UX" in the top-right control) — read it there for the full list of recommendations before starting implementation.
