"""Module principal de l'application Flask pour le système de tir à l'arc.

Ce module initialise un serveur Flask et SocketIO pour gérer la communication
entre une télécommande (remote) et un écran d'affichage (display).
"""

import base64
import io
import logging
import os

import qrcode
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)
# Réduire le niveau de log des bibliothèques tierces
logging.getLogger('geventwebsocket.handler').setLevel(logging.WARNING)
logging.getLogger('werkzeug').setLevel(logging.WARNING)
logging.getLogger('engineio').setLevel(logging.WARNING)
logging.getLogger('socketio').setLevel(logging.WARNING)

INSTANCE = os.environ.get('INSTANCE')
DEFAULT_URL = "http://chrono.local"

# Configuration de l'application
# Flask servira automatiquement les fichiers dans le dossier /static
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Déterminer l'URL finale
if INSTANCE:
    final_url = INSTANCE
else:
    final_url = DEFAULT_URL


@app.context_processor
def inject_qrcode():
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
    app.logger.info("📱 REMOTE    : %s/", final_url)
    return render_template("remote.html")


@app.route("/display")
def display() -> str:
    """Route pour l'écran d'affichage sur le Raspberry Pi."""
    app.logger.info("🖥️  AFFICHAGE : %s/display", final_url)
    return render_template("display.html")

# --- GESTION DES ÉVÉNEMENTS SOCKET.IO ---


@socketio.on("command")
def handle_command(data: dict) -> None:
    """Relaye les touches de la télécommande vers l'affichage."""
    app.logger.info("Command received: %s", data)
    emit("ui_update", data, broadcast=True)


@socketio.on("toggle_audio")
def handle_audio(data: dict) -> None:
    """Relaye l'activation/désactivation du son."""
    app.logger.info("Audio state change: %s", data)
    emit("audio_state_change", data, broadcast=True)


@socketio.on("sync_timer")
def handle_sync(data: dict) -> None:
    """Recopie le temps et la phase du chrono du Display vers la Remote."""
    emit("timer_update", data, broadcast=True)


if __name__ == "__main__":
    # Lancement du serveur
    socketio.run(app, host="0.0.0.0", port=5000, debug=False)
