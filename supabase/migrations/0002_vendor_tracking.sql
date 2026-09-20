-- ============================================================
-- Saxetshow — vendor tracking fields
-- ------------------------------------------------------------
-- Adds fields for FFL licensing, vendor categorization, insurance
-- tracking, staff tags/notes, and per-event payment/check-in.
--
-- Split by who edits what:
--   - vendors: FFL number/expiration, category, and preferred table
--     location are vendor-editable (facts about themselves).
--   - vendors: staff_notes, insurance, and staff_tags are staff-only -
--     a vendor should never see these about themselves (especially
--     "do not rebook").
--   - table_requests: payment status/method/check number and
--     check-in time are staff-only, per event (a vendor's payment
--     status for one show says nothing about another).
--
-- No RLS changes here - still deferred to the auth step, same as
-- 0001_init.sql.
-- ============================================================

alter table vendors
  add column ffl_license_number text,
  add column ffl_expiration_date date,
  add column vendor_category text,
  add column preferred_table_location text,
  add column staff_notes text,
  add column insurance_on_file boolean not null default false,
  add column insurance_expiration_date date,
  add column staff_tags text[] not null default '{}';

alter table table_requests
  add column payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'partial', 'paid')),
  add column payment_method text,
  add column check_number text,
  add column checked_in_at timestamptz;
