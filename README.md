# starter-project

Next.js app with Postgres and Redis, built with:

- Next.js
- TypeScript
- Docker Compose
- Prisma
- PostgreSQL
- Redis
- Prometheus
- Grafana

- To see app on local dev: http://localhost:3000
- To see health: http://localhost:3000/api/health

## Run

First time running this repo:
```sh
cp .env.example .env   # then follow instructions at top
docker compose up -d --build
```

Edits under `app/src` hot reload in the browser. No rebuild.

```sh
docker compose down       # stops container, keeps data
docker compose down -v    # stops container, deletes data
```

Load demo with `docker compose run --rm migrate npx prisma db seed`.

## Prometheus and Grafana

```sh
docker compose --profile observability up -d
```

- Prometheus: http://localhost:9090/targets
- Grafana: http://localhost:3001 (user and password are `GF_SECURITY_ADMIN_USER` and `GF_SECURITY_ADMIN_PASSWORD` in `.env`)
