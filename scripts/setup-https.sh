#!/usr/bin/env bash
# Pone nginx + Let's Encrypt (certbot) delante de PRODUCCIÓN, sirviendo en
# dos subdominios propios (uno para el frontend, otro para el backend), y
# restringe los puertos publicados por Docker a localhost — así el único
# punto de entrada público queda en 80/443.
#
# Corre como root, disparado por .github/workflows/setup-https.yml. Solo
# toca producción — staging se queda como está (IP:puerto), ver
# DEPLOYMENT.md Fase 0 sobre esa decisión.
#
# Uso: bash setup-https.sh <frontend_domain> <api_domain> <letsencrypt_email>
# Ej:  bash setup-https.sh uia.calculo3.grapheke.com api.uia.calculo3.grapheke.com tu@correo.com

set -euo pipefail

FRONTEND_DOMAIN="${1:?Falta el dominio del frontend}"
API_DOMAIN="${2:?Falta el dominio de la API}"
LE_EMAIL="${3:?Falta el correo para Lets Encrypt}"

PROD_DIR="/opt/calc3/production"
COMPOSE_PROJECT="calc3-prod"

if ! command -v nginx >/dev/null 2>&1; then
  echo "=== Verificando que 80/443 estén libres (nginx todavía no instalado) ==="
  if ss -tlnp 2>/dev/null | grep -qE ':80[[:space:]]|:443[[:space:]]'; then
    echo "ERROR: el puerto 80 o 443 ya está en uso por otro proceso (no nginx,"
    echo "que todavía no está instalado en este VPS). Instalar nginx fallaría al"
    echo "intentar escuchar ahí. Revisa qué lo está usando antes de continuar:"
    ss -tlnp 2>/dev/null | grep -E ':80[[:space:]]|:443[[:space:]]' || true
    exit 1
  fi
fi

echo "=== Instalando nginx y certbot ==="
# Si nginx ya está instalado (por otro proyecto en este VPS), esto no lo
# reinstala ni toca su configuración existente — los server blocks de
# calc3 se agregan como sitios nuevos en sites-available/, sin pisar los
# que ya tengas.
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx

echo "=== Firewall: abrir 80/443 (agrega reglas, no toca el resto) ==="
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw status verbose
else
  echo "ufw no está instalado, se omite (ver Fase 1.5/2 de DEPLOYMENT.md)."
fi

echo "=== Server blocks de nginx (HTTP, certbot los sube a HTTPS después) ==="
cat > /etc/nginx/sites-available/calc3-frontend.conf <<NGINX
server {
    listen 80;
    server_name $FRONTEND_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX

cat > /etc/nginx/sites-available/calc3-api.conf <<NGINX
server {
    listen 80;
    server_name $API_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/calc3-frontend.conf /etc/nginx/sites-enabled/calc3-frontend.conf
ln -sf /etc/nginx/sites-available/calc3-api.conf /etc/nginx/sites-enabled/calc3-api.conf
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

echo "=== Certificados Let's Encrypt (certbot --nginx) ==="
certbot --nginx \
  -d "$FRONTEND_DOMAIN" \
  -d "$API_DOMAIN" \
  --non-interactive --agree-tos -m "$LE_EMAIL" --redirect

echo "=== Renovación automática ==="
systemctl enable --now certbot.timer
certbot renew --dry-run

echo "=== Actualizando .env de producción (como el usuario deploy) ==="
sudo -u deploy -H bash -c "
  set -e
  cd '$PROD_DIR'
  sed -i 's#^NEXT_PUBLIC_API_URL=.*#NEXT_PUBLIC_API_URL=https://$API_DOMAIN#' .env
  sed -i 's#^ALLOWED_ORIGINS=.*#ALLOWED_ORIGINS=https://$FRONTEND_DOMAIN#' .env
  grep -q '^FRONTEND_BIND=' .env && sed -i 's#^FRONTEND_BIND=.*#FRONTEND_BIND=127.0.0.1#' .env || echo 'FRONTEND_BIND=127.0.0.1' >> .env
  grep -q '^BACKEND_BIND=' .env && sed -i 's#^BACKEND_BIND=.*#BACKEND_BIND=127.0.0.1#' .env || echo 'BACKEND_BIND=127.0.0.1' >> .env
"

echo "=== Recreando contenedores de producción con la nueva configuración ==="
sudo -u deploy -H bash -c "
  set -e
  cd '$PROD_DIR'
  docker compose -p '$COMPOSE_PROJECT' -f docker-compose.yml -f docker-compose.prod.yml up -d --build
"

echo "=== Listo: https://$FRONTEND_DOMAIN (API en https://$API_DOMAIN) ==="
echo "Los puertos 3000/8000 ya solo escuchan en localhost — el único punto"
echo "de entrada público para producción es 80/443 vía nginx."
