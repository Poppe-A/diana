# diana

Tracker quotidien (ressenti **0 à 10** : mal-être → bien-être, plus jour de règles).

## Stack

- Backend : NestJS + TypeORM + MySQL + JWT (cookies httpOnly)
- Frontend : React + Vite + MUI
- Dev : Docker Compose

## Scripts (racine)

- `yarn back:dev`
- `yarn front:dev`

## Dev via Docker (comme Logme)

- Copier `apps/backend/.env.example` vers `apps/backend/.env`
- `docker compose up -d --build` — les services **back** et **frontend** restent en veille (`sleep infinity`), tu démarres les apps toi-même.

Depuis la racine du monorepo dans le container (`working_dir` : `/app`) :

```bash
docker exec -it diana-back sh -lc "cd /app && yarn install && yarn workspace backend start:dev"
docker exec -it diana-front sh -lc "cd /app && yarn install && yarn workspace frontend dev"
```

(Tu peux adapter : une seule fois `yarn install` si les deux containers partagent déjà le volume `node_modules`.)

## Ports dev (prévu)

- Backend : `http://localhost:3100`
- Frontend : `http://localhost:5273`
- MySQL : `localhost:33160`

