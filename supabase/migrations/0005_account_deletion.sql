-- ============================================================
-- Saxetshow — self-service account deletion
-- ------------------------------------------------------------
-- App Store review (guideline 5.1.1(v)) requires that an app with
-- account creation also offer in-app account deletion, not just a
-- "contact us" workaround. This is that.
--
-- A signed-in user can't delete their own auth.users row directly -
-- it's Supabase's internal auth schema, not exposed through a normal
-- table policy, and RLS on `users`/`vendors` only ever allows editing
-- your own row, never removing your own login entirely. A SECURITY
-- DEFINER function is the sanctioned way to do this safely: it runs
-- with the function owner's privileges (which can reach auth.users),
-- but the body takes no caller-supplied parameters at all - it only
-- ever acts on auth.uid(), so there's no way to target anyone else's
-- account through it.
--
-- Deleting the auth.users row cascades to delete the linked `users`
-- profile row automatically (auth_user_id ... on delete cascade, from
-- migration 0003). Any vendor profile stays in place - so approved
-- table history, payments, and agreements aren't silently erased out
-- from under an event's records - but is unlinked and scrubbed of
-- personal fields.
-- ============================================================

create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  my_user_id bigint;
begin
  select id into my_user_id from users where auth_user_id = auth.uid();

  if my_user_id is not null then
    update vendors
    set business_name = 'Deleted Vendor',
        contact_name = null,
        phone = null,
        email = null,
        website = null,
        address = null,
        products_they_bring = null,
        booth_notes = null,
        ffl_license_number = null,
        ffl_expiration_date = null,
        staff_notes = null,
        staff_tags = '{}',
        user_id = null
    where user_id = my_user_id;
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function delete_my_account() to authenticated;
