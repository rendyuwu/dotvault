# DotVault

DotVault is a private Next.js dashboard for managing Gmail dot aliases. It lets one admin add Gmail accounts, generate sequential dot aliases, save aliases, link aliases to providers, and keep notes for account tracking.

## Features

- Admin-only login; no public registration.
- Gmail account management with normalization for standard `@gmail.com` addresses.
- Dot alias preview and save flow with duplicate skipping.
- Alias search, filters, copy actions, notes, and archive state.
- Provider CRUD and many-to-many alias/provider linking.
- Password hashing with Argon2id.
- HTTP-only session cookies.
- PostgreSQL source of truth with Drizzle migrations.
- Docker Compose deployment bound to localhost for SSH forwarding.

## Tech stack

- Next.js 16
- React 19
- TypeScript
- PostgreSQL 16
- Drizzle ORM
- Zod
- Tailwind CSS
- Vitest
- Playwright
- Docker Compose

## Requirements

- Node.js 20+
- npm
- Docker and Docker Compose for database/deploy flows

## Local setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set strong values for:

- `POSTGRES_PASSWORD`
- `AUTH_SECRET` (at least 32 characters)
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD` (at least 12 characters)

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Run migrations:

```bash
npm run db:migrate
```

Create first admin:

```bash
npm run admin:bootstrap
```

Start dev server:

```bash
npm run dev
```

Open `http://127.0.0.1:3000` and log in with bootstrapped admin credentials.

## Docker deployment

Copy env file and edit secrets:

```bash
cp .env.example .env
```

Start services:

```bash
docker compose up -d postgres
docker compose run --rm bootstrap npm run db:migrate
docker compose --profile bootstrap run --rm bootstrap
docker compose up -d app
```

DotVault binds to localhost only:

- App: `127.0.0.1:3000:3000`
- PostgreSQL: `127.0.0.1:5433:5432`

Access remote deploy through SSH forwarding:

```bash
ssh -L 3000:127.0.0.1:3000 user@your-vps
```

More deployment detail: [DEPLOYMENT.md](DEPLOYMENT.md).

## Scripts

```bash
npm run dev              # start Next.js dev server
npm run build            # build production app
npm run start            # start production app
npm run lint             # run ESLint
npm run test             # run Vitest tests
npm run test:e2e         # run Playwright tests
npm run db:generate      # generate Drizzle migrations
npm run db:migrate       # run Drizzle migrations
npm run admin:bootstrap  # create first admin from env
```

## Backups

PostgreSQL is source of truth. Use `pg_dump` backups and copy them off-host. See [BACKUP.md](BACKUP.md) for backup, restore, and retention commands.

## Security model

DotVault is intended for private VPS use by a single trusted admin. Keep it behind SSH forwarding or a private reverse proxy, use strong secrets, and never commit `.env`.

DotVault does not include public registration, provider signup automation, CAPTCHA bypass, bulk account creation, or ban/provider evasion features.

## License

MIT. See [LICENSE](LICENSE).
