import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { provisionUserProfile } from '@/lib/auth/provision';

export async function POST(request: Request) {
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
