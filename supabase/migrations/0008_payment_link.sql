-- ============================================================
-- Saxetshow — vendor payment link
-- ------------------------------------------------------------
-- Lets staff attach an external checkout URL (Stripe, TacticalPay,
-- or whichever processor ends up approving the client's account) to
-- an approved table request, so a vendor can pay for their table in
-- advance from their own request history instead of only in person
-- at the show. The link opens outside the app - this table still
-- holds no card data, same as before.
-- ============================================================

alter table table_requests
  add column payment_link text;
