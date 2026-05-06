# Déploiement sur VPS (résumé)

Ce dépôt fournit des **Dockerfile.prod** pour le backend et le frontend. Tu réutilises ton **docker-compose** existant sur le serveur (comme pour Logme) et tu adaptes les noms de services / réseau.

## Prérequis

- MySQL 8.x avec une base dédiée et un utilisateur avec droits sur cette base.
- Variables d’environnement du backend (voir [apps/backend/.env.example](apps/backend/.env.example)), notamment :
  - `NODE_ENV=production` pour cookies `secure` + `sameSite=strict`.
  - `ALLOWED_ORIGINS` : URL exacte du front (HTTPS), séparées par des virgules si plusieurs.
  - Secrets JWT et `HEALTH_DATA_SECRET` forts et uniques.

## Build des images (exemple)

À la racine du monorepo :

```bash
docker build -f apps/backend/Dockerfile.prod -t diana-back:latest .
docker build -f apps/frontend/Dockerfile.prod --build-arg VITE_API_URL=https://ton-domaine.fr/api/v1 -t diana-front:latest .
```

`VITE_API_URL` doit être l’URL publique **complète** du préfixe API (`…/api/v1`), car elle est injectée au **build** du front.

## Au démarrage du backend

Le script [apps/backend/start.sh](apps/backend/start.sh) exécute `yarn migrate` puis `yarn start:prod`. Les migrations TypeORM créent les tables `user` et `daily_logs`.

## Front derrière le même domaine que l’API

Si le SPA et l’API partagent un reverse proxy (Traefik, Caddy, Nginx), configure un `/api` qui proxifie vers le service Nest (`PORT` interne, souvent 3000). Dans ce cas, passe `VITE_API_URL` avec cette URL publique `/api/v1`.

Le fichier [apps/frontend/nginx.conf](apps/frontend/nginx.conf) ne fait que servir les fichiers statiques ; ajoute la partie `location /api/` dans ton proxy principal si besoin.

## Premier utilisateur

Crée un compte via `POST /api/v1/auth/register` ou l’écran d’inscription une fois le front déployé.
