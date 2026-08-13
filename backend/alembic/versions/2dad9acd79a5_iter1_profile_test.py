"""iter1_profile_test

Revision ID: 2dad9acd79a5
Revises: 5856aa859e12
Create Date: 2026-08-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '2dad9acd79a5'
down_revision: Union[str, None] = '5856aa859e12'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Contenido fijo del test (§3, Belbin adaptado). 8 escenarios, una opción
# por perfil en cada uno. Sembrado aquí (no vía panel admin) porque no es
# contenido editable por el profesor.
#
# Las opciones evitan repetir el mismo verbo/estructura por perfil en todas
# las preguntas (ej. no siempre "Reviso..." para analista, "Propongo un
# modelo de..." para modelador, "Organizo/coordino..." para integrador) —
# de otro modo el patrón se vuelve reconocible y alguien podría elegir la
# respuesta que "suena mejor" en vez de la que describe cómo actúa de
# verdad. El orden en que se muestran las 3 opciones también se aleatoriza
# por petición (ver `_question_to_out` en routers/profile_test.py).
QUESTIONS = [
    {
        "orden": 1,
        "enunciado": (
            "Tu equipo debe resolver un caso de licitación con ecuaciones "
            "diferenciales. Es la primera reunión y aún no hay un plan claro. "
            "¿Qué haces primero?"
        ),
        "opcion_analista": (
            "Antes de que alguien proponga algo, quiero tener claro qué dato del "
            "enunciado sostiene cada supuesto que vamos a usar."
        ),
        "opcion_modelador": (
            "Ya tengo una idea de qué ecuación podría describir esto — la "
            "comparto aunque todavía le falten detalles."
        ),
        "opcion_integrador": (
            "Pregunto qué sabe cada quien del tema, y de ahí salimos con quién "
            "ve qué parte y cuándo nos volvemos a juntar."
        ),
    },
    {
        "orden": 2,
        "enunciado": (
            "Un compañero de equipo presenta una solución que 'se ve bien' pero "
            "no verificó unidades ni condiciones de frontera. ¿Cómo reaccionas?"
        ),
        "opcion_analista": (
            "Antes de dar el visto bueno, corro el resultado por un caso límite "
            "conocido a ver si las unidades siguen cuadrando."
        ),
        "opcion_modelador": (
            "Lo que me hace dudar no es la cuenta — es si ese planteamiento "
            "realmente corresponde a lo que está pasando físicamente."
        ),
        "opcion_integrador": (
            "Le pido que nos lo explique en voz alta paso a paso; entre todos es "
            "más fácil notar si algo no encaja."
        ),
    },
    {
        "orden": 3,
        "enunciado": (
            "Faltan 30 minutos para entregar la tarea grupal y todavía hay dos "
            "formas distintas de resolver el problema sobre la mesa. ¿Qué haces?"
        ),
        "opcion_analista": (
            "Pongo las dos soluciones lado a lado contra los datos originales — "
            "la que sostenga mejor la prueba es la que entregamos."
        ),
        "opcion_modelador": (
            "Me fijo en cuál de los dos planteamientos se parece más a lo que de "
            "verdad está pasando en el problema, no solo cuál se ve más limpio."
        ),
        "opcion_integrador": (
            "Con el reloj encima, mejor decidimos rápido entre todos y "
            "entregamos a tiempo que seguir discutiendo cuál es 'mejor'."
        ),
    },
    {
        "orden": 4,
        "enunciado": (
            "El profesor anuncia una licitación sorpresa sobre un tema que el "
            "equipo apenas repasó. ¿Cuál es tu primer instinto?"
        ),
        "opcion_analista": (
            "Bajo presión lo que más me preocupa es no equivocarme en un signo o "
            "una condición, así que repaso eso primero."
        ),
        "opcion_modelador": (
            "Intento imaginar qué está pasando físicamente en el caso antes de "
            "pensar en qué ecuación usar."
        ),
        "opcion_integrador": (
            "Reviso rápido quién del equipo se sabe mejor el tema, para que "
            "tome la delantera y no perdamos tiempo."
        ),
    },
    {
        "orden": 5,
        "enunciado": (
            "Durante una sustentación oral, a tu compañero le cuesta explicar "
            "por qué el equipo usó cierto método. ¿Qué haces?"
        ),
        "opcion_analista": (
            "Le susurro el paso exacto de la derivación que se le está "
            "olvidando, para que pueda justificarlo con precisión."
        ),
        "opcion_modelador": (
            "Le recuerdo qué estábamos representando en la realidad con eso, "
            "para que la explicación deje de sonar solo a álgebra."
        ),
        "opcion_integrador": (
            "Tomo la palabra un momento para completar lo que dijo y que la "
            "conversación con el profesor no se corte."
        ),
    },
    {
        "orden": 6,
        "enunciado": (
            "El equipo debe recolectar datos empíricos (ej. la curva de "
            "enfriamiento de un café) para el proyecto final. ¿Qué prefieres "
            "hacer?"
        ),
        "opcion_analista": (
            "Me preocupa más el protocolo: qué instrumento, cada cuánto medir, "
            "cómo evitar que el error se nos cuele en los datos."
        ),
        "opcion_modelador": (
            "Ya estoy pensando en qué ecuación debería ajustarse a esos datos y "
            "qué estamos suponiendo del fenómeno para que funcione."
        ),
        "opcion_integrador": (
            "Reparto quién graba, quién mide y quién anota, para que el proceso "
            "quede bien documentado sin que se nos pase nada."
        ),
    },
    {
        "orden": 7,
        "enunciado": (
            "Dos integrantes del equipo no están de acuerdo sobre cómo plantear "
            "un sistema de ecuaciones diferenciales. ¿Cómo participas?"
        ),
        "opcion_analista": (
            "Pido que cada quien escriba su planteamiento completo — así vemos "
            "juntos si de verdad son consistentes o no."
        ),
        "opcion_modelador": (
            "Sospecho que el desacuerdo no es de matemáticas sino de qué le "
            "están suponiendo cada uno al fenómeno, así que pregunto eso "
            "primero."
        ),
        "opcion_integrador": (
            "Me aseguro de que se escuchen sin interrumpirse, y propongo probar "
            "las dos ideas antes de descartar alguna."
        ),
    },
    {
        "orden": 8,
        "enunciado": (
            "Terminó el módulo y toca la retroalimentación entre pares. ¿Qué "
            "tiendes a valorar más al evaluar a tus compañeros?"
        ),
        "opcion_analista": (
            "Si de verdad se tomaron el tiempo de comprobar resultados antes de "
            "darlos por buenos."
        ),
        "opcion_modelador": "Si aportaron una idea o un ángulo distinto que destrabó algún problema.",
        "opcion_integrador": (
            "Si ayudaron a que el equipo se mantuviera organizado y en "
            "comunicación."
        ),
    },
]


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('profile_test_questions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('orden', sa.Integer(), nullable=False),
    sa.Column('enunciado', sa.Text(), nullable=False),
    sa.Column('opcion_analista', sa.Text(), nullable=False),
    sa.Column('opcion_modelador', sa.Text(), nullable=False),
    sa.Column('opcion_integrador', sa.Text(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('orden')
    )
    op.create_table('profile_test_answers',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('question_id', sa.Integer(), nullable=False),
    sa.Column('perfil_elegido', sa.Enum('analista', 'modelador', 'integrador', name='userprofile', native_enum=False, length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['question_id'], ['profile_test_questions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'question_id', name='uq_profile_test_answer_user_question')
    )
    # ### end Alembic commands ###

    questions_table = sa.table(
        'profile_test_questions',
        sa.column('orden', sa.Integer()),
        sa.column('enunciado', sa.Text()),
        sa.column('opcion_analista', sa.Text()),
        sa.column('opcion_modelador', sa.Text()),
        sa.column('opcion_integrador', sa.Text()),
    )
    op.bulk_insert(questions_table, QUESTIONS)


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('profile_test_answers')
    op.drop_table('profile_test_questions')
    # ### end Alembic commands ###
