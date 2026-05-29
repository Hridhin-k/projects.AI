import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { provisionUserProfile } from '@/lib/auth/provision';
import { invalidateUserProfile } from '@/lib/auth/profile-cache';

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/projects';
  }
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = safeNextPath(searchParams.get('next'));
  const authError = searchParams.get('error_description') ?? searchParams.get('error');

  if (authError) {
    return NextResponse.redirect(
      `${origin}/sign-in?error=auth&message=${encodeURIComponent(authError)}`
    );
  }

  if (!code && !tokenHash) {
    return NextResponse.redirect(`${origin}/sign-in?error=auth`);
  }

  const redirectUrl = new URL(next, origin);
  let response = NextResponse.redirect(redirectUrl);
  const supabase = createRouteHandlerClient(request, response);

  let sessionError: Error | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) sessionError = error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) sessionError = error;
  }

  if (sessionError) {
    console.error('Auth callback session error:', sessionError.message);
    const hint = sessionError.message.includes('code verifier')
      ? 'auth_verifier'
      : 'auth';
    return NextResponse.redirect(`${origin}/sign-in?error=${hint}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const name =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split('@')[0] ||
      'User';
    try {
      const orgName = (user.user_metadata?.organization_name as string | undefined)?.trim();
      const { user: profile } = await provisionUserProfile(user.id, user.email || '', name, {
        organizationName: orgName,
      });
      invalidateUserProfile(user.id);
      if (profile.role === 'SUPER_ADMIN') {
        return NextResponse.redirect(`${origin}/platform`);
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'INVITE_PENDING') {
        return NextResponse.redirect(`${origin}/sign-in?error=invite_pending`);
      }
      if (e instanceof Error && e.message === 'ORG_SUSPENDED') {
        return NextResponse.redirect(`${origin}/sign-in?error=org_suspended`);
      }
      console.error('Auth callback profile error:', e);
      return NextResponse.redirect(`${origin}/sign-in?error=setup`);
    }
  }

  return response;
}
