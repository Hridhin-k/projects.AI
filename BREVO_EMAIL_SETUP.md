# Brevo Email Setup Guide

## Fixing the 400 Error

If you're seeing `Request failed with status code 400` errors when sending emails, it's likely because:

1. **Missing Sender Email** - Brevo requires a verified sender email address
2. **Unverified Sender** - The sender email must be verified in your Brevo account

## Quick Fix

### Step 1: Verify Your Sender Email in Brevo

1. Log in to [Brevo Dashboard](https://app.brevo.com)
2. Go to **Senders & IP** → **Senders**
3. Click **Add a sender**
4. Enter your email address (e.g., `noreply@yourdomain.com` or your personal email)
5. Verify the email by clicking the verification link sent to your inbox
6. Wait for approval (usually instant for personal emails, may take time for custom domains)

### Step 2: Update Your Environment Variables

Add these to your `.env.local` file:

```env
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=your_verified_email@yourdomain.com
BREVO_SENDER_NAME=Projects.AI
```

**Important:** 
- `BREVO_SENDER_EMAIL` must match the email you verified in Brevo
- If you don't have a custom domain, you can use your personal email (Gmail, Outlook, etc.)

### Step 3: Restart Your Development Server

```bash
# Stop your server (Ctrl+C)
npm run dev
```

## Common Issues

### Issue 1: "Invalid sender email"
**Solution:** Make sure the email in `BREVO_SENDER_EMAIL` is exactly the same as the one you verified in Brevo.

### Issue 2: "Sender not verified"
**Solution:** Check your Brevo dashboard → Senders & IP → Senders. The email should show as "Verified" or "Approved".

### Issue 3: "Domain not verified" (for custom domains)
**Solution:** 
- For custom domains, you need to add DNS records in Brevo
- Go to Senders & IP → Domains
- Follow the DNS setup instructions
- This can take 24-48 hours to verify

## Testing

After setting up, try creating an invite or assigning a task. You should see:

```
[Brevo] Invite email sent to user@example.com
```

Instead of the 400 error.

## Fallback Behavior

The app is configured to continue working even if emails fail. You'll see warnings in the console, but the app won't crash. This allows you to:

- Test the app without email setup
- Continue using the app if Brevo has temporary issues
- Debug email issues without breaking functionality

## Free Tier Limits

Brevo's free tier includes:
- 300 emails per day
- Unlimited contacts
- Basic email templates

This is usually sufficient for development and small teams.

## Need Help?

If you're still getting errors:

1. Check the console logs - they now show detailed error messages
2. Verify your API key is correct
3. Make sure the sender email is verified in Brevo
4. Check your Brevo account has sending credits (free tier: 300/day)

