# Plataforma de Aprendizaje Gamificado para Cálculo 3 (Ecuaciones Diferenciales)

Este documento detalla una propuesta integral para impartir tu clase de Cálculo 3, combinando la pedagogía narrativa con un sistema de rol estructurado en una plataforma web.

## Enfoque Pedagógico y Mecánicas del Curso

### 1. Sistema de Roles y "Cuestionario de Personalidad"
Al registrarse (con Nombre, Apellidos, Número de Cuenta, Nickname y PIN), los alumnos realizarán un breve cuestionario basado en el Test de Bartle para jugadores o tests de personalidad de trabajo en equipo. Este test sugerirá (o asignará) su rol:
*   **El Tanque (Tank):** Alumnos dispuestos a experimentar y equivocarse. Reciben daño por el equipo pero ganan bonos por intentos tempranos.
*   **El Daño (DPS):** Alta precisión analítica. Ganan experiencia por respuestas correctas y resolución rápida.
*   **El Sanador (Heal):** Constantes y colaboradores. Mantienen a la "party" unida compartiendo notas o respondiendo dudas.

### 2. Equipos ("Corporate Teams" y Sistema de Bajas)
Tendrás un endpoint en tu panel de administrador para crear equipos de 3 o 4 personas aleatoriamente, balanceando los roles. Podrán asignarle un nombre a su equipo.
*   **Solución a Bajas:** Dado que no pueden cambiar de equipo, si alguien se da de baja a mitad de semestre implementaremos:
    *   *Escalado Dinámico:* La dificultad de los "Jefes" o los requerimientos de puntos de las tareas grupales se ajustan automáticamente al tamaño del equipo activo.
    *   *Fusión de Gremios:* Si dos equipos quedan muy reducidos (ej. 2 personas), el administrador tendrá la opción de fusionarlos.
*   **Comunicación:** Tendrán un chat privado por equipo en su Dashboard para organizarse durante todo el semestre.

### 3. Evitando la Dependencia de IA (Anti-AI Design)
Para las tareas y proyectos en casa:
*   **Sustentación / "Defensa del Castillo":** La tarea escrita vale una fracción, pero la calificación completa se otorga si en clase un miembro del equipo (elegido al azar) puede explicar en el pizarrón el modelo que usaron.
*   **Modelado Local:** Los proyectos requerirán datos del mundo real recolectados por ellos (ej. la tasa de enfriamiento de un café en la cafetería de la universidad midiendo con termómetro, o el vaciado de una botella perforada). La IA no puede inventar un video de ellos tomando los datos empíricos.

## Arquitectura y Tecnologías (Hostinger VPS)

*   **Frontend (Next.js):** UI Cyberpunk (Modo oscuro, rojo y blanco IBERO).
*   **Backend (FastAPI):** Python es excelente para cálculos, IA y WebSockets (necesarios para el chat y los Jefes).
*   **Base de Datos (MySQL):** Almacenará usuarios, progreso, equipos, mensajes del foro y del chat.
*   **Almacenamiento de Archivos (Local VPS):** Utilizaremos directamente el disco duro de tu VPS. ¡100 GB es muchísimo espacio! Considerando 25 alumnos entregando PDFs e imágenes, probablemente no ocupen ni 2 GB en todo el semestre. El backend en FastAPI guardará los archivos en una carpeta `uploads/` y MySQL solo guardará la ruta local. Al terminar el semestre, puedes simplemente vaciar la carpeta y reiniciar la base de datos sin costo adicional.

## Características de la Plataforma

1.  **Dashboard del Estudiante:** Perfil, Rol, XP, Calificaciones, Chat de Equipo, e Inventario de Habilidades.
2.  **Módulos de Estudio (Progresivos):** El temario (leído desde Notion) se irá **desbloqueando módulo por módulo** desde tu panel de administrador para evitar que se adelanten. Cada tema tiene sus notas y un Foro de dudas (público o anónimo).
3.  **Sistema de Archivos y Entregas:** Interfaz donde suben PDFs/Imágenes al VPS local como "Evidencia de Misión".
4.  **Batallas de Jefes en Tiempo Real (Tipo Kahoot):** Usando WebSockets en FastAPI. Proyectas al Jefe en el salón. Los equipos se conectan desde sus celulares/laptops y resuelven el problema. Los primeros en enviar la respuesta correcta hacen "Golpe Crítico". El equipo ganador recibe un botín extra (ítems o XP) que impacta su calificación final.
5.  **Panel de Administrador (UI del Profesor):** 
    *   **Gestor de Calificaciones:** Una tabla editable (estilo Excel) integrada en la web para que subas o actualices manualmente las calificaciones.
    *   Recuperación de contraseñas y Generación aleatoria de equipos.
    *   Desbloqueo de módulos/secciones de Notion.
    *   Lanzar Batallas de Jefes.

## User Review Required

> [!IMPORTANT]
> **Aprobación del Plan Definitivo**
> Ya hemos resuelto todas las dudas. La arquitectura y características están definidas (Almacenamiento local en VPS y Tabla Excel para calificaciones agregados). Si das la autorización, comenzaré con la etapa de ejecución: crearé la lista de tareas `task.md` e inicializaré los repositorios de código.
