-- ============================================================
-- Saxetshow — demo events seed
-- ------------------------------------------------------------
-- Same 5 sample shows as src/db/seed.ts (the local SQLite seed), so
-- the home screen has something to show once it's reading from
-- Supabase instead of local storage. Safe to re-run - only inserts
-- if the events table is currently empty.
-- ============================================================

insert into events (name, date, location, description, total_tables)
select * from (values
  ('McAllen Gun Show', date '2026-09-19', 'McAllen Convention Center, McAllen, TX', 'Sep 19 & 20, 2026', 40),
  ('Corpus Christi Gun Show', date '2026-10-17', 'Richard M. Borchard Fairgrounds, Corpus Christi, TX', 'Oct 17 & 18, 2026', 60),
  ('McAllen Gun Show', date '2026-10-24', 'McAllen Convention Center, McAllen, TX', 'Oct 24 & 25, 2026', 40),
  ('Corpus Christi Gun Show', date '2026-11-21', 'Richard M. Borchard Fairgrounds, Corpus Christi, TX', 'Nov 21 & 22, 2026', 60),
  ('Corpus Christi Gun Show', date '2026-12-12', 'Richard M. Borchard Fairgrounds, Corpus Christi, TX', 'Dec 12 & 13, 2026', 60)
) as sample_events(name, date, location, description, total_tables)
where not exists (select 1 from events limit 1);
