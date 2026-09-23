import { supabase } from '../supabaseClient';
import type { User, UserRole } from '../types';

const USER_SELECT =
  'id, authUserId:auth_user_id, name, email, role, phone, createdAt:created_at, updatedAt:updated_at';

export async function getUserByAuthId(authUserId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select(USER_SELECT)
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as User) ?? null;
}

export interface CreateUserProfileInput {
  authUserId: string;
  name: string;
  email: string;
  role?: UserRole;
  phone?: string | null;
}

/** Creates the `users` profile row for a just-signed-up Supabase Auth account. */
export async function createUserProfile(input: CreateUserProfileInput): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      auth_user_id: input.authUserId,
      name: input.name,
      email: input.email,
      role: input.role ?? 'member',
      phone: input.phone ?? null,
    })
    .select(USER_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as User;
}

/**
 * Permanently deletes the signed-in account: the Supabase Auth login,
 * the linked `users` profile row (cascades automatically), and personal
 * fields on any linked vendor profile. See migration 0005 - this calls
 * a SECURITY DEFINER function since deleting an auth.users row needs
 * privileges the anon/authenticated role doesn't otherwise have.
 */
export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
}
