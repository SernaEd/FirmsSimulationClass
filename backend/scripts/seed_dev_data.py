"""Datos de arranque para desarrollo local: una cuenta admin y una cuenta
alumno con credenciales fijas y conocidas, para poder loguearse sin pasar
por /auth/register + aprobación manual cada vez que se levanta el stack
desde cero.

Se ejecuta automáticamente como servicio de un solo uso en
docker-compose.yml (ver servicio "seed"). Puede correrse a mano también:

    docker compose exec backend python -m scripts.seed_dev_data

Salvaguarda: se niega a hacer nada fuera de ENVIRONMENT=development (ver
`if settings.environment != "development"` abajo) — no basta con que este
servicio solo esté pensado para dev en docker-compose.yml, porque
docker-compose.prod.yml es un overlay que solo *agrega* archivos, no quita
servicios del base; sin este guard, el contenedor igual se construiría (y
correría) en un despliegue de staging/producción que use
`-f docker-compose.yml -f docker-compose.prod.yml`. Mismo patrón que
ADMIN_BOOTSTRAP_TOKEN en app/routers/auth.py: el secreto/condición que
importa vive en Python, no en qué tan "obviamente de dev" se vea la
configuración de infraestructura alrededor.

Idempotente: si una cuenta con ese número de cuenta ya existe, se omite
sin error — así correr `docker compose up` de nuevo (o reiniciar el
contenedor) nunca falla por duplicados.
"""

from datetime import datetime, timezone

from alembic import command
from alembic.config import Config

from app.config import settings
from app.database import SessionLocal
from app.models.user import User, UserStatus
from app.security import hash_pin

SEED_USERS = [
    {
        "nombre": "Admin",
        "apellidos": "Demo",
        "numero_cuenta": "1234",
        "nickname": "admin",
        "pin": "1234",
        "is_admin": True,
    },
    {
        "nombre": "Alumno",
        "apellidos": "Demo",
        "numero_cuenta": "9876",
        "nickname": "alumno",
        "pin": "9876",
        "is_admin": False,
    },
]


def _upgrade_schema_to_head() -> None:
    # Este script puede ser lo primero que corre contra una BD recién
    # creada (antes de que alguien haya corrido `alembic upgrade head` a
    # mano) — sin esto, el insert de abajo fallaría porque la tabla
    # "users" todavía no existe. `upgrade head` es idempotente: si el
    # esquema ya está al día, no hace nada.
    command.upgrade(Config("alembic.ini"), "head")


def seed() -> None:
    if settings.environment != "development":
        print(f"seed_dev_data: ENVIRONMENT={settings.environment!r} — no es 'development', no se hace nada.")
        return

    _upgrade_schema_to_head()

    db = SessionLocal()
    try:
        for data in SEED_USERS:
            existing = db.query(User).filter(User.numero_cuenta == data["numero_cuenta"]).first()
            if existing is not None:
                print(f"seed_dev_data: cuenta {data['numero_cuenta']} ya existe, se omite.")
                continue
            db.add(
                User(
                    nombre=data["nombre"],
                    apellidos=data["apellidos"],
                    numero_cuenta=data["numero_cuenta"],
                    nickname=data["nickname"],
                    pin_hash=hash_pin(data["pin"]),
                    estado=UserStatus.active,
                    is_admin=data["is_admin"],
                    terms_accepted_at=datetime.now(timezone.utc),
                )
            )
            db.commit()
            rol = "admin" if data["is_admin"] else "alumno"
            print(f"seed_dev_data: creada cuenta {rol} {data['numero_cuenta']}.")
    finally:
        db.close()

    print(
        "\n"
        "============================================================\n"
        " Cuentas de desarrollo listas para loguearse en /login:\n"
        "   Admin  -> cuenta 1234 / PIN 1234\n"
        "   Alumno -> cuenta 9876 / PIN 9876\n"
        "============================================================\n"
    )


if __name__ == "__main__":
    seed()
