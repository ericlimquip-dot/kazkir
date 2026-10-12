-- Keep a trip's day rows in step with trips.day_count.
-- Growing a trip adds empty days; shrinking removes the last days and moves their items
-- to the wishlist (items.day_id is ON DELETE SET NULL), so nothing is lost.

create function public.sync_trip_days() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  default_city uuid;
begin
  if tg_op = 'UPDATE' and new.day_count = old.day_count then
    return new;
  end if;

  select id into default_city
  from public.trip_cities where trip_id = new.id
  order by sort_key, id limit 1;

  insert into public.days (trip_id, day_index, city_id)
  select new.id, i, default_city
  from generate_series(1, new.day_count) as i
  on conflict (trip_id, day_index) do nothing;

  delete from public.days where trip_id = new.id and day_index > new.day_count;
  return new;
end;
$$;

create trigger trips_sync_days
  after insert or update of day_count on public.trips
  for each row execute function public.sync_trip_days();

revoke execute on function public.sync_trip_days() from public, anon, authenticated;

-- Days created before a trip's first city exists get that city once it's added.
create function public.fill_day_cities() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.days set city_id = new.id where trip_id = new.trip_id and city_id is null;
  return new;
end;
$$;

create trigger trip_cities_fill_days
  after insert on public.trip_cities
  for each row execute function public.fill_day_cities();

revoke execute on function public.fill_day_cities() from public, anon, authenticated;
