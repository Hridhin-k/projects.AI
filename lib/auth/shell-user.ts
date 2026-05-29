import type { UserRole } from '@/lib/db/schema';

/** Serializable user slice passed from server layouts to client shell UI */
export type ShellUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export function toShellUser(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}): ShellUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
