# Backup and restore

PostgreSQL is source of truth. Docker volume `postgres_data` stores database files, but backups should use `pg_dump` and be copied off-host.

## Backup
Create backup directory on host:
```bash
mkdir -p backups
```

Source `.env`, then run `pg_dump` through Compose network:
```bash
set -a
. ./.env
set +a
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-acl > backups/dotvault-$(date +%Y%m%d-%H%M%S).dump
```

Copy backups off-host with `scp`, `rsync`, or another encrypted backup system. Do not commit backups or `.env`.

## Restore warning
Restore overwrites live data. Stop app first and verify backup target before running restore.

```bash
docker compose stop app
set -a
. ./.env
set +a
docker compose exec -T postgres dropdb -U "$POSTGRES_USER" --if-exists "$POSTGRES_DB"
docker compose exec -T postgres createdb -U "$POSTGRES_USER" "$POSTGRES_DB"
docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-acl < backups/dotvault-YYYYMMDD-HHMMSS.dump
docker compose up -d app
```

For plain SQL dumps, use `psql` instead of `pg_restore`:
```bash
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < backups/dotvault.sql
```

## Retention
- Keep daily backups for 7 days.
- Keep weekly backups for 4 weeks.
- Keep monthly backups for 6-12 months if storage allows.
- Test restore on non-production host before trusting schedule.

## Volume note
`postgres_data` is useful for container restarts, not enough for disaster recovery. Disk loss, bad migration, or accidental delete still require `pg_dump` backup.
