-- Kazkir v1 schema. See docs/design.md §14.
-- Access model: everything hangs off trip_members; rights depend on the member's role.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.trip_stage as enum ('idea', 'planning', 'booked', 'ongoing', 'done');
create type public.member_role as enum ('owner', 'editor', 'contributor', 'viewer');
create type public.item_type as enum ('flight', 'stay', 'tour', 'place', 'food', 'transport', 'note');
create type public.item_status as enum ('idea', 'planned', 'booked', 'done');
create type public.cost_basis as enum ('per_person', 'shared');
create type public.proposal_kind as enum ('add', 'move', 'remove', 'edit');
create type public.proposal_status as enum ('pending', 'accepted', 'rejected', 'outdated');
create type public.comment_target as enum ('item', 'reference', 'trip');
create type public.vote_target as enum ('item', 'reference', 'proposal');

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  locale text not null default 'en' check (locale in ('en', 'id')),
  home_currency text not null default 'IDR',
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trips and membership
-- ---------------------------------------------------------------------------
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(title) between 1 and 120),
  stage public.trip_stage not null default 'idea',
  start_date date,
  day_count int not null default 1 check (day_count between 1 and 90),
  cover_image text,
  default_currency text not null default 'IDR',
  idr_rate_override jsonb not null default '{}'::jsonb, -- { "JPY": 108.5 }
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trip_members (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null,
  notif_prefs jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);
create index trip_members_user_idx on public.trip_members (user_id);

-- Role helpers. SECURITY DEFINER so policies on trip_members don't recurse.
create function public.trip_role(p_trip uuid) returns public.member_role
language sql stable security definer set search_path = '' as $$
  select role from public.trip_members where trip_id = p_trip and user_id = auth.uid();
$$;

create function public.is_trip_member(p_trip uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.trip_members where trip_id = p_trip and user_id = auth.uid());
$$;

create function public.can_edit_trip(p_trip uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.trip_role(p_trip) in ('owner', 'editor'), false);
$$;

create function public.can_contribute(p_trip uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.trip_role(p_trip) in ('owner', 'editor', 'contributor'), false);
$$;

create function public.is_trip_owner(p_trip uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.trip_role(p_trip) = 'owner', false);
$$;

-- The creator becomes the owner member automatically.
create function public.handle_new_trip() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.trip_members (trip_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_trip_created
  after insert on public.trips
  for each row execute function public.handle_new_trip();

create table public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(18), 'base64'),
  role public.member_role not null default 'contributor' check (role <> 'owner'),
  expires_at timestamptz not null default now() + interval '7 days',
  max_uses int check (max_uses is null or max_uses > 0),
  use_count int not null default 0,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Join a trip from an invite link. Returns the trip id.
create function public.accept_invite(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_invite public.trip_invites;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  select * into v_invite from public.trip_invites where token = p_token for update;
  if not found or v_invite.expires_at < now()
     or (v_invite.max_uses is not null and v_invite.use_count >= v_invite.max_uses) then
    raise exception 'invite invalid or expired' using errcode = 'P0002';
  end if;

  -- Existing members keep their current role.
  insert into public.trip_members (trip_id, user_id, role)
  values (v_invite.trip_id, auth.uid(), v_invite.role)
  on conflict (trip_id, user_id) do nothing;

  if found then
    update public.trip_invites set use_count = use_count + 1 where id = v_invite.id;
  end if;

  return v_invite.trip_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Geography: cities, days, places
-- ---------------------------------------------------------------------------
create table public.trip_cities (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  country_code char(2) not null,
  timezone text not null, -- IANA, e.g. Asia/Almaty
  currency char(3) not null,
  maps_apps text[] not null default '{}',
  sort_key text not null default 'a0'
);
create index trip_cities_trip_idx on public.trip_cities (trip_id);

create table public.days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_index int not null check (day_index >= 1),
  city_id uuid references public.trip_cities (id) on delete set null,
  note text,
  unique (trip_id, day_index)
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  address text,
  country_code char(2),
  google_place_id text,
  source_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index places_trip_idx on public.places (trip_id);

-- ---------------------------------------------------------------------------
-- Itinerary
-- ---------------------------------------------------------------------------
create table public.items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  day_id uuid references public.days (id) on delete set null, -- null = wishlist / unscheduled
  sort_key text not null default 'a0', -- fractional index for drag-and-drop
  type public.item_type not null,
  title text not null check (char_length(title) between 1 and 200),
  status public.item_status not null default 'idea',
  start_time time,
  end_time time,
  timezone text,
  place_id uuid references public.places (id) on delete set null,
  cost_amount numeric(14, 2) check (cost_amount is null or cost_amount >= 0),
  cost_currency char(3),
  cost_basis public.cost_basis not null default 'per_person',
  notes text,
  details jsonb not null default '{}'::jsonb, -- type-specific fields (flight no., pickup, …)
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version int not null default 1
);
create index items_trip_day_idx on public.items (trip_id, day_id, sort_key);

create table public.tour_stops (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  sort_key text not null default 'a0',
  place_id uuid references public.places (id) on delete set null,
  time time,
  note text
);
create index tour_stops_item_idx on public.tour_stops (item_id, sort_key);

create table public.item_history (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.items (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  field text not null,
  old_value jsonb,
  new_value jsonb,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now()
);
create index item_history_item_idx on public.item_history (item_id, changed_at desc);

-- Bump version/updated_at and record every changed field (offline last-write-wins keeps the loser here).
create function public.track_item_changes() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  k text;
  old_j jsonb := to_jsonb(old);
  new_j jsonb := to_jsonb(new);
begin
  new.updated_at := now();
  new.version := old.version + 1;
  for k in select jsonb_object_keys(new_j) loop
    if k not in ('updated_at', 'version', 'created_at', 'created_by')
       and old_j -> k is distinct from new_j -> k then
      insert into public.item_history (item_id, trip_id, field, old_value, new_value, changed_by)
      values (new.id, new.trip_id, k, old_j -> k, new_j -> k, auth.uid());
    end if;
  end loop;
  return new;
end;
$$;

create trigger items_track_changes
  before update on public.items
  for each row execute function public.track_item_changes();

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trips_touch before update on public.trips
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- References, tips, attachments
-- ---------------------------------------------------------------------------
create table public.trip_references (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  url text not null,
  platform text not null default 'other', -- instagram | threads | tiktok | youtube | other
  caption text,
  note text,
  thumbnail_url text,
  tags text[] not null default '{}',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index trip_references_trip_idx on public.trip_references (trip_id, created_at desc);

create table public.reference_places (
  reference_id uuid not null references public.trip_references (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  primary key (reference_id, place_id)
);

create table public.tips (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  city_id uuid references public.trip_cities (id) on delete set null,
  day_id uuid references public.days (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  item_id uuid references public.items (id) on delete cascade,
  reference_id uuid references public.trip_references (id) on delete cascade,
  storage_path text not null, -- "<trip_id>/<uuid>.<ext>" in the trip-files bucket
  mime text not null,
  size_bytes int not null check (size_bytes > 0 and size_bytes <= 5 * 1024 * 1024),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Collaboration: proposals, votes, comments, reactions, notifications
-- ---------------------------------------------------------------------------
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  kind public.proposal_kind not null,
  item_id uuid references public.items (id) on delete set null,
  base_version int, -- item version the proposal was made against (stale detection)
  payload jsonb not null default '{}'::jsonb,
  status public.proposal_status not null default 'pending',
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index proposals_trip_status_idx on public.proposals (trip_id, status);

create table public.votes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  target_type public.vote_target not null,
  target_id uuid not null,
  value smallint not null default 1 check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index votes_target_idx on public.votes (target_type, target_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  target_type public.comment_target not null,
  target_id uuid, -- null when target_type = 'trip'
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  mentions uuid[] not null default '{}',
  photo_path text,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  check ((target_type = 'trip') = (target_id is null))
);
create index comments_target_idx on public.comments (trip_id, target_type, target_id, created_at);

create table public.reactions (
  comment_id uuid not null references public.comments (id) on delete cascade,
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null check (char_length(emoji) <= 16),
  primary key (comment_id, user_id, emoji)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  trip_id uuid references public.trips (id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.exchange_rates (
  rate_date date not null,
  currency char(3) not null,
  idr_per_unit numeric(18, 6) not null check (idr_per_unit > 0),
  primary key (rate_date, currency)
);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_invites enable row level security;
alter table public.trip_cities enable row level security;
alter table public.days enable row level security;
alter table public.places enable row level security;
alter table public.items enable row level security;
alter table public.tour_stops enable row level security;
alter table public.item_history enable row level security;
alter table public.trip_references enable row level security;
alter table public.reference_places enable row level security;
alter table public.tips enable row level security;
alter table public.attachments enable row level security;
alter table public.proposals enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.exchange_rates enable row level security;

-- Profiles: yourself, plus people you share a trip with.
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid() or exists (
    select 1 from public.trip_members me
    join public.trip_members them on them.trip_id = me.trip_id
    where me.user_id = auth.uid() and them.user_id = profiles.id
  )
);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Trips
-- owner_id check: INSERT … RETURNING evaluates this before the AFTER trigger adds the owner member.
create policy trips_select on public.trips for select to authenticated
  using (owner_id = auth.uid() or public.is_trip_member(id));
create policy trips_insert on public.trips for insert to authenticated with check (owner_id = auth.uid());
create policy trips_update on public.trips for update to authenticated
  using (public.can_edit_trip(id)) with check (public.can_edit_trip(id));
create policy trips_delete on public.trips for delete to authenticated using (public.is_trip_owner(id));

-- Members: everyone sees the list; only the owner manages roles; anyone can leave (except the owner).
create policy members_select on public.trip_members for select to authenticated using (public.is_trip_member(trip_id));
create policy members_update on public.trip_members for update to authenticated
  using (public.is_trip_owner(trip_id) and user_id <> auth.uid())
  with check (public.is_trip_owner(trip_id) and role <> 'owner');
create policy members_delete on public.trip_members for delete to authenticated using (
  role <> 'owner' and (public.is_trip_owner(trip_id) or user_id = auth.uid())
);
-- Inserts happen only via handle_new_trip() and accept_invite().

-- Invites: owner only.
create policy invites_all on public.trip_invites for all to authenticated
  using (public.is_trip_owner(trip_id))
  with check (public.is_trip_owner(trip_id) and created_by = auth.uid());

-- Plan structure: members read, owner/editor write.
create policy cities_select on public.trip_cities for select to authenticated using (public.is_trip_member(trip_id));
create policy cities_write on public.trip_cities for all to authenticated
  using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));

create policy days_select on public.days for select to authenticated using (public.is_trip_member(trip_id));
create policy days_write on public.days for all to authenticated
  using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));

create policy items_select on public.items for select to authenticated using (public.is_trip_member(trip_id));
create policy items_write on public.items for all to authenticated
  using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));

create policy stops_select on public.tour_stops for select to authenticated using (public.is_trip_member(trip_id));
create policy stops_write on public.tour_stops for all to authenticated
  using (public.can_edit_trip(trip_id)) with check (public.can_edit_trip(trip_id));

create policy history_select on public.item_history for select to authenticated using (public.is_trip_member(trip_id));

-- Places: contributors may add them (references link places); editors may change any.
create policy places_select on public.places for select to authenticated using (public.is_trip_member(trip_id));
create policy places_insert on public.places for insert to authenticated
  with check (public.can_contribute(trip_id) and created_by = auth.uid());
create policy places_modify on public.places for update to authenticated
  using (public.can_edit_trip(trip_id) or created_by = auth.uid())
  with check (public.can_contribute(trip_id));
create policy places_delete on public.places for delete to authenticated
  using (public.can_edit_trip(trip_id) or created_by = auth.uid());

-- Contributor-owned content: references, tips, attachments, comments.
create policy refs_select on public.trip_references for select to authenticated using (public.is_trip_member(trip_id));
create policy refs_insert on public.trip_references for insert to authenticated
  with check (public.can_contribute(trip_id) and created_by = auth.uid());
create policy refs_modify on public.trip_references for update to authenticated
  using (public.can_edit_trip(trip_id) or created_by = auth.uid())
  with check (public.can_contribute(trip_id));
create policy refs_delete on public.trip_references for delete to authenticated
  using (public.can_edit_trip(trip_id) or created_by = auth.uid());

create policy refplaces_select on public.reference_places for select to authenticated using (public.is_trip_member(trip_id));
create policy refplaces_write on public.reference_places for all to authenticated
  using (public.can_contribute(trip_id)) with check (public.can_contribute(trip_id));

create policy tips_select on public.tips for select to authenticated using (public.is_trip_member(trip_id));
create policy tips_insert on public.tips for insert to authenticated
  with check (public.can_contribute(trip_id) and created_by = auth.uid());
create policy tips_modify on public.tips for update to authenticated
  using (public.can_edit_trip(trip_id) or created_by = auth.uid())
  with check (public.can_contribute(trip_id));
create policy tips_delete on public.tips for delete to authenticated
  using (public.can_edit_trip(trip_id) or created_by = auth.uid());

create policy attach_select on public.attachments for select to authenticated using (public.is_trip_member(trip_id));
create policy attach_insert on public.attachments for insert to authenticated
  with check (public.can_contribute(trip_id) and created_by = auth.uid());
create policy attach_delete on public.attachments for delete to authenticated
  using (public.can_edit_trip(trip_id) or created_by = auth.uid());

create policy comments_select on public.comments for select to authenticated using (public.is_trip_member(trip_id));
create policy comments_insert on public.comments for insert to authenticated
  with check (public.can_contribute(trip_id) and author_id = auth.uid());
create policy comments_update on public.comments for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy comments_delete on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.can_edit_trip(trip_id));

create policy reactions_select on public.reactions for select to authenticated using (public.is_trip_member(trip_id));
create policy reactions_insert on public.reactions for insert to authenticated
  with check (public.can_contribute(trip_id) and user_id = auth.uid());
create policy reactions_delete on public.reactions for delete to authenticated using (user_id = auth.uid());

create policy votes_select on public.votes for select to authenticated using (public.is_trip_member(trip_id));
create policy votes_insert on public.votes for insert to authenticated
  with check (public.can_contribute(trip_id) and user_id = auth.uid());
create policy votes_update on public.votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy votes_delete on public.votes for delete to authenticated using (user_id = auth.uid());

-- Proposals: contributors create; owner/editor decide (status changes go through a server function in M6b).
create policy proposals_select on public.proposals for select to authenticated using (public.is_trip_member(trip_id));
create policy proposals_insert on public.proposals for insert to authenticated
  with check (public.can_contribute(trip_id) and author_id = auth.uid() and status = 'pending');
create policy proposals_delete on public.proposals for delete to authenticated
  using (author_id = auth.uid() and status = 'pending');

-- Personal data.
create policy notif_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notif_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy push_all on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Exchange rates: readable by everyone signed in; written only by the service role (daily job).
create policy rates_select on public.exchange_rates for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Storage: private bucket, files stored under "<trip_id>/…"
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trip-files', 'trip-files', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create function public.storage_trip_id(p_name text) returns uuid
language sql immutable as $$
  select case
    when (storage.foldername(p_name))[1] ~ '^[0-9a-f-]{36}$' then ((storage.foldername(p_name))[1])::uuid
  end;
$$;

create policy trip_files_select on storage.objects for select to authenticated
  using (bucket_id = 'trip-files' and public.is_trip_member(public.storage_trip_id(name)));
create policy trip_files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'trip-files' and public.can_contribute(public.storage_trip_id(name)));
create policy trip_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'trip-files' and (owner = auth.uid() or public.can_edit_trip(public.storage_trip_id(name))));

-- ---------------------------------------------------------------------------
-- Lock down helper functions
-- ---------------------------------------------------------------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_trip() from public, anon, authenticated;
revoke execute on function public.track_item_changes() from public, anon, authenticated;
revoke execute on function public.accept_invite(text) from public, anon;
grant execute on function public.accept_invite(text) to authenticated;
