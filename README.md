# Plataforma Cálculo 3 — IBERO

Plataforma de aprendizaje para el curso de Ecuaciones Diferenciales (Cálculo 3).

Consulta [`implementation_plan_v2.md`](implementation_plan_v2.md) para el diseño completo y
[`plan_de_tareas_mvp.md`](plan_de_tareas_mvp.md) para el roadmap de implementación.

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

Para detener: `docker compose down`. Para limpiar la BD también: `docker compose down -v` (o borra `./data/mysql/`).

## Arranque en producción / staging

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

En prod el código no se monta con bind mount (usa la imagen), MySQL no expone puerto al host y Uvicorn corre con 4 workers.

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
