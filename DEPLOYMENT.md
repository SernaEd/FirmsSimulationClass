# Despliegue a producción — Guía paso a paso

Esta guía te lleva desde un VPS de Hostinger recién contratado (que nunca
has tocado) hasta tener **dos ambientes** (`staging` y `production`)
corriendo en él, actualizándose automáticamente vía GitHub Actions.

**Diseño:** casi todo pasa por GitHub (Secrets, Actions, botones) en vez de
por una terminal conectada al servidor. La única vez que el servidor recibe
comandos "a ciegas" es dentro de un workflow que tú disparas con un clic —
nunca escribes comandos SSH a mano para configurarlo. Sí te enseño, al
final, cómo conectarte por SSH cuando quieras revisar algo tú mismo — pero
ya no es un paso obligatorio del despliegue.

**Si el VPS ya tiene otros proyectos corriendo** (no necesariamente
Docker): esta guía está pensada para convivir con ellos — usa puertos
propios (3000/8001/3100/8100), una carpeta propia (`/opt/calc3/`), y nunca
activa el firewall automáticamente para no arriesgar el acceso a lo que ya
tienes andando. La Fase 1.5 (diagnóstico) es precisamente para confirmar
esto antes de tocar nada — de hecho, así se descubrió que el puerto 8000
"a secas" ya lo usa otro proyecto en este VPS (por eso producción usa 8001,
no 8000, para el backend).

## Índice

- [Arquitectura](#arquitectura-de-lo-que-vamos-a-construir)
- [Fase 0 — Lo que necesitas antes de empezar](#fase-0--lo-que-necesitas-antes-de-empezar)
- [Fase 1 — Dos secrets temporales en GitHub](#fase-1--dos-secrets-temporales-en-github)
- [Fase 1.5 — Diagnóstico del VPS](#fase-15--diagnóstico-del-vps)
- [Fase 2 — Correr el bootstrap (un clic)](#fase-2--correr-el-bootstrap-un-clic)
- [Fase 3 — Terminar de conectar todo en GitHub](#fase-3--terminar-de-conectar-todo-en-github)
- [Fase 3.5 — Habilitar el firewall](#fase-35--habilitar-el-firewall)
- [Fase 4 — Probar el pipeline](#fase-4--probar-el-pipeline)
- [Fase 5 — Dominio + HTTPS en producción](#fase-5--dominio--https-en-producción)
- [Operación diaria (y cómo conectarte por SSH si lo necesitas)](#operación-diaria-y-cómo-conectarte-por-ssh-si-lo-necesitas)
- [Troubleshooting](#troubleshooting)

## Arquitectura de lo que vamos a construir

```
GitHub repo
  │
  ├── Actions → "Bootstrap VPS" (un clic, una sola vez)
  │     prepara el servidor desde cero: hardening, Docker, usuario deploy,
  │     y arranca staging + production por primera vez.
  │
  ├── Actions → "Configurar dominio + HTTPS" (un clic, una sola vez,
  │     opcional — Fase 5)
  │
  └── Actions → "Deploy" (uso normal, día a día)
        push a main ──────────────► deploy-staging (automático)
        Run workflow → production ─► deploy-production (manual, solo desde main)
  │
  ▼
VPS Hostinger (un solo servidor)
  ├── nginx (80/443) ── https://uia.calculo3.grapheke.com ──► frontend :3000 ┐
  │                  └─ https://api.uia.calculo3.grapheke.com ─► backend :8001 ┤ solo producción
  ├── /opt/calc3/production/  (puertos 3000/8001, solo en localhost tras Fase 5)
  └── /opt/calc3/staging/     (puertos 3100 frontend / 8100 backend, público por IP:puerto)
```

Ambos ambientes corren en el **mismo VPS**, como stacks de Docker Compose
completamente independientes: cada uno con su propia base de datos MySQL,
su propio `.env` (con contraseñas generadas al azar, distintas entre sí) y
su propio nombre de proyecto de Compose. Solo producción pasa por dominio +
HTTPS (Fase 5, opcional); staging se queda accesible por IP:puerto ya que
solo tú lo usas para probar antes de producción.

`production` **no se despliega solo**: solo se actualiza cuando tú lo pides
explícitamente desde la pestaña Actions. `staging` sí se actualiza
automáticamente en cada push a `main`.

---

## Fase 0 — Lo que necesitas antes de empezar

Solo dos datos, ambos disponibles en el panel de Hostinger (hPanel → VPS →
tu servidor), **sin conectarte tú mismo al servidor**:

- La **IP pública** del VPS.
- La **contraseña root** (la que Hostinger asignó, o la que ves/reseteas
  desde el propio hPanel).

Eso es todo lo que necesitas para arrancar. El resto lo hace el workflow.

> Producción va a vivir en `uia.calculo3.grapheke.com` (Fase 5, al final de
> esta guía) — no hace falta configurar el DNS todavía, solo cuando llegues
> ahí.

---

## Fase 1 — Dos secrets temporales en GitHub

En `github.com` → tu repo → **Settings → Secrets and variables → Actions →
Secrets → New repository secret**. Crea estos dos:

| Nombre | Valor |
|---|---|
| `VPS_HOST` | la IP del VPS |
| `VPS_ROOT_PASSWORD` | la contraseña root de Hostinger |

`VPS_ROOT_PASSWORD` es **temporal**: solo se usa una vez, dentro del
workflow de bootstrap, para crear un usuario de despliegue sin privilegios
de root. La borras en la Fase 3 y, si quieres una capa extra de seguridad,
rotas la contraseña real en Hostinger justo después — así aunque alguien
encontrara el secret ya sería inútil. (Es una decisión consciente: ver la
nota de seguridad al final de esta sección si quieres el razonamiento
completo.)

<details>
<summary>¿Qué tan riesgoso es esto? (clic para expandir)</summary>

GitHub cifra los secrets en reposo y **nunca** los vuelve a mostrar por la
UI ni la API, ni siquiera a los admins del repo — solo se inyectan como
variable de entorno dentro de un workflow run. El riesgo real no es "alguien
entra a Settings y lo lee", sino (a) que un paso del workflow lo imprima por
error a un log (GitHub enmascara automáticamente los valores de secrets
conocidos en los logs), o (b) que una Action de terceros comprometida,
corriendo en el mismo job, lo exfiltre. Por eso el workflow de bootstrap
solo usa `actions/checkout` (oficial) más `ssh`/`scp`/`sshpass` directos —
ninguna Action de terceros con acceso a este secret.

Además, ya estás confiando en GitHub Secrets con un secret *permanente* y
de poder equivalente: la llave SSH del usuario `deploy` (Fase 3), que
pertenece al grupo `docker` — y pertenecer al grupo `docker` ya es
equivalente a tener root (se puede montar el filesystem del host desde un
contenedor). Un password root *temporal* (minutos, hasta que lo borres) es,
en ese sentido, una exposición menor en el tiempo que la llave permanente
que de todos modos vas a guardar ahí.
</details>

---

## Fase 1.5 — Diagnóstico del VPS

**Corre esto si el VPS ya tiene otros proyectos** (o si simplemente no
sabes qué hay ahí). Es de **solo lectura** — no instala, no cambia, no
reinicia nada — así que es seguro correrlo aunque haya otros servicios
activos.

Pestaña **Actions** → workflow **Diagnóstico del VPS** → **Run workflow**
→ rama `main` → **Run workflow**. Usa los mismos dos secrets de la Fase 1
(`VPS_HOST`, `VPS_ROOT_PASSWORD`), así que córrelo mientras todavía
existan (antes del paso 6 de la Fase 3, que borra el segundo).

Al terminar, abre el **Summary** de la ejecución — vas a ver, entre otras
cosas:

- **Puertos escuchando** ahora mismo en el VPS. Si `3000`, `8001`, `3100` u
  `8100` ya aparecen ahí (usados por otro de tus proyectos), avísame antes
  de seguir — hay que cambiar los puertos de calc3.
- **Estado de `ufw`**: activo (con qué reglas) o inactivo.
- **nginx/apache**, si están instalados, y qué sitios/puertos tienen
  configurados.
- **Contenedores Docker** ya corriendo, si los hay.

✅ **Deberías tener claro, antes de seguir:** que ninguno de los 4 puertos
de calc3 está en uso por otra cosa, y si el firewall ya está activo o no
(determina qué vas a hacer en la Fase 3.5).

---

## Fase 2 — Correr el bootstrap (un clic)

Pestaña **Actions** del repo → workflow **Bootstrap VPS** (barra lateral
izquierda) → **Run workflow** → rama `main` → **Run workflow**.

### Qué hace por dentro (para que no sea una caja negra)

1. Genera, en el runner de GitHub (no en tu computadora, no en el
   servidor), un par de llaves SSH nuevo exclusivamente para el usuario de
   despliegue.
2. Se conecta como `root` con la contraseña del Secret (una sola vez) y
   corre [`scripts/bootstrap-server.sh`](scripts/bootstrap-server.sh):
   actualiza el sistema, **agrega** (sin activar) las reglas de `ufw` que
   necesita calc3, instala `fail2ban`, instala Docker, crea el usuario
   `deploy` (sin contraseña, solo llave SSH) y lo autoriza con la llave
   pública recién generada. **El firewall no se activa en este paso** —
   eso es la Fase 3.5, a propósito, para no arriesgar tus otros proyectos
   si ya tienen tráfico entrando por puertos que esta guía no conoce.
3. Se conecta como `deploy` (ya sin necesitar la contraseña root) y corre
   [`scripts/bootstrap-environment.sh`](scripts/bootstrap-environment.sh)
   dos veces: una para `staging`, otra para `production`. Cada corrida
   clona el repo (o, si ya existe el checkout de una corrida anterior, lo
   actualiza a la última versión de la rama que disparó este workflow —
   así un fix que acabas de mezclar a esa rama sí se aplica al volver a
   correr, en vez de quedarse con lo que había el día del primer clon),
   genera un `.env` con contraseñas y `JWT_SECRET` al azar (generados **en
   el propio VPS** — nunca pasan por GitHub) si no existe ya, y hace el
   primer `docker compose up --build` + `alembic upgrade head`.
4. Sube la llave privada generada en el paso 1 como un **artifact**
   descargable de esta ejecución (no la imprime en ningún log).
5. Escribe un checklist con los siguientes pasos en el **Summary** de la
   ejecución (pestaña de la corrida del workflow, arriba).

Tarda varios minutos (los builds de Docker no son instantáneos). Puedes
seguir el progreso en vivo abriendo la ejecución y expandiendo cada paso.

✅ **Deberías ver:** los pasos "Paso 1/2" y "Paso 2/2" en verde, y un
resumen al final con dos URLs (`http://<VPS_IP>:3100` y
`http://<VPS_IP>:3000`).

Si algo falla a la mitad, revisa el log del paso que falló, corrige lo que
indique (Troubleshooting más abajo) y vuelve a correr el workflow — los dos
scripts están escritos para ser seguros de repetir (no duplican el usuario,
no pisan un `.env` que ya exista, etc.).

---

## Fase 3 — Terminar de conectar todo en GitHub

Este es el único tramo con pasos manuales — y son todos en la interfaz web
de GitHub y de Hostinger, cero terminal.

1. En la ejecución del workflow de bootstrap, baja a **Artifacts** y
   descarga `deploy-ssh-key`.
2. Abre el archivo `deploy_key` que venía adentro con cualquier editor de
   texto (Bloc de notas sirve) y copia **todo** su contenido, incluyendo
   las líneas `-----BEGIN...-----` y `-----END...-----`.
3. **Settings → Secrets and variables → Actions → Secrets → New repository
   secret**, crea:

   | Nombre | Valor |
   |---|---|
   | `VPS_SSH_KEY` | lo que copiaste del archivo `deploy_key` |
   | `VPS_USER` | `deploy` |
   | `VPS_SSH_PORT` | `22` |

4. **Settings → Secrets and variables → Actions → Environments → New
   environment**, créalo dos veces: `staging` y `production`. Dentro de
   **cada uno**, en **Environment variables** (no Secrets — esto no es
   sensible):

   **`staging`:**
   | Nombre | Valor |
   |---|---|
   | `DEPLOY_PATH` | `/opt/calc3/staging` |
   | `COMPOSE_PROJECT_NAME` | `calc3-staging` |

   **`production`:**
   | Nombre | Valor |
   |---|---|
   | `DEPLOY_PATH` | `/opt/calc3/production` |
   | `COMPOSE_PROJECT_NAME` | `calc3-prod` |

5. Dentro del environment `production` → **Deployment protection rules** →
   activa **Required reviewers** y agrégate a ti mismo. Así, aunque se
   dispare un despliegue a producción, no corre hasta que tú lo apruebes
   desde la pestaña Actions.
6. **Settings → Secrets and variables → Actions → Secrets** → borra
   `VPS_ROOT_PASSWORD`. Ya cumplió su función.
7. En hPanel de Hostinger, cambia la contraseña de root del VPS (defensa
   extra: aunque el secret anterior hubiera quedado en algún lado, deja de
   servir).
8. De vuelta en la ejecución del bootstrap, borra el artifact
   `deploy-ssh-key` (⚙️ en la esquina de la ejecución → Delete artifact) —
   ya guardaste su contenido en el Secret, no hace falta dejarlo ahí.

✅ **Deberías tener:** 4 secrets a nivel repo (`VPS_HOST`, `VPS_SSH_KEY`,
`VPS_USER`, `VPS_SSH_PORT`), 2 environments con sus 2 variables cada uno,
`production` con aprobación requerida, y `VPS_ROOT_PASSWORD` ya no existe.

---

## Fase 3.5 — Habilitar el firewall

Este paso queda **separado a propósito** (ver Fase 2) para que actives
`ufw` solo cuando estés seguro de que cubre también a tus otros proyectos
— no solo a calc3.

1. Si en la Fase 1.5 viste que tus otros proyectos usan puertos propios
   (por ejemplo `80`/`443` de nginx, o algún puerto de app específico),
   ténlos a la mano.
2. Pestaña **Actions** → workflow **Habilitar firewall (ufw)** → **Run
   workflow** → en el campo `extra_ports`, escribe esos puertos separados
   por coma (ej. `80,443`) — o déjalo vacío si `ufw` ya estaba activo en la
   Fase 1.5 y ya tenía reglas para ellos. → **Run workflow**.
3. Revisa el log del paso — termina con `ufw status verbose`, confirma ahí
   mismo que están todos los puertos que necesitas (los de calc3 **y** los
   de tus otros proyectos).

Este workflow usa la llave del usuario `deploy` (no la contraseña root, que
ya borraste) con permiso de `sudo` **acotado únicamente al comando `ufw`**
— no `sudo` general — configurado por `bootstrap-server.sh` en la Fase 2.

Es seguro volver a correrlo si te faltó algún puerto: `ufw allow` no
duplica reglas ni rompe nada si ya existía.

✅ **Deberías ver:** `ufw status verbose` con `Status: active` y todos los
puertos que necesitas (calc3 + tus otros proyectos) en la lista.

---

## Fase 4 — Probar el pipeline

### 4.1 Staging (automático)

Haz cualquier cambio pequeño en el repo, commit y push a `main`:

```bash
git add .
git commit -m "test: probar despliegue a staging"
git push origin main
```

Pestaña **Actions** → workflow **Deploy** corriendo: primero
`test-backend`/`test-frontend`, luego `deploy-staging`. Al terminar,
`http://<VPS_IP>:3100` debe reflejar tu cambio.

### 4.2 Production (manual)

Pestaña **Actions** → **Deploy** → **Run workflow** → rama `main` → campo
`environment` → `production` → **Run workflow**. Si activaste "Required
reviewers", el job queda esperando tu aprobación (mismo lugar). Al
aprobarlo y terminar, `http://<VPS_IP>:3000` debe reflejar el cambio.

✅ **Deberías tener:** un despliegue a staging disparado por push, y uno a
producción disparado manualmente y aprobado por ti, ambos en verde.

---

## Fase 5 — Dominio + HTTPS en producción

Opcional, pero es lo que le compartirías a los 25 alumnos en vez de una IP
con puerto. Pone **nginx + Let's Encrypt** delante de **producción**
(`uia.calculo3.grapheke.com` para el frontend,
`api.uia.calculo3.grapheke.com` para el backend) y, una vez que el
certificado está andando, restringe los puertos 3000/8001 a `localhost` —
el único punto de entrada público queda en 80/443. **Staging no se toca**,
sigue en `http://<VPS_IP>:3100`.

### 5.1 DNS (fuera de GitHub — donde administres `grapheke.com`)

Agrega dos registros **A**, apuntando ambos a la IP del VPS:

| Tipo | Host | Valor |
|---|---|---|
| A | `uia.calculo3` (o el nombre completo `uia.calculo3.grapheke.com`, según pida tu proveedor) | `<VPS_IP>` |
| A | `api.uia.calculo3` | `<VPS_IP>` |

La propagación puede tardar de minutos a un par de horas. Confirma desde tu
computadora:

```bash
nslookup uia.calculo3.grapheke.com
nslookup api.uia.calculo3.grapheke.com
```

Ambos deben devolver la IP del VPS antes de seguir — el workflow lo revisa
automáticamente y se detiene con un error claro si todavía no propagó, en
vez de fallar a la mitad con un error críptico de Let's Encrypt.

### 5.2 Correr el workflow

1. **Settings → Secrets and variables → Actions → Secrets** → si ya habías
   borrado `VPS_ROOT_PASSWORD` (Fase 3, paso 6), créalo de nuevo con la
   contraseña root actual — este workflow instala paquetes a nivel de
   sistema (nginx, certbot), igual que "Bootstrap VPS".
2. Pestaña **Actions** → workflow **Configurar dominio + HTTPS
   (producción)** → **Run workflow**. Los campos `frontend_domain` /
   `api_domain` ya vienen con `uia.calculo3.grapheke.com` /
   `api.uia.calculo3.grapheke.com` por default — ajústalos si cambiaste de
   idea. `letsencrypt_email` es solo para avisos de expiración (no
   necesitas hacer nada con ellos, la renovación es automática). → **Run
   workflow**.

### Qué hace por dentro

1. En el runner, verifica que ambos dominios ya resuelvan a la IP del VPS
   (Fase 5.1) — si no, se detiene ahí mismo.
2. Se conecta como `root` (única vez) y corre
   [`scripts/setup-https.sh`](scripts/setup-https.sh):
   - Si nginx **no** está instalado, primero confirma que 80/443 estén
     libres (si tus otros proyectos ya escuchan ahí directamente, sin
     pasar por un reverse proxy, se detiene con un error en vez de
     intentar arrancar nginx encima). Si nginx **ya** está instalado
     (por ejemplo, por otro de tus proyectos), no lo reinstala ni toca su
     configuración existente.
   - Agrega dos sitios nuevos en `/etc/nginx/sites-available/` (uno para
     cada dominio de calc3) — sitios *adicionales*, no reemplaza nada que
     ya tengas configurado ahí.
   - Abre 80/443 en `ufw` (agrega reglas, igual que en la Fase 2/3.5).
   - Corre `certbot --nginx` para emitir los certificados y subir ambos
     sitios a HTTPS con redirect automático desde HTTP. Activa la
     renovación automática (`certbot.timer` — no requiere nada de tu
     parte después).
   - Actualiza el `.env` de producción: `NEXT_PUBLIC_API_URL` y
     `ALLOWED_ORIGINS` pasan a los dominios HTTPS, y agrega
     `FRONTEND_BIND=127.0.0.1` / `BACKEND_BIND=127.0.0.1`.
   - Recrea los contenedores de producción con esa configuración.

✅ **Deberías ver:** `https://uia.calculo3.grapheke.com` cargando con
candado en el navegador, y login funcionando de extremo a extremo (prueba
uno real — confirma que `ALLOWED_ORIGINS` quedó bien).

### 5.3 Después de correrlo

1. Si volviste a crear `VPS_ROOT_PASSWORD` para este paso, bórralo otra vez.
2. Cambia la contraseña de root en hPanel de Hostinger otra vez.
3. Ya no visites `http://<VPS_IP>:3000` para producción — sigue existiendo
   a nivel de red pero solo escucha en `localhost` del VPS, no es
   alcanzable desde afuera. La URL real ahora es la de HTTPS.

> Si más adelante quieres lo mismo para staging (un subdominio propio con
> HTTPS), es el mismo patrón — avísame y ajustamos el workflow para que
> acepte también sus dominios.

---

## Operación diaria (y cómo conectarte por SSH si lo necesitas)

Para el día a día **no necesitas SSH para nada**:

- **Actualizar staging:** push a `main`.
- **Actualizar producción:** Actions → Deploy → Run workflow → `production`
  → aprobar si aplica.
- **Ver si un despliegue salió bien:** pestaña Actions, el log de cada paso.

Pero vas a querer entrar directo al servidor de vez en cuando — para leer
logs en tiempo real, revisar el estado de los contenedores, o hacer un
rollback de emergencia. Así se hace:

### Cómo conectarte por SSH

Necesitas la llave privada que generaste en la Fase 2 (la que subiste como
Secret `VPS_SSH_KEY`). Si ya no la tienes en tu computadora, guarda ese
mismo contenido en un archivo local, por ejemplo `~/.ssh/calc3_deploy`:

```bash
chmod 600 ~/.ssh/calc3_deploy   # solo en Linux/Mac; en Windows no hace falta
ssh -i ~/.ssh/calc3_deploy deploy@<VPS_IP>
```

Esto te deja en una terminal dentro del VPS, como el usuario `deploy` (el
mismo que usa GitHub Actions — mismos permisos, incluyendo Docker sin
`sudo`). Es una sesión de **texto**, no una ventana gráfica — un VPS Linux
administrado con Docker no tiene ni necesita escritorio (ver nota abajo).

Una vez adentro, lo más común:

```bash
cd /opt/calc3/production          # o staging
docker compose -p calc3-prod ps                    # estado de los contenedores
docker compose -p calc3-prod logs -f backend        # logs en vivo (Ctrl+C para salir)
docker compose -p calc3-prod logs -f frontend
docker stats --no-stream                            # uso de CPU/RAM por contenedor
```

Para salir de la sesión SSH: `exit` o Ctrl+D.

> **¿Por qué no "Remote Desktop"?** RDP/VNC te da una ventana gráfica con
> mouse y escritorio, como conectarte a otra PC con Windows. Este VPS es
> Linux, se administra por comandos, y no tiene entorno gráfico instalado
> (instalar uno solo para verlo "como ventana" consumiría RAM/CPU que
> preferimos dejarle a Docker, y abriría una superficie de ataque extra sin
> necesidad real). La sesión SSH de arriba es la forma normal — y más
> rápida — de administrar este tipo de servidor.

### Rollback rápido (volver al commit anterior sin esperar un nuevo push)

```bash
ssh -i ~/.ssh/calc3_deploy deploy@<VPS_IP>
cd /opt/calc3/production   # o staging
git log --oneline -5       # identifica el commit bueno anterior
git reset --hard <commit_sha>
docker compose -p calc3-prod -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -p calc3-prod exec backend alembic upgrade head
```

### Respaldo de la base de datos (recomendado antes de cambios grandes)

```bash
docker compose -p calc3-prod exec mysql sh -c \
  'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' > backup_$(date +%F).sql
```

---

## Troubleshooting

**El workflow de bootstrap falla en "Paso 1/2" con error de autenticación:**
- Confirma que `VPS_ROOT_PASSWORD` en GitHub es exactamente la contraseña
  actual de root — si ya la cambiaste en hPanel después de crear el
  secret, actualízalo también ahí.

**El workflow de bootstrap falla en "Paso 2/2":**
- Normalmente significa que "Paso 1/2" no terminó de crear/autorizar al
  usuario `deploy` correctamente. Revisa el log de "Paso 1/2" primero.
- Si el checkout de un ambiente falla porque el directorio ya existe pero
  no es un repo git válido (por ejemplo, tras un fallo a la mitad muy
  anterior), conéctate por SSH (sección de arriba) y borra esa carpeta
  específica (`rm -rf /opt/calc3/staging`, por ejemplo) antes de
  volver a correr el workflow.

**El workflow normal (`Deploy`) falla en el paso SSH ("Permission denied"):**
- Confirma que `VPS_SSH_KEY` es la llave **privada completa** (con las
  líneas `BEGIN`/`END`), no la pública.
- Confirma `VPS_USER=deploy` y `VPS_SSH_PORT=22`.

**"Habilitar firewall" falla en `sudo ufw` ("a password is required" o similar):**
- Significa que el archivo `/etc/sudoers.d/deploy-ufw` no se creó bien en
  la Fase 2. Corre de nuevo el workflow **Bootstrap VPS** (es seguro
  repetirlo) y confirma en su log que el paso "Usuario deploy" no dio
  error, luego vuelve a intentar "Habilitar firewall".

**Activé el firewall y ahora uno de mis otros proyectos no responde:**
- Le faltó su puerto en la lista. Vuelve a correr **Habilitar firewall**
  con `extra_ports` incluyendo el puerto que falta — es seguro repetirlo
  cuantas veces haga falta.

**El login falla en el sitio desplegado con error de CORS en la consola del navegador:**
- El `.env` de ese ambiente necesita `ALLOWED_ORIGINS` apuntando
  exactamente (protocolo, host y puerto) a la URL desde la que abres el
  sitio. El script de bootstrap ya lo configura automáticamente con la IP
  del VPS; si más adelante cambias a un dominio, actualiza esa variable
  (por SSH) y recrea el contenedor del backend:
  `docker compose -p <proyecto> up -d --build backend`.

**El build del frontend se cuelga o el contenedor muere sin log claro:**
- Conéctate por SSH y corre `free -h` durante el build — probablemente se
  quedó sin RAM. Para 25 alumnos, un VPS con 2GB debería alcanzar para
  correr ambos ambientes, pero el momento del build es el pico de consumo.

**Necesito ver qué está pasando ahora mismo, de ambos ambientes a la vez:**
```bash
ssh -i ~/.ssh/calc3_deploy deploy@<VPS_IP>
docker ps -a   # todos los contenedores, de staging y production juntos
```

**"Configurar dominio + HTTPS" falla en "Verificar que el DNS ya apunta al VPS":**
- El DNS todavía no propagó, o el A record no coincide con `VPS_HOST`.
  Espera un poco y vuelve a correr el workflow — es seguro repetirlo.

**Falla en el paso de certbot (`nginx` instaló bien pero el certificado no):**
- Confirma otra vez el DNS (a veces propaga distinto según el resolver).
- Let's Encrypt tiene límites de tasa (5 certificados por dominio exacto
  por semana) — si lo corriste varias veces seguidas fallando por otra
  razón, puede que tengas que esperar. El log de certbot en el paso del
  workflow dice exactamente cuál fue el error.

**nginx no arranca después de instalarlo (Fase 5):**
- Probablemente el puerto 80 o 443 ya estaba en uso por otro proceso de
  tus otros proyectos que escucha directo ahí (sin reverse proxy). El
  script ya revisa esto antes de instalar nginx y se detiene con un error
  claro — si aun así pasó, conéctate por SSH y revisa
  `ss -tulpn | grep -E ':80|:443'` para ver qué lo está usando.
