-- ============================================================
-- Saxetshow — turn on Row Level Security
-- ------------------------------------------------------------
-- This is the real security boundary the earlier migrations
-- deferred: until now, the anon key could read/write every row in
-- every table directly, regardless of what the app's screens did or
-- didn't show. From here on, access is enforced by Postgres itself.
--
-- Roles used below, all derived from `users.role` via the signed-in
-- Supabase Auth account (auth.uid()):
--   - staff:  full access everywhere.
--   - vendor: only their own vendor record, table requests,
--             agreements and waitlist entries (matched through
--             vendors.user_id -> users.auth_user_id = auth.uid()).
--   - anon / signed-in member: can browse visible events; nothing
--     that isn't explicitly opened up below.
--
-- Two helper functions avoid repeating the "is this caller staff" /
-- "what's their vendor" subqueries in every policy. Both are STABLE
-- (safe to call multiple times per statement) and rely on the
-- `users_select_own` policy below to see the caller's own row - no
-- SECURITY DEFINER needed, since a user always has permission to
-- read exactly the row auth.uid() matches.
--
-- Note for testing in the SQL Editor: queries run there use the
-- Postgres owner role and bypass RLS entirely, same as any other
-- admin tool. RLS only applies to the anon/authenticated roles the
-- app's Supabase client uses.
-- ============================================================

create or replace function is_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from users where auth_user_id = auth.uid() and role = 'staff'
  );
$$;

create or replace function my_vendor_ids()
returns setof bigint
language sql
stable
as $$
  select v.id from vendors v
  join users u on u.id = v.user_id
  where u.auth_user_id = auth.uid();
$$;

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
alter table users enable row level security;

create policy "users_select_own" on users
  for select
  using (auth_user_id = auth.uid());

-- `role = 'member'` on top of ownership closes the same hole as the
-- update trigger below, just at signup time: without it, a signup
-- request crafted directly against the anon key (bypassing the app's
-- own client code, which always inserts 'member') could hand itself
-- staff access immediately, with no promotion step at all.
create policy "users_insert_own" on users
  for insert
  with check (auth_user_id = auth.uid() and role = 'member');

create policy "users_update_own" on users
  for update
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- The policy above only checks ownership, not which columns changed -
-- without this trigger, any signed-in member could set their own
-- `role` straight to 'staff' through the anon key. `auth.uid() is not
-- null` is the guard that keeps this from also firing on the SQL
-- editor's own manual promotions: a dashboard query runs with no JWT
-- (auth.uid() is null there), same as any other admin tool bypassing
-- RLS, so it's intentionally left alone.
create or replace function protect_own_role_change()
returns trigger as $$
begin
  if auth.uid() is not null and not is_staff() and new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger users_protect_role
  before update on users
  for each row execute function protect_own_role_change();

-- ------------------------------------------------------------
-- vendors
-- ------------------------------------------------------------
alter table vendors enable row level security;

-- The third branch on select/update (an unclaimed row - user_id is
-- null - whose email matches the caller's) exists for one reason:
-- signing in auto-claims a pre-existing vendor profile with a
-- matching email (see getUnclaimedVendorByEmail / AuthContext), which
-- needs to find and then update that row before it has any user_id
-- to match on.
create policy "vendors_select" on vendors
  for select
  using (
    is_staff()
    or user_id in (select id from users where auth_user_id = auth.uid())
    or (user_id is null and email = (select email from users where auth_user_id = auth.uid()))
  );

create policy "vendors_insert" on vendors
  for insert
  with check (
    is_staff()
    or user_id in (select id from users where auth_user_id = auth.uid())
  );

create policy "vendors_update" on vendors
  for update
  using (
    is_staff()
    or user_id in (select id from users where auth_user_id = auth.uid())
    or (user_id is null and email = (select email from users where auth_user_id = auth.uid()))
  )
  with check (
    is_staff()
    or user_id in (select id from users where auth_user_id = auth.uid())
  );

-- Row policies above only guard *which vendor rows* someone can touch,
-- not *which columns*. staff_notes / insurance_* / staff_tags / fees_owed
-- are staff-only by design (the vendor tracking feature was explicit
-- about this split) - a vendor could otherwise set these directly via
-- the anon key even though the app's own UI never shows them the
-- controls. This trigger silently keeps those columns unchanged
-- (update) or at their defaults (insert) unless the caller is staff.
create or replace function protect_staff_only_vendor_fields()
returns trigger as $$
begin
  if is_staff() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.staff_notes := old.staff_notes;
    new.insurance_on_file := old.insurance_on_file;
    new.insurance_expiration_date := old.insurance_expiration_date;
    new.staff_tags := old.staff_tags;
    new.fees_owed := old.fees_owed;
  else
    new.staff_notes := null;
    new.insurance_on_file := false;
    new.insurance_expiration_date := null;
    new.staff_tags := '{}';
    new.fees_owed := 0;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger vendors_protect_staff_fields
  before insert or update on vendors
  for each row execute function protect_staff_only_vendor_fields();

-- ------------------------------------------------------------
-- events - browsable by anyone, including signed-out members;
-- hidden (visible = false) events are staff-only.
-- ------------------------------------------------------------
alter table events enable row level security;

create policy "events_select_public" on events
  for select
  using (visible = true);

create policy "events_select_staff" on events
  for select
  using (is_staff());

create policy "events_insert_staff" on events
  for insert
  with check (is_staff());

create policy "events_update_staff" on events
  for update
  using (is_staff())
  with check (is_staff());

-- ------------------------------------------------------------
-- table_requests
-- ------------------------------------------------------------
alter table table_requests enable row level security;

create policy "table_requests_select" on table_requests
  for select
  using (is_staff() or vendor_id in (select my_vendor_ids()));

-- A vendor can request tables for themselves, but only in the
-- pending/unpaid/not-checked-in state that a brand new request should
-- start in - approving, marking paid, and checking in are staff-only
-- actions further down.
create policy "table_requests_insert_own" on table_requests
  for insert
  with check (
    vendor_id in (select my_vendor_ids())
    and status = 'pending'
    and payment_status = 'unpaid'
    and payment_method is null
    and check_number is null
    and checked_in_at is null
  );

create policy "table_requests_insert_staff" on table_requests
  for insert
  with check (is_staff());

create policy "table_requests_update_staff" on table_requests
  for update
  using (is_staff())
  with check (is_staff());

create policy "table_requests_delete_staff" on table_requests
  for delete
  using (is_staff());

-- ------------------------------------------------------------
-- tables - per-table floor assignment isn't wired into any screen
-- yet, so this stays staff-only across the board for now.
-- ------------------------------------------------------------
alter table tables enable row level security;

create policy "tables_all_staff" on tables
  for all
  using (is_staff())
  with check (is_staff());

-- ------------------------------------------------------------
-- agreements
-- ------------------------------------------------------------
alter table agreements enable row level security;

create policy "agreements_select" on agreements
  for select
  using (is_staff() or vendor_id in (select my_vendor_ids()));

create policy "agreements_insert" on agreements
  for insert
  with check (is_staff() or vendor_id in (select my_vendor_ids()));

create policy "agreements_update" on agreements
  for update
  using (is_staff() or vendor_id in (select my_vendor_ids()))
  with check (is_staff() or vendor_id in (select my_vendor_ids()));

-- ------------------------------------------------------------
-- waitlist - position ordering across vendors is an admin operation,
-- so unlike table_requests this stays staff-managed on writes; a
-- vendor can still see their own place in line.
-- ------------------------------------------------------------
alter table waitlist enable row level security;

create policy "waitlist_select" on waitlist
  for select
  using (is_staff() or vendor_id in (select my_vendor_ids()));

create policy "waitlist_insert_staff" on waitlist
  for insert
  with check (is_staff());

create policy "waitlist_update_staff" on waitlist
  for update
  using (is_staff())
  with check (is_staff());

create policy "waitlist_delete_staff" on waitlist
  for delete
  using (is_staff());
