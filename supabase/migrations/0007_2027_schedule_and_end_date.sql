-- ============================================================
-- Add an explicit end date for multi-day shows, and seed the 2027
-- Saxet Gun Show schedule for both venues.
-- ------------------------------------------------------------
-- `date` has always meant "the show's first day" (see seed.sql), so
-- the homepage's upcoming-events filter was comparing today against
-- a show's *start* day only - a two-day show dropped off the list on
-- its own second day, while it was still running. end_date fixes
-- that: getUpcomingEvents now keeps a show listed (and reachable from
-- the vendor "Request Tables" flow, which only lists upcoming shows)
-- until its actual last day has passed.
-- ============================================================

alter table events add column end_date date;

-- Every show on the books so far runs exactly two days.
update events set end_date = date + 1 where end_date is null;

alter table events alter column end_date set not null;

insert into events (name, date, end_date, location, description, total_tables)
select v.name, v.date, v.end_date, v.location, v.description, v.total_tables
from (values
  ('McAllen Gun Show', date '2027-01-23', date '2027-01-24', 'McAllen Convention Center, McAllen, TX', 'Jan 23 & 24, 2027', 40),
  ('Corpus Christi Gun Show', date '2027-01-30', date '2027-01-31', 'Richard M. Borchard Fairgrounds, Corpus Christi, TX', 'Jan 30 & 31, 2027', 60),
  ('Corpus Christi Gun Show', date '2027-02-20', date '2027-02-21', 'Richard M. Borchard Fairgrounds, Corpus Christi, TX', 'Feb 20 & 21, 2027', 60),
  ('McAllen Gun Show', date '2027-02-27', date '2027-02-28', 'McAllen Convention Center, McAllen, TX', 'Feb 27 & 28, 2027', 40),
  ('Corpus Christi Gun Show', date '2027-03-13', date '2027-03-14', 'Richard M. Borchard Fairgrounds, Corpus Christi, TX', 'Mar 13 & 14, 2027', 60),
  ('McAllen Gun Show', date '2027-04-03', date '2027-04-04', 'McAllen Convention Center, McAllen, TX', 'Apr 3 & 4, 2027', 40),
  ('Corpus Christi Gun Show', date '2027-04-17', date '2027-04-18', 'Richard M. Borchard Fairgrounds, Corpus Christi, TX', 'Apr 17 & 18, 2027', 60),
  ('Corpus Christi Gun Show', date '2027-08-14', date '2027-08-15', 'Richard M. Borchard Fairgrounds, Corpus Christi, TX', 'Aug 14 & 15, 2027', 60),
  ('McAllen Gun Show', date '2027-08-21', date '2027-08-22', 'McAllen Convention Center, McAllen, TX', 'Aug 21 & 22, 2027', 40),
  ('McAllen Gun Show', date '2027-09-18', date '2027-09-19', 'McAllen Convention Center, McAllen, TX', 'Sep 18 & 19, 2027', 40),
  ('Corpus Christi Gun Show', date '2027-10-16', date '2027-10-17', 'Richard M. Borchard Fairgrounds, Corpus Christi, TX', 'Oct 16 & 17, 2027', 60),
  ('McAllen Gun Show', date '2027-10-23', date '2027-10-24', 'McAllen Convention Center, McAllen, TX', 'Oct 23 & 24, 2027', 40),
  ('McAllen Gun Show', date '2027-11-13', date '2027-11-14', 'McAllen Convention Center, McAllen, TX', 'Nov 13 & 14, 2027', 40),
  ('Corpus Christi Gun Show', date '2027-11-20', date '2027-11-21', 'Richard M. Borchard Fairgrounds, Corpus Christi, TX', 'Nov 20 & 21, 2027', 60),
  ('Corpus Christi Gun Show', date '2027-12-18', date '2027-12-19', 'Richard M. Borchard Fairgrounds, Corpus Christi, TX', 'Dec 18 & 19, 2027', 60)
) as v(name, date, end_date, location, description, total_tables)
where not exists (
  select 1 from events e where e.name = v.name and e.date = v.date
);
