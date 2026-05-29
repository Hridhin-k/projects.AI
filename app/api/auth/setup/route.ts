import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { provisionUserProfile } from '@/lib/auth/provision';

function getMissingServerEnv(): string[] {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  return missing;
}

export async function POST(request: Request) {
  const missingEnv = getMissingServerEnv();
  if (missingEnv.length > 0) {
    console.error('Auth setup misconfigured:', missingEnv);
    return NextResponse.json(
      {
        error: `Server misconfigured. Add ${missingEnv.join(', ')} in Vercel → Settings → Environment Variables, then redeploy.`,
      },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { organizationName?: string };

  const name =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split('@')[0] ||
    'User';
  const email = user.email || '';
  const organizationName =
    body.organizationName?.trim() ||
    (user.user_metadata?.organization_name as string | undefined)?.trim();

  try {
    const { user: profile, organization } = await provisionUserProfile(
      user.id,
      email,
      name,
      { organizationName }
    );
    return NextResponse.json({
      ok: true,
      userId: profile.id,
      organizationId: organization?.id ?? null,
      role: profile.role,
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'INVITE_PENDING') {
      return NextResponse.json(
        { error: 'Accept your team invite before continuing.' },
        { status: 403 }
      );
    }
    if (e instanceof Error && e.message === 'ORG_NAME_REQUIRED') {
      return NextResponse.json(
        { error: 'Organization name is required to create your workspace.' },
        { status: 400 }
      );
    }
    if (e instanceof Error && e.message === 'ORG_SUSPENDED') {
      return NextResponse.json(
        { error: 'Your organization has been suspended. Contact support.' },
        { status: 403 }
      );
    }
    const message = e instanceof Error ? e.message : 'Failed to set up account';
    console.error('Profile setup error:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
