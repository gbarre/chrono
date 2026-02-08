# Chrono

<p align="center">
  <img src="./static/img/logo.png" width="200" alt="Logo Chrono">
</p>

## Description du projet

Ce projet permet de mettre en place un système de chrono pour s'entraîner dans
des conditions proches d'un tir en salle (FFTA). Il n'a pas pour objectif de
remplacer le système [Chronotir](https://chronotir.fr/) ou
[ArcheryClock](https://www.archeryclock.com/).

## Tester la démo

Une plateforme de démo est dispnible [ici](https://chrono.arcpontoise.fr:8443).
Vous pouvez créer une instance et tester le chrono.

**NB : toutes les instances sont supprimées la nuit.**

## Matériel nécessaire

- Une machine disposant de docker.
- Un écran (TV ou moniteur).
- Un smartphone ou une tablette (pour la télécommande).

---

## 🚀 Installation (Utilisateur)

Cette méthode utilise l'image pré-construite sur le registre GitHub pour une
installation rapide et stable.

```shell
sudo apt update && sudo apt dist-upgrade -y
sudo apt install -y docker.io

sudo docker pull ghcr.io/gbarre/chrono:latest
sudo docker run -d \
  --restart=unless-stopped \
  -p 80:5000 \
  -e INSTANCE=http(s)://<votre_ip|votre_fqdn> \
  --name chrono \
  ghcr.io/gbarre/chrono:latest
```

## 🛠️ Section Développement (Build Local)

Si vous souhaitez modifier le code ou builder votre propre image Docker
localement.

### Build et test local

```shell
# Build de l'image
sudo docker build -t chrono-dev .

# Lancement en mode test (auto-supprimé après arrêt)
sudo docker run -it \
  --rm -p 80:5000 \
  -e INSTANCE=http(s)://<votre_ip|votre_fqdn> \
  --name chrono-test \
  chrono-dev
```

### Mise à jour manuelle (via sources)

```shell
cd ~/chrono
git pull
sudo docker build -t chrono .
sudo docker stop chrono && sudo docker rm chrono
sudo docker run -d \
  --restart=unless-stopped \
  -p 80:5000 \
  -e INSTANCE=http(s)://<votre_ip|votre_fqdn> \
  --name chrono \
  chrono
```

## 📱 Utilisation

Connectez-vous sur le même réseau que ceuli de la machine qui héberge la
solution.

Scannez le QR Code affiché en bas à gauche de l'écran TV.

Réglez vos paramètres sur l'interface mobile et lancez le chrono !

## Captures

<p align="center">
  <img src="./img/reglages.png" width="600" alt="reglages" /><br />
  <img src="./img/remote.png" width="600" alt="remote" /><br />
  <img src="./img/chrono.png" width="600" alt="chrono" /><br />
</p>

## Licence

Ce projet est publié sous licence GNU Affero General Public License v3.
