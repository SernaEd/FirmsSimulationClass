#!/usr/bin/env bash
# Prepara un ambiente (staging o production) dentro de /opt/calc3: clona el
# repo, genera su .env con secretos aleatorios si no existe, y hace el
# primer arranque con Docker Compose + migraciones.
#
# Corre UNA vez por ambiente, como el usuario deploy, disparado por el
# workflow .github/workflows/bootstrap-vps.yml. Es seguro volver a
# correrlo: si el checkout o el .env ya existen, no los toca (para no
# perder secretos ya en uso ni el historial de git local).
#
# Uso: bash bootstrap-environment.sh <nombre> <frontend_port> <backend_port> <host_publico> <repo_url>
# Ej:  bash bootstrap-environment.sh staging 3100 8100 203.0.113.10 https://github.com/user/repo.git

set -euo pipefail

ENV_NAME="${1:?Falta el nombre del ambiente (staging|production)}"
FRONTEND_PORT="${2:?Falta el puerto del frontend}"
BACKEND_PORT="${3:?Falta el puerto del backend}"
PUBLIC_HOST="${4:?Falta el host público (IP o dominio)}"
REPO_URL="${5:?Falta la URL del repo}"

DIR="/opt/calc3/$ENV_NAME"
COMPOSE_PROJECT="calc3-$([ "$ENV_NAME" = "production" ] && echo "prod" || echo "staging")"

echo "=== [$ENV_NAME] Checkout del repo ==="
if [ -d "$DIR/.git" ]; then
  echo "Ya existe un checkout en $DIR, no se vuelve a clonar."
else
  git clone "$REPO_URL" "$DIR"
fi

cd "$DIR"

echo "=== [$ENV_NAME] Variables de entorno (.env) ==="
if [ -f .env ]; then
  echo ".env ya existe, no se toca (evita perder secretos ya en uso)."
else
  cp .env.example .env
  sed -i "s#^ENVIRONMENT=.*#ENVIRONMENT=$ENV_NAME#" .env
  sed -i "s#^MYSQL_ROOT_PASSWORD=.*#MYSQL_ROOT_PASSWORD=$(openssl rand -hex 20)#" .env
  sed -i "s#^MYSQL_PASSWORD=.*#MYSQL_PASSWORD=$(openssl rand -hex 20)#" .env
  sed -i "s#^JWT_SECRET=.*#JWT_SECRET=$(openssl rand -hex 32)#" .env
  sed -i "s#^BACKEND_PORT=.*#BACKEND_PORT=$BACKEND_PORT#" .env
  sed -i "s#^FRONTEND_PORT=.*#FRONTEND_PORT=$FRONTEND_PORT#" .env
  sed -i "s#^NEXT_PUBLIC_API_URL=.*#NEXT_PUBLIC_API_URL=http://$PUBLIC_HOST:$BACKEND_PORT#" .env
  sed -i "s#^ALLOWED_ORIGINS=.*#ALLOWED_ORIGINS=http://$PUBLIC_HOST:$FRONTEND_PORT#" .env
  echo ".env generado con secretos aleatorios (no salen de este servidor)."
fi

echo "=== [$ENV_NAME] Primer arranque (docker compose up --build) ==="
docker compose -p "$COMPOSE_PROJECT" -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "=== [$ENV_NAME] Migraciones (alembic upgrade head) ==="
# Espera a que el backend esté healthy antes de exec (el primer build puede
# tardar; up -d ya espera 'depends_on: service_healthy' de mysql, pero el
# propio backend puede tardar unos segundos más en aceptar exec).
for i in $(seq 1 30); do
  if docker compose -p "$COMPOSE_PROJECT" exec -T backend true 2>/dev/null; then
    break
  fi
  sleep 2
done
docker compose -p "$COMPOSE_PROJECT" exec -T backend alembic upgrade head

echo "=== [$ENV_NAME] Listo: http://$PUBLIC_HOST:$FRONTEND_PORT (API en :$BACKEND_PORT) ==="
