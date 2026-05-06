# diana

Tracker quotidien (douleur 0–10 + jour de règles) pour corrélation dans le temps.

## Stack

- Backend : NestJS + TypeORM + MySQL + JWT (cookies httpOnly)
- Frontend : React + Vite + MUI
- Dev : Docker Compose

## Scripts (racine)

- `yarn back:dev`
- `yarn front:dev`

## Dev via Docker (recommandé)

- Copier `apps/backend/.env.example` vers `apps/backend/.env`
- Lancer `docker compose up -d --build`

## Ports dev (prévu)

- Backend : `http://localhost:3100`
- Frontend : `http://localhost:5273`
- MySQL : `localhost:33160`

