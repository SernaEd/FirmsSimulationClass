# Plataforma Cálculo 3 — IBERO

Plataforma de aprendizaje para el curso de Ecuaciones Diferenciales (Cálculo 3).

Consulta [`implementation_plan_v2.md`](implementation_plan_v2.md) para el diseño completo,
[`plan_de_tareas_mvp.md`](plan_de_tareas_mvp.md) para el roadmap de implementación, y
[`casos_licitaciones.md`](casos_licitaciones.md) para el banco de casos reales usados en las
licitaciones (§10).

## Arranque en desarrollo

1. Copia las variables de entorno:

   ```bash
   cp .env.example .env
   ```

   Edita `.env` y ajusta al menos `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD` y `JWT_SECRET`.

2. Levanta los servicios con Docker Compose:

   ```bash
   docker compose up --build
   ```

3. Verifica:
   - Frontend: <http://localhost:3000>
   - Backend (Swagger docs): <http://localhost:8000/docs>
   - Health check: <http://localhost:8000/health>
   - Health check con DB: <http://localhost:8000/health/db>

El servicio `seed` (solo corre con `ENVIRONMENT=development`, ver
`docker-compose.yml` y `backend/scripts/seed_dev_data.py`) aplica las
migraciones pendientes y deja listas dos cuentas para loguearte en
<http://localhost:3000/login> sin pasar por el registro:

| Rol    | Cuenta | PIN  |
| ------ | ------ | ---- |
| Admin  | 1234   | 1234 |
| Alumno | 9876   | 9876 |

Es idempotente — puedes volver a correr `docker compose up` sin que falle
por cuentas duplicadas. Para volver a correrlo a mano (por ejemplo si
borraste la BD): `docker compose run --rm seed`.

Para detener: `docker compose down`. Para limpiar la BD también: `docker compose down -v` (o borra `./data/mysql/`).

## Arranque en producción / staging

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

En prod el código no se monta con bind mount (usa la imagen), MySQL no expone puerto al host y Uvicorn corre con 4 workers.

Para el despliegue real al VPS (configuración inicial del servidor + pipeline
de GitHub Actions), ver [`DEPLOYMENT.md`](DEPLOYMENT.md) — incluye la guía
paso a paso completa. El workflow vive en
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## Análisis estático (Qodana)

En cada PR y push a `main` que toque `backend/` corre
[`.github/workflows/qodana.yml`](.github/workflows/qodana.yml), que analiza
el backend con el linter Community (gratuito) de
[Qodana](https://www.jetbrains.com/qodana/) para Python — no requiere
token ni licencia. El frontend no se analiza porque el linter de Qodana
para JS/TS es de pago. Configuración del linter en
[`backend/qodana.yaml`](backend/qodana.yaml).

## Estructura

```
E:\Teaching\
├── backend/          FastAPI + SQLAlchemy + Alembic (Python 3.11)
├── frontend/         Next.js 14 App Router + TypeScript + Tailwind
├── uploads/          Archivos subidos por alumnos (no en git)
├── data/mysql/       Datos persistentes de MySQL (no en git)
├── docker-compose.yml         (dev, hot reload)
├── docker-compose.prod.yml    (overrides de prod)
├── .env.example              (plantilla — copiar a .env)
└── implementation_plan_v2.md  (diseño)
```

## Migraciones de base de datos

Alembic ya está configurado. Cuando se agreguen modelos (Fase 1 del roadmap):

```bash
# Generar migración
docker compose exec backend alembic revision --autogenerate -m "descripción"

# Aplicar migraciones
docker compose exec backend alembic upgrade head
```

## Zona horaria

Todos los contenedores corren en `America/Mexico_City` (configurable via `TZ` en `.env`).
