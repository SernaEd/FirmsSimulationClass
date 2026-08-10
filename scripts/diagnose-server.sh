#!/usr/bin/env bash
# Diagnóstico de SOLO LECTURA. No instala nada, no cambia configuración,
# no reinicia servicios. Seguro de correr en un VPS con otros proyectos
# ya corriendo — pensado para revisar qué hay ANTES de correr
# bootstrap-server.sh, sobre todo si el VPS ya tiene otros procesos que
# podrían usar los mismos puertos o depender del estado actual del
# firewall.

set -uo pipefail   # sin -e: queremos ver todas las secciones aunque una falle

echo "=== Sistema ==="
grep PRETTY_NAME /etc/os-release 2>/dev/null

echo
echo "=== Memoria y disco ==="
free -h
df -h /

echo
echo "=== Docker ==="
if command -v docker >/dev/null 2>&1; then
  docker --version
  echo "--- Contenedores corriendo ---"
  docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}' 2>/dev/null
else
  echo "Docker no está instalado."
fi

echo
echo "=== Firewall (ufw) ==="
if command -v ufw >/dev/null 2>&1; then
  ufw status verbose
else
  echo "ufw no está instalado (por default, sin firewall a nivel de SO — revisa también el firewall de red en hPanel de Hostinger)."
fi

echo
echo "=== Puertos escuchando (todas las interfaces) ==="
(ss -tulpn 2>/dev/null || netstat -tulpn 2>/dev/null) | tail -n +1

echo
echo "=== nginx ==="
if command -v nginx >/dev/null 2>&1; then
  nginx -v 2>&1
  echo "--- Sitios habilitados en /etc/nginx/sites-enabled/ ---"
  ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "(no existe esa carpeta)"
  echo "--- Directivas server_name / listen ---"
  grep -rH "server_name\|listen" /etc/nginx/sites-enabled/ 2>/dev/null
else
  echo "nginx no está instalado."
fi

echo
echo "=== apache2 ==="
if command -v apache2 >/dev/null 2>&1; then
  apache2 -v 2>&1
else
  echo "apache2 no está instalado."
fi

echo
echo "=== Usuarios existentes (uid >= 1000, además de root) ==="
cut -d: -f1,3 /etc/passwd | awk -F: '$2 >= 1000 {print $1}'

echo
echo "=== Directorios en /opt y /home (por si ya hay algo con nombre parecido) ==="
ls -la /opt/ 2>/dev/null
ls -la /home/ 2>/dev/null

echo
echo "=== Top 10 procesos por uso de memoria ==="
ps aux --sort=-%mem | head -11
