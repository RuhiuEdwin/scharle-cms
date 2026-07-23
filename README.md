# Scharle Beauty College — CMS (Strapi)

Self-hosted Strapi 5, Postgres-backed, matching the content model in
`../design/content-model.md` (plus two additions — see "Deviations from
the model" below). Secrets are managed in Doppler, not `.env` — see
"Running locally" below.

## Running locally

Requires: Postgres running locally (this instance used the Homebrew
`postgresql@18` service on the default port, not Docker — a
`scharle-postgres` Docker container was also started during setup and
later removed once the local Postgres path was confirmed working; either
is fine going forward, just don't run both against the same DB name), and
the Doppler CLI authenticated to the `Ubunifu Space` workplace.

```bash
cd cms
doppler setup --project scharle --config dev   # one-time, links this directory
doppler run -- npm run develop
```

Admin panel: **http://localhost:1337/admin**

Never put real secrets in `cms/.env` — `.env.example` documents the
variable names for reference only. All real values live in Doppler
(`scharle` project, `dev`/`stg`/`prd` configs) and get injected at
runtime via `doppler run --`.

## Admin access

- **URL:** http://localhost:1337/admin (staging/production URL TBD once
  hosting is provisioned — Sprint 2/6 per PROJECT.md)
- **Login:** the account was created under `ruhiuedwin1@gmail.com` (Super
  Admin role). The initial password is stored in Doppler as
  `STRAPI_ADMIN_INITIAL_PASSWORD` (`scharle`/`dev` config) —
  **change it on first login**, then delete that Doppler secret; it's a
  bootstrap value, not meant to be the permanent password.
- **For the client:** once real hosting exists, create a second admin
  user (Editor role, not Super Admin) scoped to content editing only, so
  the school staff can update courses/gallery/copy without dev-level
  access to plugins, roles, or API tokens. Not done yet — flagging as a
  Sprint 6 handover task per PROJECT.md's "admin-panel guide" deliverable.

## API tokens

Two tokens exist (`scharle`/`dev` Doppler config), matching the
two-token pattern:

| Token | Type | Purpose |
|---|---|---|
| `STRAPI_FRONTEND_READONLY_TOKEN` | Read-only | The Next.js frontend's server-side fetches. Already wired into `web/.env.local` as `STRAPI_API_TOKEN` for local dev. |
| `STRAPI_BACKEND_FULLACCESS_TOKEN` | Full-access | Server-side automation only (seed scripts, future admin tooling) — **never** ship this to the browser. |

Both are visible only once at creation time; they're stored in Doppler
now, not recoverable from the Strapi UI if lost (you'd need to revoke and
regenerate).

## Public API access — verified

The `Public` role (`users-permissions` plugin) is configured so:

- **Read-only** (`find`/`findOne` only): `course`, `gallery-item`,
  `why-scharle-highlight`, `student-life-highlight`, and all 6 page
  single types (`home-page`, `about-page`, `courses-page`,
  `admissions-page`, `contact-page`, `gallery-page`), plus `site-setting`.
- **Create-only** (no `find`/`findOne`/`update`/`delete`):
  `booking-request`, `contact-submission` — the public can submit a form,
  not read anyone else's submissions.

Verified end-to-end, not just configured and assumed:
- `GET /api/courses` → `200`
- `GET /api/booking-requests` → `403`
- `POST /api/booking-requests` (valid data) → `201`, entry stored
- Confirmed the stored entry is readable via the full-access token but
  not the public role.

## Content types

Schema files live under `src/api/*/content-types/*/schema.json` and
`src/components/shared/*.json` — written directly as code
(`scripts/generate-schema.js`, a one-time scaffold script, kept for
reference/reproducibility) rather than clicked through the Content-Type
Builder UI. The Content-Type Builder is still the right place for the
client's team to make future schema changes.

**Collection Types:** `Course`, `GalleryItem`, `WhyScharleHighlight`,
`StudentLifeHighlight` (covers both plain highlights and testimonials,
per the content model's merged design), `BookingRequest`,
`ContactSubmission`.

**Single Types:** `HomePage`, `AboutPage`, `CoursesPage`,
`AdmissionsPage`, `ContactPage`, `GalleryPage`, `SiteSettings`.

**Components:** `shared.list-item`, `shared.rich-text-block`,
`shared.image-text-block`, `shared.step`, `shared.checklist-item`,
`shared.social-link`.

### Deviations from `design/content-model.md`

1. **`Course.careerOutcomes`** (repeatable `shared.list-item`, same shape
   as `whatYoullLearn`) — added because `content/COPY.md`'s brief
   explicitly asked for course "outcomes," and the original model only
   had curriculum bullets, not destination roles.
2. **`SiteSettings` single type** — not in the original model. Added
   because phone/email/address/social links were otherwise going to stay
   hardcoded in the frontend, which works against PROJECT.md's own Epic:
   Content Management goal (admin edits content without a developer).
3. Every page single type got `seoTitle`/`seoDescription` fields —
   the original model didn't specify where per-page SEO metadata lives;
   without this, that copy would've had nowhere to go in Strapi.

## Seed data

`scripts/seed.mjs` populates every content type from `content/COPY.md`,
including uploading real images to Strapi's media library (10 real,
license-free Unsplash photos — the same ones already used in the
frontend's placeholder `content.ts`, re-uploaded here so the CMS↔frontend
integration can be tested with real media, not empty fields). Idempotent
on re-run for images (checks for an existing upload by filename before
re-uploading) and for single types (`PUT` overwrites); re-running does
create duplicate collection entries (courses, gallery items, etc.) since
those are `POST`-created — don't rerun against a database that already
has real content without adjusting the script first.

```bash
doppler run -- node scripts/seed.mjs
```

⚠️ Per `content/COPY.md`'s flagged gaps: phone/email/social links/exact
intake dates/testimonial names are all placeholder values seeded as-is —
they need real client input before this goes live, the same flags apply
here as they do in the copy doc.

## What's not done (flagging, not blocking)

- **No staging/production deployment** — this runs locally only. Real
  hosting is Sprint 2/6 infrastructure work (VPS, domain, SSL) that needs
  the client's hosting account/payment, which nobody currently has
  credentials for in this environment.
- **No email notification wiring** for `BookingRequest`/
  `ContactSubmission` — PROJECT.md's acceptance criteria wants an admin
  email within 1 minute of submission; that needs a transactional email
  provider (Resend or similar, per PROJECT.md's own Risk note) configured
  as a Strapi lifecycle hook. Schema supports it (the data's there to
  trigger off of); the hook itself isn't written yet.
- **Google Maps embed URL** is an empty string on `ContactPage` — no API
  key/embed URL supplied yet.
- **Client-facing Editor role** not yet created (see "Admin access" above).
