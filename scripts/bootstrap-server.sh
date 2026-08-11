#!/usr/bin/env bash
# Hardening + Docker + usuario "deploy" en un VPS nuevo.
#
# Corre UNA vez, como root, disparado por el workflow
# .github/workflows/bootstrap-vps.yml (no se corre a mano normalmente).
# Es seguro volver a correrlo: cada paso revisa si ya está hecho antes de
# repetirlo (útil si el workflow falló a la mitad y lo vuelves a disparar).
#
# Uso: bash bootstrap-server.sh "<llave-pública-ssh-del-usuario-deploy>"

set -euo pipefail

DEPLOY_PUBKEY="${1:?Falta la llave pública como primer argumento}"

echo "=== Diagnóstico inicial ==="
cat /etc/os-release | grep PRETTY_NAME || true
echo "Memoria:"; free -h
echo "Disco:"; df -h /
echo "Docker instalado: $(command -v docker >/dev/null 2>&1 && echo si || echo no)"
echo

echo "=== Actualizando paquetes del sistema ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

echo "=== Firewall (ufw) ==="
# Importante: solo se AGREGAN reglas aquí. Nunca se activa el firewall
# automáticamente — este VPS puede tener otros proyectos corriendo, y
# activar ufw a ciegas (con solo estas reglas) podría bloquear su acceso.
# Activar ufw es un paso separado y deliberado: workflow "Habilitar
# firewall" (ver DEPLOYMENT.md), donde puedes agregar los puertos de tus
# otros proyectos antes de encenderlo.
apt-get install -y ufw
ufw allow 22/tcp
ufw allow 3000/tcp   # frontend producción
ufw allow 8001/tcp   # backend producción (8000 ya lo usa otro proyecto en este VPS)
ufw allow 3100/tcp   # frontend staging
ufw allow 8100/tcp   # backend staging
if ufw status | grep -q "Status: active"; then
  echo "ufw ya estaba activo — se agregaron las reglas de arriba sin tocar las existentes."
else
  echo "AVISO: ufw sigue INACTIVO a propósito. Las reglas de este proyecto ya"
  echo "quedaron listas, pero no se activó el firewall — hazlo desde el workflow"
  echo "\"Habilitar firewall\" cuando hayas confirmado los puertos de tus otros"
  echo "proyectos (workflow \"Diagnóstico del VPS\" te ayuda a verlos)."
fi
ufw status verbose

echo "=== fail2ban (protección contra fuerza bruta en SSH) ==="
apt-get install -y fail2ban
systemctl enable --now fail2ban

echo "=== Docker ==="
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
else
  echo "Docker ya estaba instalado, se omite."
fi
docker --version
docker compose version

echo "=== Usuario deploy ==="
if ! id -u deploy >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy
else
  echo "El usuario deploy ya existe, se omite creación."
fi
usermod -aG docker deploy

mkdir -p /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
grep -qxF "$DEPLOY_PUBKEY" /home/deploy/.ssh/authorized_keys || echo "$DEPLOY_PUBKEY" >> /home/deploy/.ssh/authorized_keys
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# sudo acotado SOLO a ufw (no sudo general): así el workflow "Habilitar
# firewall" puede agregar puertos/activar el firewall usando la llave de
# deploy, sin necesitar la contraseña de root otra vez.
UFW_BIN="$(command -v ufw)"
echo "deploy ALL=(root) NOPASSWD: $UFW_BIN" > /etc/sudoers.d/deploy-ufw
chmod 440 /etc/sudoers.d/deploy-ufw

echo "=== Directorio de despliegues ==="
mkdir -p /opt/calc3
chown deploy:deploy /opt/calc3

echo "=== Listo: servidor preparado, usuario deploy autorizado ==="
