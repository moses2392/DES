-- ============================================================================
-- DES — lettings schema.
--
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once: every statement is guarded.
-- ============================================================================

-- ------------------------------------------------------------------ listings
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  -- Monthly rent in pence. Money is never stored as a float.
  rent_pcm integer not null check (rent_pcm > 0),
  -- 0 means a studio, which is a real answer rather than missing data.
  bedrooms smallint not null check (bedrooms >= 0),
  bathrooms smallint not null default 1 check (bathrooms >= 0),
  property_type text not null check (property_type in ('flat','house','studio','room')),
  furnishing text not null check (furnishing in ('furnished','part-furnished','unfurnished')),
  area text not null,
  postcode text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  available_from date not null,
  images text[] not null default '{}',
  features text[] not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Map queries filter on a bounding box before anything else, so both
-- coordinates want an index.
create index if not exists idx_listings_location on public.listings (latitude, longitude);
create index if not exists idx_listings_rent on public.listings (rent_pcm);
create index if not exists idx_listings_published on public.listings (published, available_from);

-- ----------------------------------------------------------------- enquiries
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  email text not null check (position('@' in email) > 1 and length(email) <= 254),
  phone text check (length(phone) <= 40),
  message text not null check (length(message) between 1 and 2000),
  -- Optional viewing preference; the enquiry stands on its own without one.
  preferred_viewing date,
  status text not null default 'new' check (status in ('new','contacted','closed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_enquiries_listing on public.enquiries (listing_id, created_at desc);

-- ============================================================================
-- Row level security.
--
-- Listings are public read-only. Enquiries are the interesting case: anyone may
-- INSERT one, and nobody may SELECT one. That means the site needs only the
-- publishable key to work — there is no secret key in the application at all —
-- and a visitor still cannot read anybody else's name, email or message.
--
-- Writes to listings, and any reading of enquiries, go through the Supabase
-- dashboard or a future authenticated staff area.
-- ============================================================================

alter table public.listings enable row level security;
alter table public.enquiries enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'listings_public_read') then
    create policy "listings_public_read" on public.listings
      for select to anon, authenticated using (published = true);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'enquiries_public_insert') then
    create policy "enquiries_public_insert" on public.enquiries
      for insert to anon, authenticated with check (true);
  end if;
end $$;
-- enquiries deliberately has no SELECT policy. See the note above.
