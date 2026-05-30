# Resend Email Setup

In-app emails (team invites, task assignments, progress updates, welcome messages) are sent via [Resend](https://resend.com).

**Note:** Supabase Auth emails (signup confirmation, password reset) are configured separately in the Supabase Dashboard → Authentication → SMTP. You can use the same Resend account for both.

## Setup

### 1. Create a Resend account and API key

1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys** → **Create API Key**
3. Copy the key (starts with `re_`)

### 2. Verify a sending domain (production)

For production, add and verify your domain under **Domains** in Resend (DNS records required).

For local development, Resend allows sending to your own verified email using `onboarding@resend.dev` as the default test sender.

### 3. Environment variables

Add to `.env.local` (and Vercel → Environment Variables):

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Projects.AI
```

- `RESEND_FROM_EMAIL` must use a verified domain in Resend (or `onboarding@resend.dev` for testing)
- `NEXT_PUBLIC_APP_URL` must be set so invite links and email buttons point to your deployed app

### 4. Restart the dev server

```bash
npm run dev
```

## Testing

Create an invite or assign a task. You should see in the server logs:

```
[Resend] invite email sent to user@example.com
```

## Fallback behavior

If `RESEND_API_KEY` is not set, emails are logged as mock messages and the app continues normally.

## Supabase Auth + Resend (optional)

To send signup confirmation emails through Resend, configure Supabase SMTP:

1. Supabase Dashboard → **Authentication** → **SMTP Settings**
2. Enable custom SMTP
3. Use Resend SMTP credentials from [Resend SMTP docs](https://resend.com/docs/send-with-supabase-smtp)

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for the full auth email template setup.
