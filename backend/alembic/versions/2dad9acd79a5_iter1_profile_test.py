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
            "Tu equipo debe resolver un caso complejo. Es la primera reunión y "
            "aún no hay un plan claro. ¿Qué haces primero?"
        ),
        "opcion_analista": (
            "Antes de que alguien proponga algo, quiero tener claro qué dato del "
            "enunciado sostiene cada supuesto que vamos a usar."
        ),
        "opcion_modelador": (
            "Ya tengo una idea de cómo se podría enfocar la solución — la comparto "
            "aunque todavía le falten detalles."
        ),
        "opcion_integrador": (
            "Pregunto qué sabe cada quien del tema, y de ahí salimos con quién "
            "ve qué parte y cuándo nos volvemos a juntar."
        ),
    },
    {
        "orden": 2,
        "enunciado": (
            "Un compañero de equipo presenta una propuesta que 'se ve bien' pero "
            "le falta verificar detalles técnicos o validaciones. ¿Cómo reaccionas?"
        ),
        "opcion_analista": (
            "Antes de dar el visto bueno, pongo a prueba la propuesta con un "
            "caso extremo o límite para ver si los datos siguen cuadrando."
        ),
        "opcion_modelador": (
            "Lo que me hace dudar no es la presentación — es si ese planteamiento "
            "realmente resuelve el problema de fondo que estamos abordando."
        ),
        "opcion_integrador": (
            "Le pido que nos lo explique en voz alta paso a paso; entre todos es "
            "más fácil notar si algo no encaja."
        ),
    },
    {
        "orden": 3,
        "enunciado": (
            "Faltan 30 minutos para la entrega del proyecto grupal y todavía hay "
            "dos formas distintas de resolver el problema sobre la mesa. ¿Qué haces?"
        ),
        "opcion_analista": (
            "Pongo las dos soluciones lado a lado contra los datos originales — "
            "la que sostenga mejor la prueba es la que entregamos."
        ),
        "opcion_modelador": (
            "Me fijo en cuál de los dos planteamientos atiende mejor la raíz del "
            "problema original, no solo cuál se ve más ordenado."
        ),
        "opcion_integrador": (
            "Con el reloj encima, mejor decidimos rápido entre todos y "
            "entregamos a tiempo que seguir discutiendo cuál es 'mejor'."
        ),
    },
    {
        "orden": 4,
        "enunciado": (
            "Se presenta un reto sorpresa sobre un tema que el equipo apenas "
            "conoce. ¿Cuál es tu primer instinto?"
        ),
        "opcion_analista": (
            "Bajo presión, lo que más me preocupa es no equivocarme en los "
            "detalles clave o requisitos, así que los repaso primero."
        ),
        "opcion_modelador": (
            "Intento imaginar el panorama general y entender el contexto del "
            "problema antes de proponer cualquier solución."
        ),
        "opcion_integrador": (
            "Reviso rápido quién del equipo se sabe mejor el tema, para que "
            "tome la delantera y no perdamos tiempo."
        ),
    },
    {
        "orden": 5,
        "enunciado": (
            "Durante una presentación, a tu compañero le cuesta explicar por qué "
            "el equipo tomó cierta decisión. ¿Qué haces?"
        ),
        "opcion_analista": (
            "Le recuerdo rápidamente el dato exacto o el paso técnico que se "
            "le está olvidando para que pueda justificarlo con precisión."
        ),
        "opcion_modelador": (
            "Le recuerdo el razonamiento conceptual detrás de nuestra decisión "
            "para que su explicación tenga más sentido."
        ),
        "opcion_integrador": (
            "Tomo la palabra un momento para complementar lo que dijo y evitar "
            "que la conversación se estanque."
        ),
    },
    {
        "orden": 6,
        "enunciado": (
            "El equipo debe recolectar y analizar información de múltiples fuentes "
            "para el proyecto final. ¿Qué prefieres hacer?"
        ),
        "opcion_analista": (
            "Me preocupa más el método: qué herramientas usaremos, cómo estructurar "
            "los datos y cómo evitar que haya errores en la información."
        ),
        "opcion_modelador": (
            "Ya estoy pensando en cómo vamos a interpretar esa información y "
            "qué conclusiones podremos sacar para darle forma al proyecto."
        ),
        "opcion_integrador": (
            "Reparto tareas claras: quién investiga, quién documenta y quién "
            "revisa, para que todo el proceso quede bien cubierto."
        ),
    },
    {
        "orden": 7,
        "enunciado": (
            "Dos integrantes del equipo no están de acuerdo sobre cómo plantear "
            "la estrategia para abordar el proyecto. ¿Cómo participas?"
        ),
        "opcion_analista": (
            "Pido que cada quien escriba su planteamiento completo — así vemos "
            "juntos si de verdad son consistentes o no."
        ),
        "opcion_modelador": (
            "Sospecho que el desacuerdo no es sobre los detalles técnicos, sino "
            "sobre cómo ven el panorama general, así que pregunto eso primero."
        ),
        "opcion_integrador": (
            "Me aseguro de que se escuchen sin interrumpirse y propongo evaluar "
            "las dos ideas en equipo antes de descartar alguna."
        ),
    },
    {
        "orden": 8,
        "enunciado": (
            "Terminó el proyecto y toca la evaluación de pares. ¿Qué tiendes "
            "a valorar más al evaluar a tus compañeros?"
        ),
        "opcion_analista": (
            "Si de verdad se tomaron el tiempo de verificar la calidad del "
            "trabajo antes de darlo por bueno."
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
