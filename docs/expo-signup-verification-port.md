# Expo signup and verification port

## Target and source

Target: `danieog/braincraze`, branch `feat/expo-signup-verification-flow`, based on main commit `04c7fc125e975c726741401135b3b13305cad623`.

[PR #3](https://github.com/danieog/braincraze/pull/3) was already merged in commit `acce7c60d499d0d5d1bb8ee58d075dff1d4425e9`. Its `login-signup` head is `d15d96fe0565116da3fa86050359936b7613ef3b`. This port belongs in a **new pull request against main**, rather than the already merged PR.

Source concepts: [Mechelle626/Mechelle626 signup-verification branch](https://github.com/Mechelle626/Mechelle626/tree/feat/signup-verification-flow), commit `e0b931fe9893f1d79e68ddb2681fd38ff1d18685`. That is a Next.js/PostgreSQL app. Its components, session cookies, database schema, server middleware, and API routes cannot be dropped into an Expo/Supabase app unchanged.

The fetched `origin/mechelle-changes` points to `d4f31e6e0b36804bb8ad7bfdafc3b1e455fc3b9f`, which **adds** 152 files under `export/`. This port starts from main and does not add or delete that directory. It implements native Expo code in `src/` and one additive Supabase migration. It does not claim the entire Next.js application has been merged.

## Completed and locally verified

- Signup password confirmation, 12–128 character client validation, password visibility, length/variety guidance, labeled inputs and a scrollable mobile form. Existing login passwords remain supported.
- Signup confirmation copy distinguishes account creation from school affiliation approval. Passwords are cleared after successful signup.
- A confirmation-email resend screen using Supabase Auth, a 60-second UI cooldown, validation, provider-error display and generic success copy. A successful API call is described as an email request, not proof of delivery.
- Session state records the Supabase user's email-confirmation flag. Protected Expo routes require a signed-in, confirmed-email session. Existing database authorization remains authoritative; local UI flags do not grant backend permissions.
- A late session-restore response cannot overwrite a newer authentication event. Restore failures display an error.
- Four-step saved progress: account, email, ID submission and school-affiliation review. Only the first unfinished step has a Continue link. Signed-in visitors resume from the home screen instead of creating another account.
- A read-only owner-selected progress RPC. It returns only email/affiliation booleans and the latest review state, not email addresses, document paths, internal AI findings, or another account's data.
- Queued/manual review remains incomplete; rejection and reupload resume evidence collection. Reopening the ID screen restores saved status and hides duplicate-upload controls for pending requests.
- When storage and queue recording succeed but the auxiliary check invocation fails, the upload remains saved and the UI explicitly reports the check failure. It does not invent a successful scan or approval.
- ID retention copy now acknowledges that deletion is attempted after review and that failures need administrator follow-up. Existing private storage and manual-review functions remain in use.

## Database and API changes

Apply `supabase/migrations/004_verification_progress.sql` after migrations 001–003 in the intended Supabase project. It creates `public.my_verification_progress()`:

- No parameters: ownership comes from `auth.uid()`.
- `SECURITY DEFINER`, fixed search path, fully qualified table references.
- Anonymous/public execution revoked; authenticated execution granted.
- Missing identity rejected; no profile, trust, role, badge or request writes.
- Returns `email_verified`, `school_verified`, `review_status` as JSON.

No tables or columns were added. Existing RLS policies and service-role secrets were not changed. Existing RPCs and the `verify-id` Edge Function are reused. `submitId()` now returns `{ requestId, checkInvocationFailed }`; its one application caller was updated. `resendConfirmation()` wraps Supabase Auth's signup-email resend API.

If migration 004 has not been applied, progress displays the real error with a retry action; it never fabricates a completed state. **This migration has not been applied to a live Supabase project by this task.**

## Reproduce checks

Node 24 and the committed package lock were used. No application dependencies or lockfiles were changed.

```sh
npm ci --cache /tmp/braincraze-npm-cache --no-audit --no-fund
EXPO_NO_TELEMETRY=1 npm run lint
./node_modules/.bin/tsc --noEmit
npm test -- --runInBand
EXPO_NO_TELEMETRY=1 npm run export:web
```

The explicit cache and telemetry setting accommodate this cloud sandbox's unwritable home directory. They do not relax artifact integrity, TLS, or application security.

The SQL fixture uses real PostgreSQL via PGlite, installed outside the application. It creates minimal auth/profile/request fixtures in a disposable database and never connects to hosted Supabase:

```sh
npm install --prefix /tmp/braincraze-sql-test --cache /tmp/braincraze-npm-cache --no-package-lock --no-save @electric-sql/pglite@0.5.10
node scripts/test-verification-progress.mjs /tmp/braincraze-sql-test/node_modules/@electric-sql/pglite/dist/index.js
```

## Test results

- Baseline Jest suite: 74 passed across 6 suites.
- Final Jest suite: **107 passed across 15 suites**, zero failing/skipped/todo tests.
- TypeScript: passed.
- Expo lint: passed with five existing warnings in earlier landing/location tests; zero errors and no new warnings.
- Expo web export: passed. This validates bundling, not live authentication or a production deployment.
- SQL fixture: passed anonymous denial, missing-session denial, owner isolation, no caller-selected owner, no approval writes, latest-request selection and saved email state.
- Development failures resolved: sandbox npm cache/Expo telemetry writes, effect lint violations, Jest mock initialization, a strict text assertion, and test-component display names. No security checks were disabled to make tests pass.

All provider responses, sessions, images and review states in tests are explicit fixtures. SQL tests use a minimal schema, not the full deployed Supabase service. Native device/camera acceptance testing and live email/identity services were not performed. Official SDK 57 documentation fetches were denied by the network proxy; installed SDK types and existing project API patterns were used, then validated with type checking, tests and a web export.

## Partial, blocked and missing features

This is a focused signup/verification-flow port. It does not port the whole 214-file Next.js repository or satisfy every earlier platform phase.

| Integration | Status and evidence |
| --- | --- |
| Supabase signup/login/resend | ⚠ Implemented; adapter/UI tests use fixtures. Valid project configuration, email confirmation policy, redirect allowlist and live acceptance tests remain required. |
| Progress RPC | ⚠ Implemented and locally verified in a SQL fixture; live migration/deployment remains required. |
| ID storage/review | ⚠ Existing implementation plus persisted progress; live bucket policies, Edge Function, reviewer privileges and deletion behavior need testing. |
| Auxiliary Ollama ID check | ⚠ Existing server implementation; live credentials/configuration not verified. New UI reports invocation failures explicitly. |
| Independent CAPTCHA/human check | ❌ Not implemented by this port. Existing migration 002 creates a `human_verified_at` marker on email confirmation. That marker is not proof of CAPTCHA completion. This port deliberately does not display it as a verified human check. |
| Automated selfie liveness / face matching | ❌ Not implemented. |
| Next.js localization/admin/billing/personal-identity features | ❌ Not ported here. New Expo source copy is English; full multilingual parity, alternative IDs and selfie workflows remain separate work. |

The application's existing school-email policy still requires a configured school domain, including the ID path. Schools with empty domain lists cannot use that existing submission RPC until an operator supplies an authoritative domain policy. The new migration does not bypass it.

Production security remains **partial**: independent CAPTCHA, server-enforced password policy, configured Supabase email confirmation, redirects, live RLS/storage acceptance tests, administrator security, evidence scanning and retention need review before a public launch. Client password rules and Expo navigation do not replace those controls. No payment, third-party identity service, email delivery, or deployed integration is certified by these local tests.
