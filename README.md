# Chrono

<p align="center">
  <img src="./static/img/logo.png" width="200" alt="Logo Chrono">
</p>

## Description du projet

Ce projet permet de mettre en place un système de chrono pour s'entraîner dans
des conditions proches d'un tir en salle (FFTA). Il n'a pas pour objectif de
remplacer le système [Chronotir](https://chronotir.fr/) ou
[ArcheryClock](https://www.archeryclock.com/).

## Matériel nécessaire

- Un Raspberry Pi 3 ou plus récent.
- Un écran (TV ou moniteur).
- Un smartphone ou une tablette (pour la télécommande).

---

## 🚀 Installation (Utilisateur)

Cette méthode utilise l'image pré-construite sur le registre GitHub pour une
installation rapide et stable.

### 1. Préparation et paquets

```shell
sudo apt update && sudo apt dist-upgrade -y
sudo apt install -y docker.io hostapd dnsmasq git avahi-daemon unclutter

# Récupération des fichiers de configuration
git clone [https://github.com/gbarre/chrono](https://github.com/gbarre/chrono) ~/chrono
cd ~/chrono
```

### 2. Configuration du Hotspot et de l'affichage

```shell
# Configuration réseau et WiFi
sudo cp configfiles/dhcpcd.conf /etc/dhcpcd.conf
sudo mkdir -p /etc/network/interfaces.d
sudo cp configfiles/wlan0 /etc/network/interfaces.d/wlan0
sudo cp configfiles/hostapd.conf /etc/hostapd/hostapd.conf
sudo cp configfiles/hostapd /etc/default/hostapd
sudo cp configfiles/dnsmasq.conf /etc/dnsmasq.conf
sudo cp configfiles/NetworkManager.conf /etc/NetworkManager/NetworkManager.conf

# Activation des services
sudo systemctl unmask hostapd
sudo systemctl enable hostapd dnsmasq

# Démarrage automatique de l'affichage (mode Kiosk)
mkdir -p ~/.config/autostart
cp configfiles/display.desktop ~/.config/autostart/display.desktop
```

### 3. Lancement de l'application

```shell
sudo docker pull ghcr.io/gbarre/chrono:latest
sudo docker run -d --restart=unless-stopped -p 80:5000 -e HOST=0.0.0.0 --name chrono ghcr.io/gbarre/chrono:latest

sudo reboot
```

## 🛠️ Section Développement (Build Local)

Si vous souhaitez modifier le code ou builder votre propre image Docker
localement.

### Build et test local

```shell
# Build de l'image
sudo docker build -t chrono-dev .

# Lancement en mode test (auto-supprimé après arrêt)
sudo docker run -it --rm -p 80:5000 -e HOST=0.0.0.0 --name chrono-test chrono-dev
```

### Mise à jour manuelle (via sources)

```shell
cd ~/chrono
git pull
sudo docker build -t chrono .
sudo docker stop chrono && sudo docker rm chrono
sudo docker run -d --restart=unless-stopped -p 80:5000 -e HOST=0.0.0.0 --name chrono chrono
```

## 📱 Utilisation

Connectez-vous au WiFi `CHRONO` (mot de passe par défaut : `secret_password`,
défini dans le fichier
[./configfiles/hostapd.conf](./configfiles/hostapd.conf)).

Scannez le QR Code affiché en bas à gauche de l'écran TV.

Réglez vos paramètres sur l'interface mobile et lancez le chrono ! Note :
L'interface est également accessible sur <http://chrono.local>

## Captures

<div style="text-align:center">
  <img src="./img/reglages.png" width="600" alt="reglages" /><br />
  <img src="./img/remote.png" width="600" alt="remote" /><br />
  <img src="./img/chrono.png" width="600" alt="chrono" /><br />
</div>

## Licence

Ce projet est publié sous licence GNU Affero General Public License v3.
