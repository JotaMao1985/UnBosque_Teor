"""Fotografía los cinco simuladores del cap. 6 que proyectan las diapositivas (T7.113).

Usa el fotógrafo de la skill diapositivas-clase (bosque.capturar, el mismo de extraer.py), pero con el
capítulo en un marco de 600 px en vez de 1180: el lienzo de cada simulador mide unos 460 px en vez de
646, y en la columna de la diapositiva su texto sale 1,4 veces más grande (de unos 12 px a unos 17).
Las fotos son el estado inicial de cada simulador, como las de extraer.py.

Uso, desde la raíz del repositorio (necesita Chrome y la skill instalada):
    python3 precalculo/fotografia_simuladores_cap6.py
Después, reconstruir con construir.py: las .png están versionadas y las fuentes las leen.
"""
import shutil
import sys
import tempfile
from pathlib import Path

ANCHO = 600                                   # ancho del marco donde se carga el capítulo, en px
FOTOS = ["m3-1.png", "m5-1.png", "m6-1.png", "m7-1.png", "m10-1.png"]    # las que usan las fuentes

raiz = Path(__file__).resolve().parent.parent
skill = Path.home() / ".claude/skills/diapositivas-clase/scripts"
sys.path.insert(0, str(skill))
import bosque     # noqa: E402
import revisar    # noqa: E402

bosque.CAPTURA = bosque.CAPTURA.replace("width:1180px;height:900px", f"width:{ANCHO}px;height:900px")
assert f"width:{ANCHO}px" in bosque.CAPTURA, "cambió la plantilla de captura de la skill"
_correr = revisar.correr


def correr(args, *a, **k):
    """La ventana de Chrome, a la medida del marco."""
    args = [f"--window-size={ANCHO + 20},950" if x.startswith("--window-size") else x for x in args]
    return _correr(args, *a, **k)


revisar.correr = correr
capitulo = raiz / "sitio/muestreo/capitulo-6-probabilidades-desiguales.html"
dest = raiz / "sitio/muestreo/diapositivas/fuentes/recursos/cap6"
with tempfile.TemporaryDirectory() as tmp:
    bosque.capturar(capitulo, 11, Path(tmp))
    for f in FOTOS:
        assert (Path(tmp) / f).exists(), f"no salió {f}"
        shutil.copyfile(Path(tmp) / f, dest / f)
print(f"{len(FOTOS)} fotos en {dest.relative_to(raiz)}")
