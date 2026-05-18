# Deployment

## Prereqs
- Docker + Docker Compose.
- Private VPS access over SSH.
- No public registration. First admin comes from bootstrap env/CLI only.

## Configure env
```bash
cp .env.example .env
```

Edit `.env`:
- Replace `POSTGRES_PASSWORD` with strong password.
- Replace `AUTH_SECRET` with random value ≥32 chars. Example: `openssl rand -base64 48`.
- Keep `NODE_ENV=production` for deploy.
- Set `APP_URL` to SSH-forwarded or reverse-proxied origin.
- Set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` for first admin. Password must be ≥12 chars and is stored as Argon2id hash, not plaintext.

Never commit `.env`.

## Start services
```bash
docker compose up -d postgres
docker compose run --rm bootstrap npm run db:migrate
docker compose --profile bootstrap run --rm bootstrap
docker compose up -d app
```

App binds to localhost only:
- App: `127.0.0.1:3000:3000`
- Postgres: `127.0.0.1:5433:5432`

Access from local machine:
```bash
ssh -L 3000:127.0.0.1:3000 user@your-vps
```

Open `http://127.0.0.1:3000` locally and login with bootstrapped admin.

## Update deploy
```bash
git pull
docker compose build app bootstrap
docker compose run --rm bootstrap npm run db:migrate
docker compose up -d app
```

## Troubleshooting
- `DATABASE_URL is required`: `.env` missing or not loaded.
- `AUTH_SECRET must be at least 32 characters`: replace sample secret.
- `AUTH_SECRET must not use a placeholder value in production`: generate real secret.
- `BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required`: set bootstrap vars before running bootstrap profile.
- Login fails after bootstrap skipped: user already exists; use existing admin or reset password through DB/admin maintenance path.
