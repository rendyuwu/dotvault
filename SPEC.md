# SPEC

## §G GOAL
DotVault private Next.js dashboard lets admin login, add Gmail accounts, generate sequential dot aliases, save/link/provider-track aliases, run via Docker + PostgreSQL.

## §C CONSTRAINTS
- MVP supports only standard `@gmail.com`; Google Workspace/custom domains/plus-addressing ⊥.
- Use Next.js, PostgreSQL, Docker Compose.
- Private VPS deploy; app bind localhost for SSH port forwarding.
- Build frontend-first with mock data; backend/database integration later per task order.
- Avoid one-shot vibe coding; build thin vertical slices, verify each task.
- No public registration; first admin via seed script/CLI/env bootstrap only.
- Passwords stored hashed with Argon2id preferred; bcrypt OK.
- Sessions via HTTP-only cookies; production cookies secure; SameSite Lax/Strict.
- State-changing cookie-auth requests need CSRF protection or framework equivalent.
- Forms validate client + server; Zod preferred.
- No abuse automation: provider signup bots, CAPTCHA bypass, bulk account creation, ban/provider evasion ⊥.
- Preview aliases not persisted until admin clicks Save.
- PostgreSQL source of truth; backups via `pg_dump` docs.
- UI language English.

## §I INTERFACES
- route: `/login` → email/password login, no register link
- route: `/dashboard` → summary cards + quick actions
- route: `/gmail-accounts` → list/add/edit/archive/view Gmail accounts
- route: `/gmail-accounts/new` → add Gmail account form
- route: `/generate` → account selector, count input, preview, copy, save
- route: `/aliases` → alias table, search, filters, copy, link provider
- route: `/aliases/:id` → alias detail, notes, linked providers, archive
- route: `/providers` → provider table, create/edit/archive/view linked aliases
- route: `/providers/:id` → provider detail, edit, linked aliases, link alias
- route: `/settings` → app info, account settings, acceptable-use policy, export/import placeholder
- action: `POST /login` → set secure session cookie
- action: `POST /logout` → clear session cookie
- action: `POST /change-password` ? → update password hash
- action: `GET /gmail-accounts` → list account rows
- action: `POST /gmail-accounts` → create account + ensure original alias
- action: `PATCH /gmail-accounts/:id` → update label/notes/archive
- action: `POST /generate/preview` → return unsaved sequential aliases + stats
- action: `POST /generate/save` → insert previewed aliases, return saved/skipped
- action: `GET /aliases` → list aliases with filters
- action: `GET /aliases/:id` → alias detail
- action: `PATCH /aliases/:id` → update notes/archive
- action: `GET /providers` → list providers
- action: `POST /providers` → create provider
- action: `GET /providers/:id` → provider detail
- action: `PATCH /providers/:id` → update/archive provider
- action: `POST /alias-provider-links` → link alias/provider
- action: `PATCH /alias-provider-links/:id` → update/archive link
- env: `DATABASE_URL` required
- env: `AUTH_SECRET` required
- env: `APP_URL` required
- env: `NODE_ENV` required
- env: `BOOTSTRAP_ADMIN_EMAIL` ? first-user bootstrap
- env: `BOOTSTRAP_ADMIN_PASSWORD` ? first-user bootstrap
- db: `users` stores admin + password hash
- db: `gmail_accounts` unique `(user_id, canonical_email)`
- db: `dot_aliases` unique `(user_id, alias_email)`
- db: `providers` unique `(user_id, name)`
- db: `alias_provider_links` unique `(user_id, alias_id, provider_id)`
- file: `docker-compose.yml` exposes app as `127.0.0.1:3000:3000`, services `app`, `postgres`
- file: `.env` supplies required env vars
- script: seed/CLI bootstrap creates first admin, never public UI

## §V INVARIANTS
V1: ∀ dashboard routes/actions → authenticated user required before data access.
V2: Login/register surface ! contain no public registration path.
V3: Password plaintext ⊥; stored password ! secure hash only.
V4: Session cookie ! HTTP-only; production cookie ! Secure; SameSite ! Lax|Strict.
V5: State-changing request with cookie auth ! CSRF protection or server-action equivalent.
V6: Gmail input ! trim + lowercase + domain exactly `gmail.com`.
V7: Canonical Gmail local part ! remove all dots; domain preserved `gmail.com`.
V8: Duplicate Gmail account per user by canonical email ⊥.
V9: Create Gmail account → canonical original alias exists with `is_original = true`, `dot_count = 0`.
V10: Dot alias generation inserts dots only between characters; never start/end.
V11: Generation order ! canonical first, then increasing dot count, each dot-count combo left-to-right.
V12: Preview generation skips already saved aliases for selected Gmail account.
V13: Preview save rechecks ownership + uniqueness before insert.
V14: DB uniqueness ! prevent duplicate aliases under concurrent save.
V15: If requested aliases > remaining aliases → clear shortage message with available/requested counts.
V16: Max variations for local part length `n` ! equal `2^(n - 1)`.
V17: One alias may link many providers; one provider may link many aliases.
V18: Duplicate `(user_id, alias_id, provider_id)` link ⊥.
V19: Archive flags hide records by default but data remains stored.
V20: Provider category ! free text.
V21: Alias/provider/link notes + link account identifier persist.
V22: Copy single alias and copy preview batch actions available in UI.
V23: Acceptable-use policy visible in app; abuse automation features ⊥.
V24: Frontend mock-data phase ! no backend dependency for core navigation/page UX.
V25: Backend integration ! preserve frontend behavior proven in mock phase.

## §T TASKS
id|status|task|cites
T1|x|scaffold Next.js app shell, routing, layout, nav|I.route,V24
T2|x|create mock data model fixtures for users, Gmail accounts, aliases, providers, links|V24
T3|x|build login page mock flow, no registration UI|I.route,V2,V24
T4|x|build protected dashboard layout mock guard|V1,V24
T5|x|build dashboard summary cards + quick actions from mock data|I.route,V24
T6|x|build Gmail Accounts list/new/edit/archive UI with mock data|I.route,V6,V7,V8,V9,V19,V24
T7|x|build Gmail normalization client helper + UI validation states|V6,V7,V8
T8|x|build Generate page mock flow: selector, count, preview table, stats|I.route,V10,V11,V12,V15,V16,V24
T9|x|build dot-pattern generator unit tests before backend integration|V10,V11,V16
T10|x|build copy single + copy all preview actions|V22
T11|x|build Save Aliases mock flow with skipped/saved result states|V12,V13,V15,V24
T12|x|build Aliases list with search/filter/copy/link-provider entry UI|I.route,V17,V19,V22,V24
T13|x|build Alias detail UI with notes, archive, linked providers|I.route,V17,V19,V21,V24
T14|x|build Providers list/create/edit/archive UI|I.route,V20,V21,V24
T15|x|build Provider detail UI with linked aliases + link alias action|I.route,V17,V20,V21,V24
T16|x|build Alias-Provider link UI with duplicate-link prevention state|I.route,V17,V18,V21,V24
T17|x|build Settings page with app info + acceptable-use policy + change-password placeholder|I.route,V23
T18|x|verify mock frontend golden paths in browser|V24
T19|x|add Docker Compose app/postgres baseline bound localhost|I.file
T20|x|choose ORM/migrations, create schema for users/accounts/aliases/providers/links|I.db,V8,V14,V18
T21|.|implement auth backend login/logout/session + protected routes|I.action,V1,V2,V3,V4,V5
T22|.|implement admin seed/CLI/env bootstrap; no public signup|I.script,V2,V3
T23|.|integrate Gmail account backend actions + original alias transaction|I.action,V6,V7,V8,V9
T24|.|integrate generation preview backend with saved-alias skipping + stats|I.action,V10,V11,V12,V15,V16
T25|.|integrate save preview backend with ownership + uniqueness recheck|I.action,V13,V14
T26|.|integrate alias search/filter/detail/notes/archive backend|I.action,V17,V19,V21,V22,V25
T27|.|integrate provider CRUD/detail/archive backend|I.action,V17,V19,V20,V21,V25
T28|.|integrate alias-provider link create/update/archive backend|I.action,V17,V18,V21,V25
T29|.|implement change password if feasible; else mark high-priority post-MVP in settings|I.action,V3
T30|.|add server/client validation coverage for all forms|V5,V6,V7,V13,V18
T31|.|add database concurrency/uniqueness tests for aliases + links|V14,V18
T32|.|add deployment env sample + backup docs|I.env,I.file
T33|.|run full browser verification against integrated backend|V25

## §B BUGS
id|date|cause|fix
