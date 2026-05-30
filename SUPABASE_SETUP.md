# Supabase Migration Guide

Projects.AI now uses **Supabase** for authentication and database. Next.js remains the frontend and server-actions layer.

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | Next.js App Router |
| Auth | Supabase Auth (email/password) |
| Database | Supabase Postgres |
| Server data access | Supabase service role in server actions (org-scoped) |
| Row Level Security | Enabled on all tables |

## Setup (when you have credentials)

### 1. Create a Supabase project

At [supabase.com/dashboard](https://supabase.com/dashboard), create a project and note:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (server only)

### 2. Configure `.env.local`

```bash
cp env.template .env.local
```

Fill in the three Supabase variables plus your existing `GEMINI_API_KEY` and Resend keys.

**This project** (`ycriacrqtyulesbjbxel`):

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ycriacrqtyulesbjbxel.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your `sb_publishable_...` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → **Project Settings → API** → `service_role` (required for server actions) |

### 2b. Link Supabase CLI (optional)

```bash
supabase login          # browser login — use the account that owns this project
supabase link --project-ref ycriacrqtyulesbjbxel
supabase db push        # applies supabase/migrations/*.sql
```

If `link` fails with “necessary privileges”, you’re logged into a different Supabase account than the project owner. Run `supabase logout` then `supabase login` again.

### 3. Run the database migration

In Supabase Dashboard → **SQL Editor**, run the contents of:

```
supabase/migrations/20260529120000_aura_pm_schema.sql
supabase/migrations/20260529140000_tasks_require_project.sql
```

The second migration makes `tasks.project_id` required (every task must belong to a project).

### 4. Auth settings (Supabase Dashboard)

Under **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (or your production URL)
- **Redirect URLs**: add `http://localhost:3000/auth/callback`

Under **Authentication → Providers**, enable **Email** (password sign-up).

**Email confirmation (important for sign-up):** If enabled (default), sign-up succeeds but there is no session until the user clicks the link in their email. The app shows a “Check your email” screen instead of redirecting. For faster local testing, disable it under **Authentication → Providers → Email → Confirm email**.

**Confirm signup email template** (Authentication → Email Templates → Confirm signup): replace `{{ .ConfirmationURL }}` with:

```
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/projects
```

This lets the server verify the link without needing the PKCE code verifier cookie (which breaks when the link is opened in a different browser).

### 5. Start the app

```bash
npm install
npm run dev
```

Sign up at `/sign-up` — your profile and organization are created automatically after you have a session (immediately if email confirmation is off, or after you confirm via email).

### Sign-up troubleshooting

| Symptom | Fix |
|---------|-----|
| **500** on `…/auth/v1/signup` with `Error sending confirmation email` | Supabase Auth mail failed — see [Fix confirmation email errors](#fix-confirmation-email-errors) below |
| Redirected to sign-in right after sign-up | Email confirmation is on — check your inbox and click the link, then sign in |
| “Failed to create organization” | Run the SQL migration in step 3 |
| `over_email_send_rate_limit` | Wait a few minutes or disable confirmation emails in Supabase for dev |
| Sign-up with `@example.com` | Supabase blocks disposable domains — use a real email |

#### Fix confirmation email errors

If the browser shows **500** from `supabase.co/auth/v1/signup` and the response body is:

```json
{ "code": "unexpected_failure", "message": "Error sending confirmation email" }
```

signup is blocked because **Supabase could not send the confirm-email**. This is configured in the Supabase Dashboard, not in this repo. App env vars (`RESEND_*`) do **not** send Auth signup emails — only **Supabase → SMTP** (Resend) does.

**Fastest fix (local dev):**

1. [Supabase Dashboard](https://supabase.com/dashboard/project/ycriacrqtyulesbjbxel/auth/providers) → **Authentication** → **Providers** → **Email**
2. Turn **off** “Confirm email”
3. Sign up again — you should get a session immediately (no email step)

**Production fix (Resend):** see [Configure Resend for Supabase Auth](#configure-resend-for-supabase-auth) below.

**Also check:** **Authentication** → **Logs** for the exact mail error; **Project Settings** → ensure the project is not paused and you are within email quotas.

#### Configure Resend for Supabase Auth

Signup, password reset, and magic-link emails are sent by **Supabase Auth**, not by this Next.js app. Your `RESEND_*` keys in `.env.local` only power **in-app** emails in `lib/email/resend.ts`. To fix `Error sending confirmation email`, wire Resend into Supabase:

1. **Resend** ([resend.com](https://resend.com))
   - Create an API key (`re_…`).
   - **Domains** → add your domain → add the DNS records Resend shows (SPF/DKIM). Wait until the domain shows **Verified**.
   - The **sender address** must use that domain (e.g. `noreply@yourdomain.com`), not `@gmail.com`.

2. **Supabase** → [Authentication → SMTP](https://supabase.com/dashboard/project/ycriacrqtyulesbjbxel/auth/smtp) (or **Project Settings → Auth → SMTP**)

   | Field | Value |
   |-------|--------|
   | Enable custom SMTP | On |
   | Host | `smtp.resend.com` |
   | Port | `465` (SSL) or `587` (STARTTLS) |
   | Username | `resend` |
   | Password | Your Resend API key (`re_…`) |
   | Sender email | `noreply@yourdomain.com` (verified in Resend) |
   | Sender name | `Projects.AI` |

3. **Save**, then send a test from the same SMTP screen if available.

4. **Rate limits:** **Authentication** → **Rate Limits** — default SMTP cap is low (~30/hour); raise if needed after SMTP works.

5. **Email template** (Confirm signup) — use the [token_hash callback URL](#4-auth-settings-supabase-dashboard) from step 4 above.

6. Try **Sign up** again at `/sign-up`. In Resend → **Emails**, you should see the confirmation message. In Supabase → **Authentication** → **Logs**, errors should be gone.

**Resend + Supabase integration (optional):** [Resend: Send with Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp) or connect via Resend’s Supabase integration in their dashboard.

**Still 500 after SMTP?** Almost always an unverified sender domain or wrong API key. Double-check sender email matches a verified domain in Resend.

## Auth model

- Users link to Supabase via `users.auth_user_id` → `auth.users.id`
- Sign-in/sign-up are custom pages using Supabase Auth
- Organizations are stored in Postgres (no third-party org provider)

## Invites

1. Admin sends invite email
2. Invitee signs up/signs in with the invited email
3. Opens `/invite/[token]` and accepts
