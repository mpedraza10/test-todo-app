import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * Get authenticated user from Supabase session
 * Throws error if user is not authenticated
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient(await cookies());
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('No user found in session');
  }

  return user;
}

/**
 * Get user ID from authenticated session
 */
export async function getUserId(): Promise<string> {
  const user = await getAuthenticatedUser();
  return user.id;
}
