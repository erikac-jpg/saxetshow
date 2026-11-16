-- ============================================================
-- Saxetshow — structured item categories, replacing free-text
-- ------------------------------------------------------------
-- The client's real paper application lets a vendor check all the
-- merchandise categories that apply (a fixed list), not type a
-- free-text category. Replaces the single vendor_category text
-- column with a real array, same pattern as vendors.staff_tags.
-- ============================================================

alter table vendors
  add column item_categories text[] not null default '{}';

alter table vendors
  drop column vendor_category;
