import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import ProfilePageClient from '@/components/profile/ProfilePageClient';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/sign-in');
  }
  
  return <ProfilePageClient user={user} />;
}

