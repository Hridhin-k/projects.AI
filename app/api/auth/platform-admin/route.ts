import { NextRequest, NextResponse } from 'next/server';
import { isSuperAdminEmail } from '@/lib/auth/platform';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ isPlatformAdmin: false });
  }

  return NextResponse.json({ isPlatformAdmin: isSuperAdminEmail(email) });
}
