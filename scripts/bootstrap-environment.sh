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
  echo ".env ya existe, no se regenera (evita perder secretos ya en uso)."
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

# Siempre (.env nuevo o ya existente): reconstruye DATABASE_URL a partir de
# MYSQL_USER/MYSQL_PASSWORD/MYSQL_DATABASE actuales del archivo. En
# .env.example, DATABASE_URL trae la contraseña de ejemplo escrita aparte,
# como texto plano ("change_me_user") — un bug anterior generaba
# MYSQL_PASSWORD al azar pero nunca actualizaba este campo, así que el
# backend intentaba conectarse con la contraseña de ejemplo en vez de la
# real. Reconstruirlo cada corrida (no solo al generar el .env por primera
# vez) también autocorrige cualquier .env que ya haya quedado así.
MYSQL_USER_VAL="$(grep '^MYSQL_USER=' .env | head -1 | cut -d= -f2-)"
MYSQL_PW_VAL="$(grep '^MYSQL_PASSWORD=' .env | head -1 | cut -d= -f2-)"
MYSQL_DB_VAL="$(grep '^MYSQL_DATABASE=' .env | head -1 | cut -d= -f2-)"
sed -i "s#^DATABASE_URL=.*#DATABASE_URL=mysql+pymysql://${MYSQL_USER_VAL}:${MYSQL_PW_VAL}@mysql:3306/${MYSQL_DB_VAL}#" .env

echo "=== [$ENV_NAME] Primer arranque (docker compose up --build) ==="
docker compose -p "$COMPOSE_PROJECT" -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "=== [$ENV_NAME] Migraciones (alembic upgrade head) ==="
# Reintenta el comando real (no solo si el contenedor acepta exec): en el
# primer arranque, MySQL puede reportarse "healthy" un momento antes de que
# su puerto TCP real acepte conexiones (ver nota en docker-compose.yml
# sobre el healthcheck), así que el primer intento puede fallar aunque
# 'depends_on: service_healthy' ya se haya cumplido.
MIGRATION_OK=0
for i in $(seq 1 15); do
  if docker compose -p "$COMPOSE_PROJECT" exec -T backend alembic upgrade head; then
    MIGRATION_OK=1
    break
  fi
  echo "[$ENV_NAME] alembic upgrade head falló (intento $i/15), reintentando en 5s..."
  sleep 5
done
if [ "$MIGRATION_OK" -ne 1 ]; then
  echo "ERROR [$ENV_NAME]: alembic upgrade head siguió fallando tras 15 intentos (~75s)."
  echo "Revisa 'docker compose -p $COMPOSE_PROJECT logs mysql' en el VPS."
  exit 1
fi

echo "=== [$ENV_NAME] Listo: http://$PUBLIC_HOST:$FRONTEND_PORT (API en :$BACKEND_PORT) ==="
