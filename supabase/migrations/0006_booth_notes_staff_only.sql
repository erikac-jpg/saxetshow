-- ============================================================
-- Booth notes are now staff-only, same as staff_notes/insurance/etc.
-- ------------------------------------------------------------
-- The vendor profile screen moved "Booth Notes" into its staff-only
-- section, so a vendor no longer sees or edits it. This extends the
-- write-guard trigger from 0004_rls.sql to match, so a vendor can't
-- set booth_notes directly via the anon/authenticated key either -
-- same reasoning as the original trigger: row policies only guard
-- which rows someone can touch, not which columns.
-- ============================================================

create or replace function protect_staff_only_vendor_fields()
returns trigger as $$
begin
  if is_staff() then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.staff_notes := old.staff_notes;
    new.booth_notes := old.booth_notes;
    new.insurance_on_file := old.insurance_on_file;
    new.insurance_expiration_date := old.insurance_expiration_date;
    new.staff_tags := old.staff_tags;
    new.fees_owed := old.fees_owed;
  else
    new.staff_notes := null;
    new.booth_notes := null;
    new.insurance_on_file := false;
    new.insurance_expiration_date := null;
    new.staff_tags := '{}';
    new.fees_owed := 0;
  end if;

  return new;
end;
$$ language plpgsql;
