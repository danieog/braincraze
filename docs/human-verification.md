# Human verification: implementation and deployment audit

## Problem confirmed from live evidence

The user exported the live `my_trust_level()` and `start_school_verification(text,uuid,text,text)` functions. A confirmed email without an `account_trust` row yields level 1, while ID submission requires level 2 but reports “verify your email first.” The accompanying read-only account query returned `email_confirmed=true`, `has_trust_record=false`.

Migration 002's historical trigger attempts to label email confirmation as human verification. Neither that marker nor successful email delivery is proof of CAPTCHA completion. This change does not backfill or fabricate human approvals, lower the ID trust requirement, or approve school affiliation.

## Implemented changes

- `/human-verification`, available after email confirmation, with a real web CAPTCHA widget, server verification, error/expiry/retry states and persistence checking before Continue is shown.
- Configurable Cloudflare Turnstile (default), hCaptcha and reCAPTCHA **v2 checkbox**. These are selectable operator configurations; reCAPTCHA v3/invisible modes are not implemented.
- Five-step progress: account → email → human check → school ID → school review. The client requires the new server `human_verified` boolean; old/malformed responses remain locked.
- Human-gated ID and nearby UI. A locked nearby screen still provides a Stop location sharing action; the backend `stop_sharing()` operation is not gated behind CAPTCHA.
- An authenticated `human-verification` Supabase Edge Function with `start` and `verify` actions. No caller-supplied user ID, provider URL, success flag, or secret is accepted.
- The Edge Function validates the bearer token through Supabase Auth before reading its session claim. Challenges are account/session-bound, expire after five minutes, are invalidated when a new unconsumed check begins in that session, and are rate limited to 20 starts per account per ten minutes.
- Tokens are SHA-256 hashed and consumed before the provider request; provider rejection/network failure requires a fresh challenge. Provider calls use fixed HTTPS endpoints, no redirects, an eight-second timeout and exact hostname validation. Turnstile additionally binds action and `cdata` to the server challenge nonce. hCaptcha/reCAPTCHA lack this Turnstile-specific nonce echo: they use authenticated challenge ownership, provider hostname validation and shared token replay prevention.
- Granting status rechecks the confirmed account, live auth-session row, challenge state and expiry after the provider call. Session revocation during the provider request prevents completion.
- No raw CAPTCHA tokens, provider secrets, provider response bodies or ID images are stored/logged by this implementation. Requests have an 8 KiB body cap, use explicit CORS origins and return no-store responses.

## Database migration 005

`supabase/migrations/005_human_verification.sql` is additive to migrations 001–004 and is transactional.

- Removes the email-confirmation trigger. The old function, if present, loses public/client execution privileges.
- Adds private/RLS-enabled `human_verification_challenges` and `human_verification_tokens` tables, an account/time index and hashed-token uniqueness.
- Adds `provider` and `challenge_id` proof references to `account_trust`. Old marker rows remain as historical data; they never satisfy the new checks.
- Changes `my_trust_level()` to require completed provider evidence, including for previously school-approved users. A confirmed email alone is level 1; verified human is level 2; verified human plus approved school is level 3.
- Adds `require_human_verified()`, `begin_human_verification()`, and service-role-only `consume_human_verification(...)` / `complete_human_verification(...)` RPCs. Anonymous/client callers cannot grant proof or write private proof tables.
- Extends `my_verification_progress()` with `human_verified` and retains its existing owner-only fields.
- Protects `start_school_verification`, `record_id_upload`, `confirm_school_email_code`, and the ID-storage insert policy. Existing role, school-domain, request-ownership and human administrator review rules are retained.
- Renames the existing PostGIS `set_location` / `nearby_users` implementations to private helpers, revokes client execution on those helpers and exposes human-gated wrappers under the original API names. It preserves existing geographic calculations rather than rewriting them. `stop_sharing()` remains callable without a human marker.

**Impact:** existing email-only marker rows do not grandfather users through CAPTCHA. Coordinate rollout; users need the new screen and a working configured provider to regain protected access. The migration retains academic approvals and does not award or revoke school badges by itself. Compare any deployment-specific customizations of the replaced RPCs before applying it.

## Deployment procedure — not performed by this task

First test the complete deployment in a staging Supabase project/site. A code merge alone does not apply SQL, deploy Edge Functions or install credentials.

1. Register a production widget with the chosen provider. For Turnstile use a managed widget with hostname `braincraze.study`. Use genuine production keys; vendor test keys are not live human-verification evidence.
2. In **Supabase → Edge Functions → Secrets**, configure the following. Never put the secret/service-role key in chat, a Git commit, `EXPO_PUBLIC_` variables or the client `.env`:

| Name | Value |
| --- | --- |
| `HUMAN_CAPTCHA_PROVIDER` | `turnstile`, `hcaptcha` or `recaptcha` |
| `HUMAN_CAPTCHA_SITE_KEY` | Chosen widget's public site key |
| `HUMAN_CAPTCHA_SECRET` | Matching private provider secret |
| `HUMAN_CAPTCHA_HOSTNAMES` | `braincraze.study` (comma-separated exact hostnames, no scheme/path/wildcards) |
| `HUMAN_CAPTCHA_ORIGINS` | `https://braincraze.study` (comma-separated exact browser origins, no trailing slash) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are supplied by the Supabase runtime. Do not expose the service-role key in the app.

3. Deploy `supabase/functions/human-verification` to the intended project using authenticated Supabase tooling. The function always performs its own `getUser()` check. Verify the project's gateway JWT configuration supports the deployed project's tokens; never remove the handler's authentication checks as a workaround.
4. Apply the reviewed `005_human_verification.sql` after 001–004. It intentionally blocks protected operations until valid human proof is saved.
5. Build/deploy the updated Expo web app using the real project's existing public Supabase configuration. Coordinate steps 4–5 to avoid stranding users behind the new gate with an old UI.
6. Check CSP/content blockers permit the selected provider's scripts, frames and verification traffic. The function's outbound provider endpoint must be reachable. A missing key, failed script, failed provider or missing migration is a blocker, never a reason to insert a trust record manually.
7. With a real test account: confirm email → open Human verification → solve widget → submit → refresh/reopen → verify saved status → submit ID → confirm pending human school review. An ordinary user must still be denied administrator operations.

If the production host is not exactly `braincraze.study`, explicitly configure its real hostname/origin in both provider and server settings. Do not add wildcard production allowlists.

## Validation and precise limits

Local checks use controlled fixtures, not real provider credentials, user approvals or ID documents:

- Jest: 135 passing tests across 17 suites, including existing regression tests and new provider/handler/UI failure cases.
- SQL fixture: migration reapplication, removal of email auto-approval, rejection of legacy/badge bypasses, RPC/storage/location gates, Stop sharing access, private helper denial, account/session isolation, expiry, replay denial, mid-request session revocation, service-only completion, saved progress and start rate limits.
- Expo TypeScript and lint: passed; five pre-existing warnings in older landing/location tests.
- Deno check: passed for the real Edge Function entry point and imported shared modules.
- Expo web export: passed.

Commands:

```sh
npm test -- --runInBand
./node_modules/.bin/tsc --noEmit
EXPO_NO_TELEMETRY=1 npm run lint
EXPO_NO_TELEMETRY=1 npm run export:web
deno check supabase/functions/human-verification/index.ts
```

Disposable SQL harness (PGlite installed outside the app; no app dependency/lock changes):

```sh
npm install --prefix /tmp/braincraze-sql-test --cache /tmp/braincraze-npm-cache --no-save --no-package-lock @electric-sql/pglite@0.5.10
node scripts/test-human-verification.mjs /tmp/braincraze-sql-test/node_modules/@electric-sql/pglite/dist/index.js
```

The SQL harness uses minimal auth/storage/location fixtures. It does **not** certify hosted Supabase configuration, physical location calculations or live RLS/storage acceptance. The Deno check validates types/module resolution, not a deployed function request. Network access to official Expo/provider documentation was blocked in this environment; installed SDK types and existing project patterns were checked locally.

## Integration status / remaining work

| Item | Status |
| --- | --- |
| Challenge, persistence, authorization and replay logic | ✅ Implemented and locally verified with isolated tests |
| Turnstile / hCaptcha / reCAPTCHA v2 live integration | ⚠ Implemented, waiting for secure credentials/configuration and genuine live acceptance tests |
| Production migration, Edge Function and web rollout | ⚠ Not deployed by this task |
| Native in-app CAPTCHA | ❌ Not implemented; native users must log in to the same account on the web, complete the check there, then refresh their status. No token-in-URL or WebView bridge is supplied. |
| Automated selfie liveness / document authenticity | ❌ Not implemented by this work; unrelated to CAPTCHA |
| Full multilingual new copy | ⚠ New UI copy is English; platform-wide Expo internationalization remains separate work |

Operators should schedule retention cleanup after defining an appropriate audit period: tokens older than one day can be removed, and expired/unreferenced challenge rows can be removed after the retention period. Never delete a challenge referenced by `account_trust`; it is the persisted proof used by authorization. No cleanup scheduler has been provisioned here.

Do not mark a provider “Implemented and Verified” for production until the live checklist above actually passes. Report each observed outcome; do not equate fixture success, email ownership, school approval or a screenshot of a solved widget with a server-verified human proof.
