"""datos.py — Todo lo que la guía del proyecto integrador AFIRMA con una cifra.

Fechas, pesos, rúbrica, tope, extensiones y equipos viven aquí y en ningún otro
sitio. El ensamblador (`ensamblado/ensambla_proyecto.py`) los imprime y el
auditor (`ensamblado/proyecto/audita_proyecto.py`) los vuelve a calcular por su
cuenta sobre el artefacto. Una cifra tecleada en dos sitios se despega en uno.

La guía está CALCADA de la del proyecto aplicado de Diseño de Experimentos
(`Diseno de experimentos/proyecto/datos.py`): mismo reparto, mismos niveles,
mismo tope, mismo canal y mismo descuento. Lo que cambia es el contenido —una
encuesta por muestreo, no un experimento— y el calendario de la ficha y del
protocolo. Las decisiones están en `PLAN_Proyecto_Muestreo.md` (DM1–DM12) y las
de la modalidad conjunta en `PLAN_Proyecto_Conjunto.md` (D1–D16).
"""
from __future__ import annotations

from datetime import date, timedelta

# ---------------------------------------------------------------------------
# El calendario del curso: el mismo ancla que Diseño (la semana 9 es el receso,
# del lunes 5 al sábado 10 de octubre de 2026).
# ---------------------------------------------------------------------------
SEMANA_9_EMPIEZA = date(2026, 10, 5)


def lunes_de_la_semana(n: int) -> date:
    return SEMANA_9_EMPIEZA + timedelta(weeks=n - 9)


def semana_del_curso(d: date) -> int:
    return 9 + (d - SEMANA_9_EMPIEZA).days // 7


DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
         "septiembre", "octubre", "noviembre", "diciembre"]


def frase_fecha(d: date) -> str:
    """«viernes 30 de octubre». El día de la semana SALE de la fecha."""
    return f"{DIAS[d.weekday()]} {d.day} de {MESES[d.month - 1]}"


def frase_semana(n: int) -> str:
    """«del lunes 23 al sábado 28 de noviembre», para una semana del curso."""
    ini, fin = lunes_de_la_semana(n), lunes_de_la_semana(n) + timedelta(days=5)
    if ini.month == fin.month:
        return f"del {DIAS[0]} {ini.day} al {DIAS[5]} {fin.day} de {MESES[fin.month - 1]}"
    return f"del {frase_fecha(ini)} al {frase_fecha(fin)}"


# ---------------------------------------------------------------------------
# DM3 · Los hitos. Todas las entregas cierran a la misma hora (D8 de Diseño)
# ---------------------------------------------------------------------------
HORA_ENTREGA = "11:00"

# La ficha no puede ser la del 16 de octubre de Diseño: esta guía sale después.
# El protocolo cierra el MISMO día que el preregistro conjunto (D9 del plan
# conjunto), y avance e informe en las fechas de Diseño.
HITOS = [
    dict(id="ficha", n=1, nombre="Ficha del tema", fecha=date(2026, 10, 27), semana=12,
         entrega="Una ficha de unas 150 palabras: población, marco y diseño que piensas usar"),
    dict(id="protocolo", n=2, nombre="Protocolo", fecha=date(2026, 10, 30), semana=12,
         entrega="El diseño completo, escrito antes de seleccionar una sola unidad"),
    dict(id="avance", n=3, nombre="Avance", fecha=date(2026, 11, 6), semana=13,
         entrega="La muestra seleccionada, los datos recogidos, la bitácora de campo y la no respuesta"),
    dict(id="informe", n=4, nombre="Informe y código", fecha=date(2026, 11, 23), semana=16,
         entrega="El informe, el código que lo produce y los datos"),
]
HITO = {h["id"]: h for h in HITOS}

# PE-2 (Javier, 22 oct 2026): el campo cierra una semana después del avance, con
# una release sin nota. No es un hito con módulo propio: va en la tabla, sin número.
CAMPO = dict(id="campo", nombre="Cierre del campo", fecha=date(2026, 11, 13), semana=14,
             entrega="La release campo, sin nota: lo que esté en datos/ a esa hora es lo que se estima")

# IA-2 (Javier, 22 oct 2026): la semilla de la selección no la elige el equipo. El
# docente la publica al cierre del protocolo, en un issue del repositorio.
HORA_SEMILLA = "11:05"
CANAL_SEMILLA = "en un issue de tu repositorio titulado «semilla»"

# PE-20 (Javier, 22 oct 2026): qué es una sesión, para el descuento por retraso.
CLASES = "los jueves y viernes de 9:00 a 11:00"

# DM4 · La exposición: en clase, en la semana 16; el día se acuerda en clase
# (Javier, 21 oct 2026, para la sustentación de Muestreo).
SEMANA_EXPOSICION = 16
DIA_EXPOSICION = "el día exacto se acuerda en clase"
MINUTOS_EXPOSICION = 10
MINUTOS_PREGUNTAS = 5        # por persona (IA-3, Javier, 22 oct 2026)
PREGUNTAS_POR_PERSONA = 2    # una de ejecución y otra del tipo de las publicadas

# DM1 · Equipos
MAX_INTEGRANTES = 2

# Topes de extensión
PALABRAS_FICHA = 150
PAGINAS_PROTOCOLO = 3
PAGINAS_INFORME = 10

# Requisito 4 del integrador: tamaño mínimo de la muestra
N_MINIMO = 30

# DM8 · El canal: un repositorio privado de GitHub por equipo, y cada hito es
# una release con su etiqueta (D10 de Diseño).
CANAL_ENTREGA = "como una release del repositorio del proyecto en GitHub"
USUARIO_DOCENTE = "JotaMao1985"
NOMBRE_REPO = "proyecto-muestreo-apellido1-apellido2"
ETIQUETA = {h["id"]: h["id"] for h in HITOS + [CAMPO]}

# DM9 · Entrega tardía (D11 de Diseño): el 15 % de la nota ORIGINAL por sesión.
DESCUENTO_POR_SESION = 15
EJEMPLO_RETRASO = 4.0
SESIONES_EJEMPLO = (0, 1, 2, 3)
TUTORIAS = (("martes y viernes", "11:00", "13:00"), ("jueves", "14:00", "16:00"))
DUDAS_EN = "en clase o en las horas de tutoría"

# ---------------------------------------------------------------------------
# DM6 · Pesos (D16 del plan conjunto: el Corte III como el de Diseño)
# ---------------------------------------------------------------------------
PROYECTO_DEL_CORTE = 50      # % del Corte III (Javier, 21 oct 2026; el sílabo decía 20)
QUICES_DEL_CORTE = 50        # el resto: quices en clase, sin examen final (D16)
CORTE_III_DEL_CURSO = 40     # % del curso, como dice el sílabo
PROYECTO_DEL_CURSO = PROYECTO_DEL_CORTE * CORTE_III_DEL_CURSO / 100

NIVELES = [("insuficiente", 1.0), ("aceptable", 3.5), ("sólido", 5.0)]
VALOR_NIVEL = dict(NIVELES)

# DM10 · La rúbrica: los seis criterios del integrador (C1–C6) repartidos por
# hitos con los puntos de Diseño. Entre paréntesis, el criterio de origen.
RUBRICA = [
    dict(hito="protocolo", titulo="Protocolo", criterios=[
        dict(id="P1", nombre="Población, marco y cobertura", puntos=4,
             insuficiente="La población es vaga, o el «marco» es quien responda: no hay una lista "
                          "de la que se seleccione.",
             aceptable="El marco está descrito, pero se trata como si fuera la población, o dice "
                       "qué unidades de la población objetivo quedan fuera sin decir hacia dónde "
                       "sesga esa ausencia.",
             solido="El marco está descrito, dice qué unidades de la población objetivo quedan "
                    "fuera y razona hacia dónde sesga esa ausencia."),
        dict(id="P2", nombre="El diseño y sus probabilidades de inclusión", puntos=6,
             insuficiente="El diseño no es probabilístico: para alguna unidad no se puede escribir "
                          "su probabilidad de inclusión.",
             aceptable="Diseño probabilístico con su probabilidad de inclusión escrita, pero con una "
                       "justificación genérica («el estratificado es más preciso») o sin "
                       "alternativas.",
             solido="La probabilidad de inclusión escrita para cada unidad, el guion de selección "
                    "comprobado unidad por unidad, y el diseño comparado con al menos una "
                    "alternativa por su varianza esperada, su costo o ambos."),
        dict(id="P3", nombre="El tamaño, el plan de estimación y la ética", puntos=5,
             insuficiente="El tamaño no se justifica o no llega al mínimo, o no hay plan de "
                          "estimación.",
             aceptable="Tamaño justificado y estimadores nombrados, pero sin la varianza que "
                       "corresponde al diseño, sin plan para la no respuesta o sin la ética cuando "
                       "hay personas.",
             solido="Tamaño justificado por una precisión objetivo o por el presupuesto, con su "
                    "cálculo; estimador y varianza que corresponden al diseño; plan para la no "
                    "respuesta y consideraciones éticas."),
    ]),
    dict(hito="avance", titulo="Avance", criterios=[
        dict(id="A1", nombre="La selección reproducible y el campo documentado", puntos=6,
             insuficiente="La muestra no sale del guion de selección, o no hay bitácora de campo.",
             aceptable="Guion con semilla y datos recogidos, pero la muestra entregada no es la que "
                       "escribe el guion, o la bitácora no registra cada contacto.",
             solido="El guion, con la semilla publicada, reproduce exactamente la muestra entregada y la "
                    "bitácora registra cada contacto por su identificador; con un archivo público, "
                    "la descarga, su versión y qué unidades salieron sin dato."),
        dict(id="A2", nombre="La no respuesta y las desviaciones", puntos=4,
             insuficiente="No se reporta la no respuesta, o las desviaciones del protocolo se "
                          "esconden.",
             aceptable="La tasa de respuesta y las desviaciones están declaradas, pero no qué "
                       "consecuencia tienen para la estimación, o falta el primer resumen.",
             solido="La no respuesta y cada desviación, con su posible efecto en la estimación, y "
                    "un primer resumen descriptivo que se lee."),
    ]),
    dict(hito="informe", titulo="Informe y código", criterios=[
        dict(id="I1", nombre="Justificación del diseño", puntos=8,
             insuficiente="No se justifica el diseño, o no corresponde a la estructura de la "
                          "población.",
             aceptable="La justificación es correcta y menciona alternativas, pero no las "
                       "cuantifica.",
             solido="Compara al menos dos diseños y cuantifica la diferencia —varianza esperada, "
                    "costo o ambos—; la elección se sigue del cálculo. En la modalidad conjunta, "
                    "además, dice qué da cada aleatorización y cómo entra el diseño muestral en el "
                    "análisis del experimento."),
        dict(id="I2", nombre="Corrección técnica de la estimación", puntos=12,
             insuficiente="Analiza la muestra como si fuera aleatoria simple sin serlo —la varianza "
                          "ignora los conglomerados—, los pesos de diseño no son el inverso de la "
                          "probabilidad de inclusión, o se ajustan sin declarar el ajuste ni su "
                          "supuesto.",
             aceptable="El estimador es correcto, pero la varianza omite los estratos o la "
                       "corrección por población finita sin decirlo, o el resultado correcto se "
                       "verificó por una sola vía.",
             solido="Estimador y varianza que corresponden al diseño, pesos bien construidos, todo "
                    "ajuste declarado con su supuesto, y el resultado verificado por dos vías: la "
                    "fórmula del mismo estimador y survey, o una simulación."),
        dict(id="I3", nombre="Reporte de la incertidumbre", puntos=8,
             insuficiente="Estimaciones puntuales sin error estándar ni intervalo.",
             aceptable="Error estándar e intervalo correctos, pero mal interpretados o sin el "
                       "efecto de diseño cuando el diseño lo pide.",
             solido="Error estándar e intervalo correctos, el efecto de diseño cuando corresponde, "
                    "y la interpretación en el lenguaje del problema, no en el de la fórmula."),
        dict(id="I4", nombre="Limitaciones y no respuesta", puntos=9,
             insuficiente="Presenta los resultados como más concluyentes de lo que el diseño "
                          "permite, o extrapola fuera de la población muestreada.",
             aceptable="Menciona limitaciones, pero genéricas, o la no respuesta sin su efecto.",
             solido="Dice qué no se puede concluir con este diseño, razona el efecto de la "
                    "cobertura del marco y de la no respuesta, y no extrapola fuera de la población "
                    "muestreada. En la modalidad conjunta, además, a qué población se generaliza "
                    "el efecto."),
        dict(id="I5", nombre="Fidelidad al protocolo y reproducibilidad", puntos=5,
             insuficiente="El informe no se reproduce desde el repositorio —faltan los datos, hay "
                          "rutas absolutas—, el análisis cambia respecto al protocolo sin decirlo, "
                          "o hay datos personales en el repositorio.",
             aceptable="El informe se reproduce, pero el README no dice cómo, los datos crudos se "
                       "editaron a mano, lo exploratorio va mezclado con lo planeado o el informe "
                       "pasa de su extensión.",
             solido="Se clona el repositorio, se sigue el README y el informe sale entero; los "
                    "datos crudos están intactos y lo exploratorio va aparte, marcado como tal."),
        dict(id="I6", nombre="Declaración de uso de IA", puntos=3,
             insuficiente="No hay declaración, o dice «se usó IA» sin más.",
             aceptable="Dice qué herramienta y para qué, pero no qué se verificó.",
             solido="Dice qué herramienta, para qué, qué produjo y qué se verificó o corrigió, con "
                    "un ejemplo concreto, como la comprobación de las probabilidades de inclusión; "
                    "o declara que no se usó ninguna."),
    ]),
    dict(hito="exposicion", titulo="Exposición", criterios=[
        dict(id="E1", nombre="La exposición", puntos=12,
             insuficiente="Se pasa del tiempo, o no se entiende qué se estimó ni con qué diseño.",
             aceptable="Cuenta la encuesta en el tiempo, pero sin decir qué salió distinto de lo "
                       "planeado o qué no se puede concluir.",
             solido="Cuenta en el tiempo la pregunta, el diseño, lo que salió distinto en el campo, "
                    "la estimación con su incertidumbre y sus límites."),
        dict(id="E2", nombre="Las preguntas", puntos=18, individual=True,
             insuficiente="No sabe explicar una decisión de su propio diseño.",
             aceptable="Explica lo que hizo, pero no por qué, o no qué habría cambiado con otra "
                       "decisión.",
             solido="Explica lo que hizo, por qué, y qué habría cambiado con otra decisión: de "
                    "diseño, de marco o de ajuste."),
    ]),
]

# Lo que el tope multiplica: lo escrito (protocolo, avance e informe).
HITOS_ESCRITOS = ("protocolo", "avance", "informe")

# DM10 · Las dos condiciones que no son de nivel sino de validez.
# PE-4 (Javier, 22 oct 2026): si llega al informe, lo escrito no pasa de 3,0.
TOPE_NO_PROBABILISTICO = 3.0
CONDICION_NO_PROBABILISTICO = ("lo normal es que se vea en el protocolo: P2 queda en "
                               "«insuficiente» y el protocolo se rehace antes de seleccionar, con "
                               "una release protocolo-2. Si llega así al informe, la nota de lo "
                               "escrito no pasa de 3,0, antes del tope de las preguntas")

# ---------------------------------------------------------------------------
# DM7 · El tope: las preguntas acotan lo escrito (D7 de Diseño)
# ---------------------------------------------------------------------------
UMBRAL_TOPE = 3.0


def puntos_de(hito: str) -> int:
    return sum(c["puntos"] for b in RUBRICA if b["hito"] == hito for c in b["criterios"])


def factor_tope(preguntas: float) -> float:
    return min(1.0, preguntas / UMBRAL_TOPE)


def nota_proyecto(escrito: float, exposicion: float, preguntas: float,
                  con_tope: bool = True) -> float:
    """Nota del proyecto en la escala de 5, con lo escrito evaluado en bloque.
    Redondeada a dos decimales aquí, para que lo impreso y lo calculado sean el
    mismo carácter."""
    f = factor_tope(preguntas) if con_tope else 1.0
    p_esc = sum(puntos_de(h) for h in HITOS_ESCRITOS)
    p_e1 = next(c["puntos"] for b in RUBRICA for c in b["criterios"] if c["id"] == "E1")
    p_e2 = next(c["puntos"] for b in RUBRICA for c in b["criterios"] if c["id"] == "E2")
    return round((p_esc * escrito * f + p_e1 * exposicion + p_e2 * preguntas) / 100, 2)


# Solo valores alcanzables: E1 es un criterio (1,0 · 3,5 · 5,0) y las preguntas
# una media de niveles (con dos preguntas, también 2,25, 3,0 y 4,25).
EJEMPLOS_TOPE = [
    ("Proyecto impecable que no sabe defender", 5.0, 5.0, 1.0),
    ("Una pregunta aceptable y otra insuficiente: justo por debajo del umbral", 4.25, 3.5, 2.25),
    ("Proyecto flojo, pero lo defiende bien", 3.0, 3.5, 5.0),
]


def filas_tope() -> list[dict]:
    return [dict(situacion=s, escrito=e, exposicion=x, preguntas=q,
                 factor=round(factor_tope(q), 2),
                 sin_tope=nota_proyecto(e, x, q, con_tope=False),
                 con_tope=nota_proyecto(e, x, q))
            for s, e, x, q in EJEMPLOS_TOPE]


def nota_con_retraso(original: float, sesiones: int) -> float:
    """DM9: el 15 % de la nota ORIGINAL por sesión, sin bajar de 0."""
    return round(max(0.0, original * (1 - sesiones * DESCUENTO_POR_SESION / 100)), 2)


def filas_retraso() -> list[dict]:
    return [dict(sesiones=s, descuento=s * DESCUENTO_POR_SESION,
                 nota=nota_con_retraso(EJEMPLO_RETRASO, s)) for s in SESIONES_EJEMPLO]


# ---------------------------------------------------------------------------
# DM12 · La modalidad conjunta (PLAN_Proyecto_Conjunto.md, D1–D16). La siguen
# los equipos conjuntos EN LUGAR de los hitos de arriba: su calendario y sus
# etiquetas son los de Diseño.
# ---------------------------------------------------------------------------
CONJUNTO_HITOS = [
    dict(id="conjunto", nombre="Release «conjunto»: inscripción en la modalidad",
         fecha=date(2026, 10, 23)),
    dict(id="preregistro", nombre="Preregistro conjunto (reemplaza al protocolo)",
         fecha=date(2026, 10, 30)),
    dict(id="avance", nombre="Avance", fecha=date(2026, 11, 6)),
    dict(id="informe", nombre="Informe y código", fecha=date(2026, 11, 23)),
]
CONJUNTO_PAGINAS_PREREGISTRO = 3
CONJUNTO_PAGINAS_INFORME = 15
CONJUNTO_PAGINAS_INTEGRACION = "1 a 2"
CONJUNTO_REPO = "proyecto-dde-apellido1-apellido2"
CONJUNTO_DESISTIR_HASTA = date(2026, 11, 6)


# ---------------------------------------------------------------------------
# Formato de las cifras (las mismas grafías que Diseño)
# ---------------------------------------------------------------------------
def nota(x: float) -> str:
    """Escala de 5 con coma decimal y SIEMPRE con decimal: «3,0», «4,5», «2,56»."""
    s = f"{x:.2f}"
    if s.endswith("0"):
        s = s[:-1]
    return s.replace(".", ",")


def divisor(x: float) -> str:
    """El mismo número dentro de una fórmula, con punto y sin decimal sobrante."""
    return f"{x:.2f}".rstrip("0").rstrip(".")


def pct(x: float) -> str:
    return f"{x:.2f}".rstrip("0").rstrip(".")


def tutorias_en() -> str:
    return " y ".join(f"<strong>{d} de {i} a {f}</strong>" for d, i, f in TUTORIAS)
