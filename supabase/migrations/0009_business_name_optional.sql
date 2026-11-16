-- ============================================================
-- Saxetshow — business name becomes optional
-- ------------------------------------------------------------
-- The client's real paper "Application for Exhibit Space" form
-- requires the vendor's own name but only asks for a business name
-- optionally - the app had this backwards (business name required,
-- contact name optional). Dropping the not-null constraint here;
-- contact name/phone/email/address become required at the app layer
-- instead (they were already nullable here, so no migration needed
-- for those - this is purely an application-level validation change).
-- ============================================================

alter table vendors
  alter column business_name drop not null;
