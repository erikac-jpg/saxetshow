-- ============================================================
-- Saxetshow — link `users` to Supabase Auth
-- ------------------------------------------------------------
-- Adds the column the app uses to find "which `users` row is this
-- signed-in person" after a real login (email/password via
-- supabase-js). Each Supabase Auth account (auth.users) gets exactly
-- one linked `users` profile row, created client-side right after
-- sign up.
--
-- Row Level Security is still intentionally NOT enabled by this
-- migration - that's the next step now that auth.uid() exists to
-- write real per-role policies against, not before.
-- ============================================================

alter table users
  add column auth_user_id uuid unique references auth.users(id) on delete cascade;

create index idx_users_auth_user_id on users(auth_user_id);
