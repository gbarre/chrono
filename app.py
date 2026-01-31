"""Module principal de l'application Flask pour le système de tir à l'arc.

Ce module initialise un serveur Flask et SocketIO pour gérer la communication
entre une télécommande (remote) et un écran d'affichage (display).
"""

import base64
import io
import qrcode
import os
import socket

from flask import Flask, render_template
from flask_socketio import SocketIO, emit


INNTANCE = os.environ.get('INNTANCE')
DEFAULT_URL = "http://chrono.local"

# Configuration de l'application
# Flask servira automatiquement les fichiers dans le dossier /static
app = Flask(__name__)
# Utilisation d'une variable d'environnement pour la clé secrète,
# avec une valeur par défaut
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "tir_a_l_arc_secret")
host = os.environ.get("HOST", "127.0.0.1")
socketio = SocketIO(app, cors_allowed_origins="*")


@app.context_processor
def inject_qrcode():
    # Déterminer l'URL finale
    if INNTANCE:
        final_url = f"http://{INNTANCE}"
    else:
        final_url = DEFAULT_URL

    # Génération du QR Code en mémoire (Base64)
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(final_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()

    return dict(
        dynamic_qr=f"data:image/png;base64,{img_str}",
        final_url=final_url,
    )


@app.route("/")
def remote() -> str:
    """Route pour la télécommande sur smartphone."""
    return render_template("remote.html")


@app.route("/display")
def display() -> str:
    """Route pour l'écran d'affichage sur le Raspberry Pi."""
    return render_template("display.html")

# --- GESTION DES ÉVÉNEMENTS SOCKET.IO ---


@socketio.on("command")
def handle_command(data: dict) -> None:
    """Relaye les touches de la télécommande vers l'affichage."""
    emit("ui_update", data, broadcast=True)


@socketio.on("toggle_audio")
def handle_audio(data: dict) -> None:
    """Relaye l'activation/désactivation du son."""
    emit("audio_state_change", data, broadcast=True)


@socketio.on("sync_timer")
def handle_sync(data: dict) -> None:
    """Recopie le temps et la phase du chrono du Display vers la Remote."""
    emit("timer_update", data, broadcast=True)


if __name__ == "__main__":
    # Détermination de la vraie IP locale
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # On ne se connecte pas vraiment,
        # on regarde juste par quel chemin on sortirait
        s.connect(("8.8.8.8", 1))
        local_ip = s.getsockname()[0]
    except OSError:
        local_ip = "127.0.0.1"
    finally:
        s.close()

    app.logger.info("\n%s", "="*30)
    app.logger.info("🏹 SYSTÈME DE TIR ARCHERIE")
    app.logger.info("="*30)
    app.logger.info("🖥️  AFFICHAGE : http://%s:5000/display", local_ip)
    app.logger.info("📱 REMOTE    : http://%s:5000/", local_ip)
    app.logger.info("%s\n", "="*30)

    # Lancement du serveur
    socketio.run(app, host=host, port=5000, debug=False)
