from functools import wraps
import os
import re
import ast
from datetime import datetime
from datetime import timedelta  # <-- Sumar esto en la primera línea de imports
from flask import (
    Flask,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

app = Flask(__name__)

# --- CONFIGURACIÓN DE SEGURIDAD ---
app.secret_key = "clave_secreta_super_segura_cv77"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(
    minutes=10
)  # <-- Expira a los 10 min

# CREDENCIALES DE ACCESO
USUARIO_ADMIN = "admin"
CLAVE_ADMIN = "cv77"
# ----------------------------------

CARPETA_IMAGENES = "public/uploads"
CARPETA_NOTICIAS = "src/content/noticias"

os.makedirs(CARPETA_IMAGENES, exist_ok=True)
os.makedirs(CARPETA_NOTICIAS, exist_ok=True)


# --- CANDADO DE SEGURIDAD (DECORADOR) ---
def login_required(f):
    @wraps(f)
    def ruta_protegida(*args, **kwargs):
        if "admin_logueado" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)

    return ruta_protegida


def limpiar_nombre(texto):
    texto = texto.lower()
    texto = re.sub(r"[^\w\s-]", "", texto)
    return re.sub(r"[-\s]+", "-", texto).strip("-")

def parsear_md(contenido):
    datos = {
        "titulo": "", "bajada": "", "fecha": "", "autor": "",
        "categorias": [], "tipo": "noticia", "imagen": "",
        "destacada": "false", "mostrarEnInicio": "false", "cuerpo": "",
        "galeria": [] # <-- Agregamos galería vacía por defecto
    }
    
    partes = contenido.split("---", 2)
    if len(partes) >= 3:
        frontmatter = partes[1]
        datos["cuerpo"] = partes[2].strip()
        
        for linea in frontmatter.splitlines():
            if ":" in linea:
                clave, valor = [x.strip() for x in linea.split(":", 1)]
                valor_limpio = valor.strip('"\'')
                
                if clave in ["categorias", "galeria"]: # <-- Ahora lee listas como categorias o galeria
                    try:
                        datos[clave] = ast.literal_eval(valor)
                    except:
                        datos[clave] = []
                elif clave in datos:
                    datos[clave] = valor_limpio
    return datos

# --- RUTAS DE LOGIN Y LOGOUT ---
@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        usuario = request.form.get("usuario")
        password = request.form.get("password")

        if usuario == USUARIO_ADMIN and password == CLAVE_ADMIN:
          session.permanent = True  # <-- Activa el temporizador de 30 minutos
          session["admin_logueado"] = True
          return redirect(url_for("panel"))
        
        else:
            error = "Usuario o contraseña incorrectos."

    return render_template("login.html", error=error)

@app.route("/editar/<nombre_archivo>")
@login_required
def editar_nota(nombre_archivo):
    nombre_limpio = os.path.basename(nombre_archivo)
    ruta_archivo = os.path.join(CARPETA_NOTICIAS, nombre_limpio)

    if not os.path.exists(ruta_archivo):
        return redirect(url_for("lista_notas"))

    with open(ruta_archivo, "r", encoding="utf-8") as f:
        contenido = f.read()

    datos = parsear_md(contenido)
    datos["nombre_archivo"] = nombre_limpio

    return render_template("redactor.html", nota=datos, modo_edicion=True)

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# --- RUTAS PROTEGIDAS DEL REDACTOR ---
@app.route("/")
@login_required
def panel():
    return render_template("redactor.html")


@app.route("/notas")
@login_required
def lista_notas():
    archivos = sorted(os.listdir(CARPETA_NOTICIAS), reverse=True)
    notas_md = [f for f in archivos if f.endswith(".md")]
    return render_template("notas.html", notas=notas_md)


@app.route("/borrar/<nombre_archivo>", methods=["POST"])
@login_required
def borrar_nota(nombre_archivo):
    nombre_limpio = os.path.basename(nombre_archivo)
    ruta_archivo = os.path.join(CARPETA_NOTICIAS, nombre_limpio)

    if os.path.exists(ruta_archivo):
        os.remove(ruta_archivo)

    return redirect(url_for("lista_notas"))


@app.route("/guardar", methods=["POST"])
@login_required
def guardar_nota():
    archivo_original = request.form.get("archivo_original") # Detecta si es una edición
    imagen_actual = request.form.get("imagen_actual", "")

    titulo = request.form.get("titulo")
    bajada = request.form.get("bajada")
    fecha = request.form.get("fecha")
    autor = request.form.get("autor", "Redacción CV77")

    lista_categorias = request.form.getlist("categorias")
    if not lista_categorias:
        lista_categorias = ["general"]

    tipo = request.form.get("tipo")
    cuerpo = request.form.get("cuerpo")

    destacada = "true" if request.form.get("destacada") == "true" else "false"
    mostrar_en_inicio = "true" if request.form.get("mostrarEnInicio") == "true" else "false"

    # 1. Guardamos la imagen (solo si subieron una nueva, si no usa la que ya tenía)
    imagen_file = request.files.get("imagen")
    if imagen_file and imagen_file.filename != "":
        nombre_imagen = imagen_file.filename
        ruta_guardado_img = os.path.join(CARPETA_IMAGENES, nombre_imagen)
        imagen_file.save(ruta_guardado_img)
        ruta_imagen_astro = f"/uploads/{nombre_imagen}"
    else:
        ruta_imagen_astro = imagen_actual

    # 2. Guardamos el AUDIO (Si subieron uno)
    audio_file = request.files.get("audio")
    bloque_audio = ""
    if audio_file and audio_file.filename != "":
        nombre_audio = audio_file.filename
        ruta_guardado_audio = os.path.join(CARPETA_IMAGENES, nombre_audio)
        audio_file.save(ruta_guardado_audio)
        ruta_audio_astro = f"/uploads/{nombre_audio}"
        bloque_audio = f'\n\n<p><strong>🎙️ Escuchar entrevista / audio:</strong></p>\n<audio controls style="width: 100%; margin-bottom: 20px;">\n  <source src="{ruta_audio_astro}" type="audio/mpeg">\n  Tu navegador no soporta el audio.\n</audio>\n\n'

    # 3. Guardamos la GALERÍA DE FOTOS (NUEVO)
    archivos_galeria = request.files.getlist("galeria")
    rutas_galeria = []
    for foto in archivos_galeria:
        if foto and foto.filename != "":
            nombre_foto = foto.filename
            ruta_guardado_foto = os.path.join(CARPETA_IMAGENES, nombre_foto)
            foto.save(ruta_guardado_foto)
            rutas_galeria.append(f"/uploads/{nombre_foto}")

    # 4. Armamos el Markdown (Sumando galeria: {rutas_galeria})
    contenido_markdown = f"""---
titulo: "{titulo}"
bajada: "{bajada}"
fecha: "{fecha}"
autor: "{autor}"
categorias: {lista_categorias}
tipo: "{tipo}"
imagen: "{ruta_imagen_astro}"
galeria: {rutas_galeria}
destacada: {destacada}
mostrarEnInicio: {mostrar_en_inicio}
---
{bloque_audio}{cuerpo}
"""

    slug_titulo = limpiar_nombre(titulo)
    nombre_archivo_md = f"{fecha}-{slug_titulo}.md"
    ruta_guardado_md = os.path.join(CARPETA_NOTICIAS, nombre_archivo_md)

    # Si estamos editando y cambió el nombre del archivo, borramos el original viejo
    if archivo_original and archivo_original != nombre_archivo_md:
        ruta_vieja = os.path.join(CARPETA_NOTICIAS, archivo_original)
        if os.path.exists(ruta_vieja):
            os.remove(ruta_vieja)

    with open(ruta_guardado_md, "w", encoding="utf-8") as archivo:
        archivo.write(contenido_markdown)

    mensaje_accion = (
        "¡Nota editada con éxito!"
        if archivo_original
        else "¡Nota publicada con éxito!"
    )

    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>{mensaje_accion} - CV77</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #111111;
                color: #ffffff;
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }}
            .alerta-exito {{
                width: 100%;
                max-width: 520px;
                background: #181818;
                border: 1px solid #282828;
                border-top: 4px solid #2e7d32;
                border-radius: 12px;
                padding: 40px 30px;
                text-align: center;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.7);
            }}
            .alerta-exito__icono {{
                width: 60px;
                height: 60px;
                margin: 0 auto 18px;
                background: rgba(46, 125, 50, 0.15);
                color: #4caf50;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                font-weight: bold;
            }}
            .alerta-exito__titulo {{
                font-size: 24px;
                margin: 0 0 10px 0;
                color: #ffffff;
            }}
            .alerta-exito__texto {{
                color: #aaaaaa;
                font-size: 15px;
                margin-bottom: 24px;
            }}
            .alerta-exito__archivo {{
                background: #0a0a0a;
                border: 1px solid #282828;
                border-radius: 8px;
                padding: 14px 18px;
                display: inline-block;
                margin-bottom: 30px;
                font-family: monospace;
                font-size: 15px;
                color: #4caf50;
                font-weight: bold;
            }}
            .alerta-exito__botones {{
                display: flex;
                justify-content: center;
                gap: 15px;
                flex-wrap: wrap;
            }}
            .btn-exito {{
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: bold;
                text-transform: uppercase;
                cursor: pointer;
                text-decoration: none;
                font-size: 14px;
                transition: 0.2s;
                border: none;
                font-family: inherit;
            }}
            .btn-exito--primario {{
                background: #ff1a1a;
                color: white;
            }}
            .btn-exito--primario:hover {{
                background: #ff3333;
            }}
            .btn-exito--secundario {{
                background: #252525;
                color: #dddddd;
                border: 1px solid #383838;
            }}
            .btn-exito--secundario:hover {{
                background: #303030;
                color: white;
            }}
        </style>
    </head>
    <body>
        <div class="alerta-exito">
            <div class="alerta-exito__icono">✓</div>
            <h2 class="alerta-exito__titulo">{mensaje_accion}</h2>
            <p class="alerta-exito__texto">
                El archivo Markdown se generó y guardó correctamente en tu carpeta de noticias.
            </p>
            <div class="alerta-exito__archivo">
                📄 <span>{nombre_archivo_md}</span>
            </div>
            <div class="alerta-exito__botones">
                <a href="/" class="btn-exito btn-exito--primario">Escribir otra nota</a>
                <a href="/notas" class="btn-exito btn-exito--secundario">Ver todas las notas</a>
            </div>
        </div>
    </body>
    </html>
    """


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)