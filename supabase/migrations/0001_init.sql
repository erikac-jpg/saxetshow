-- ============================================================
-- Saxetshow — initial Postgres schema for Supabase
-- ------------------------------------------------------------
-- Direct translation of src/db/schema.ts (the local SQLite schema),
-- same 7 tables and relationships, adapted to Postgres conventions:
--   - bigint identity primary keys (kept numeric, not uuid, so the
--     existing client-side TypeScript types - id: number - don't
--     have to change when the repositories move off SQLite).
--   - real `boolean` columns instead of SQLite's 0/1-integer trick
--     (`visible`, `paid`).
--   - `timestamptz` columns, defaulted/maintained by Postgres
--     instead of the client stamping `created_at`/`updated_at`
--     itself via nowIso().
--
-- Row Level Security is intentionally NOT enabled yet. There is no
-- auth in the app yet (see the backend migration plan), and RLS
-- with no policies blocks all access outright. Enable it, with real
-- policies per role (member/vendor/staff), as part of the auth step
-- - not before, or the app breaks the moment this migration runs.
--
-- Run this in the Supabase SQL Editor (or `supabase db push` if
-- using the CLI) against a brand-new project.
-- ============================================================

-- Shared trigger: keeps `updated_at` current on every UPDATE, so
-- callers never need to set it themselves.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table users (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('member', 'vendor', 'staff')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();

create table vendors (
  id bigint generated always as identity primary key,
  user_id bigint references users(id) on delete set null,
  business_name text not null,
  contact_name text,
  phone text,
  email text,
  website text,
  address text,
  products_they_bring text,
  booth_notes text,
  fees_owed numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_vendors_user_id on vendors(user_id);

create trigger vendors_set_updated_at
  before update on vendors
  for each row execute function set_updated_at();

create table events (
  id bigint generated always as identity primary key,
  name text not null,
  date date not null,
  location text,
  description text,
  image text,
  visible boolean not null default true,
  total_tables integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger events_set_updated_at
  before update on events
  for each row execute function set_updated_at();

create table table_requests (
  id bigint generated always as identity primary key,
  vendor_id bigint not null references vendors(id) on delete cascade,
  event_id bigint not null references events(id) on delete cascade,
  tables_wanted integer not null,
  status text not null check (status in ('pending', 'approved', 'denied')) default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_table_requests_event_id on table_requests(event_id);
create index idx_table_requests_vendor_id on table_requests(vendor_id);

create trigger table_requests_set_updated_at
  before update on table_requests
  for each row execute function set_updated_at();

create table tables (
  id bigint generated always as identity primary key,
  event_id bigint not null references events(id) on delete cascade,
  table_number integer not null,
  vendor_id bigint references vendors(id) on delete set null,
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, table_number)
);

create index idx_tables_event_id on tables(event_id);
create index idx_tables_vendor_id on tables(vendor_id);

create trigger tables_set_updated_at
  before update on tables
  for each row execute function set_updated_at();

create table agreements (
  id bigint generated always as identity primary key,
  vendor_id bigint not null references vendors(id) on delete cascade,
  event_id bigint not null references events(id) on delete cascade,
  status text not null check (status in ('not_sent', 'sent', 'signed')) default 'not_sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_id, event_id)
);

create index idx_agreements_event_id on agreements(event_id);

create trigger agreements_set_updated_at
  before update on agreements
  for each row execute function set_updated_at();

create table waitlist (
  id bigint generated always as identity primary key,
  vendor_id bigint not null references vendors(id) on delete cascade,
  event_id bigint not null references events(id) on delete cascade,
  tables_wanted integer not null,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, position)
);

create index idx_waitlist_event_id on waitlist(event_id);

create trigger waitlist_set_updated_at
  before update on waitlist
  for each row execute function set_updated_at();
