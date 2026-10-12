// Runs all Kazkir migrations against PGlite with minimal Supabase stand-ins, then checks RLS.
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readdirSync, readFileSync } from "node:fs";

const migrationsDir = new URL("../migrations/", import.meta.url);
const migration = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(new URL(f, migrationsDir), "utf8"))
  .join("\n");
const db = new PGlite({ extensions: { pgcrypto } });

const STUBS = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as
  $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema public, auth, storage to anon, authenticated;
grant execute on all functions in schema auth to authenticated, anon;
`;

const GRANTS = `
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
grant usage, select on all sequences in schema public to authenticated;
`;

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!ok) failures++;
};

const U = {
  owner: "00000000-0000-0000-0000-00000000000a",
  editor: "00000000-0000-0000-0000-00000000000b",
  contrib: "00000000-0000-0000-0000-00000000000c",
  viewer: "00000000-0000-0000-0000-00000000000d",
  stranger: "00000000-0000-0000-0000-00000000000e",
};

async function as(user, sql, params = []) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${user ?? ""}', false); set role authenticated;`);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec("reset role;");
  }
}
async function tryAs(user, sql, params = []) {
  try {
    const r = await as(user, sql, params);
    return { ok: true, rows: r.rows, affected: r.affectedRows };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

await db.exec(STUBS);
try {
  await db.exec(migration);
  check("migration applies", true);
} catch (e) {
  check("migration applies", false, e.message);
  process.exit(1);
}
await db.exec(GRANTS);

// Users -> profiles via trigger
for (const [name, id] of Object.entries(U)) {
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [
    id, `${name}@example.com`, JSON.stringify({ full_name: name }),
  ]);
}
const profiles = await db.query("select count(*)::int as n from public.profiles");
check("profile created per auth user", profiles.rows[0].n === 5);

// Owner creates a trip -> becomes owner member
const trip = await as(U.owner, `insert into public.trips (owner_id, title) values ($1, 'Almaty & Bishkek') returning id`, [U.owner]);
const tripId = trip.rows[0].id;
const ownerRole = await as(U.owner, `select public.trip_role($1) as r`, [tripId]);
check("creator becomes owner", ownerRole.rows[0].r === "owner");

check("cannot create a trip for someone else",
  !(await tryAs(U.stranger, `insert into public.trips (owner_id, title) values ($1, 'x')`, [U.owner])).ok);

// Invites -> roles
const inv = async (role) =>
  (await as(U.owner, `insert into public.trip_invites (trip_id, role, created_by) values ($1, $2, $3) returning token`, [tripId, role, U.owner])).rows[0].token;
const tEditor = await inv("editor");
const tContrib = await inv("contributor");
const tViewer = await inv("viewer");
check("accept_invite (editor)", (await tryAs(U.editor, `select public.accept_invite($1)`, [tEditor])).ok);
check("accept_invite (contributor)", (await tryAs(U.contrib, `select public.accept_invite($1)`, [tContrib])).ok);
check("accept_invite (viewer)", (await tryAs(U.viewer, `select public.accept_invite($1)`, [tViewer])).ok);
check("owner invite role rejected",
  !(await tryAs(U.owner, `insert into public.trip_invites (trip_id, role, created_by) values ($1, 'owner', $2)`, [tripId, U.owner])).ok);
check("non-owner cannot create invites",
  !(await tryAs(U.editor, `insert into public.trip_invites (trip_id, role, created_by) values ($1, 'viewer', $2)`, [tripId, U.editor])).ok);

await db.query(`update public.trip_invites set expires_at = now() - interval '1 day' where token = $1`, [tViewer]);
const expired = await tryAs(U.stranger, `select public.accept_invite($1)`, [tViewer]);
check("expired invite rejected", !expired.ok, expired.error);

// Visibility
const strangerTrips = await as(U.stranger, `select id from public.trips`);
check("stranger sees no trips", strangerTrips.rows.length === 0);
const viewerTrips = await as(U.viewer, `select id from public.trips`);
check("viewer sees the trip", viewerTrips.rows.length === 1);
const members = await as(U.contrib, `select user_id from public.trip_members where trip_id = $1`, [tripId]);
check("members see each other", members.rows.length === 4);
const strangerProfiles = await as(U.stranger, `select id from public.profiles`);
check("stranger sees only own profile", strangerProfiles.rows.length === 1);

// Itinerary writes by role
const day = await as(U.owner, `insert into public.days (trip_id, day_index) values ($1, 1) returning id`, [tripId]);
const dayId = day.rows[0].id;
const editorItem = await tryAs(U.editor, `insert into public.items (trip_id, day_id, type, title) values ($1, $2, 'food', 'Ramen') returning id, version`, [tripId, dayId]);
check("editor can add items", editorItem.ok, editorItem.error);
const itemId = editorItem.rows?.[0]?.id;
check("contributor cannot add items directly",
  !(await tryAs(U.contrib, `insert into public.items (trip_id, type, title) values ($1, 'food', 'x')`, [tripId])).ok);
const contribUpdate = await tryAs(U.contrib, `update public.items set title = 'hacked' where id = $1`, [itemId]);
check("contributor update affects 0 rows", contribUpdate.ok && contribUpdate.affected === 0);
const viewerUpdate = await tryAs(U.viewer, `update public.items set title = 'hacked' where id = $1`, [itemId]);
check("viewer update affects 0 rows", viewerUpdate.ok && viewerUpdate.affected === 0);

// History + version
await as(U.owner, `update public.items set title = 'Ramen Ichiran', status = 'planned' where id = $1`, [itemId]);
const hist = await as(U.viewer, `select field from public.item_history where item_id = $1 order by field`, [itemId]);
check("history records changed fields", JSON.stringify(hist.rows.map((r) => r.field)) === '["status","title"]', JSON.stringify(hist.rows));
const ver = await as(U.viewer, `select version from public.items where id = $1`, [itemId]);
check("version bumped", ver.rows[0].version === 2);

// Contributor content
const ref = await tryAs(U.contrib, `insert into public.trip_references (trip_id, url, platform, created_by) values ($1, 'https://tiktok.com/x', 'tiktok', $2) returning id`, [tripId, U.contrib]);
check("contributor can add references", ref.ok, ref.error);
check("viewer cannot add references",
  !(await tryAs(U.viewer, `insert into public.trip_references (trip_id, url, created_by) values ($1, 'x', $2)`, [tripId, U.viewer])).ok);
const prop = await tryAs(U.contrib, `insert into public.proposals (trip_id, author_id, kind, item_id, payload) values ($1, $2, 'move', $3, '{}') returning id`, [tripId, U.contrib, itemId]);
check("contributor can propose", prop.ok, prop.error);
check("contributor cannot self-accept a proposal",
  !(await tryAs(U.contrib, `insert into public.proposals (trip_id, author_id, kind, status) values ($1, $2, 'add', 'accepted')`, [tripId, U.contrib])).ok);
check("contributor can comment",
  (await tryAs(U.contrib, `insert into public.comments (trip_id, target_type, author_id, body) values ($1, 'trip', $2, 'hi')`, [tripId, U.contrib])).ok);
check("viewer cannot comment",
  !(await tryAs(U.viewer, `insert into public.comments (trip_id, target_type, author_id, body) values ($1, 'trip', $2, 'hi')`, [tripId, U.viewer])).ok);
check("stranger cannot vote",
  !(await tryAs(U.stranger, `insert into public.votes (user_id, trip_id, target_type, target_id) values ($1, $2, 'item', $3)`, [U.stranger, tripId, itemId])).ok);

// Role management
const promote = await tryAs(U.owner, `update public.trip_members set role = 'editor' where trip_id = $1 and user_id = $2`, [tripId, U.contrib]);
check("owner can change roles", promote.ok && promote.affected === 1, promote.error);
const selfPromote = await tryAs(U.viewer, `update public.trip_members set role = 'owner' where trip_id = $1 and user_id = $2`, [tripId, U.viewer]);
check("viewer cannot self-promote", !selfPromote.ok || selfPromote.affected === 0);
const makeOwner = await tryAs(U.owner, `update public.trip_members set role = 'owner' where trip_id = $1 and user_id = $2`, [tripId, U.viewer]);
check("cannot grant owner role", !makeOwner.ok);
const leave = await tryAs(U.viewer, `delete from public.trip_members where trip_id = $1 and user_id = $2`, [tripId, U.viewer]);
check("member can leave", leave.ok && leave.affected === 1);
const ownerLeave = await tryAs(U.owner, `delete from public.trip_members where trip_id = $1 and user_id = $2`, [tripId, U.owner]);
check("owner cannot remove themselves", ownerLeave.ok && ownerLeave.affected === 0);

// Storage
const goodPath = `${tripId}/voucher.jpg`;
check("contributor can upload to trip folder",
  (await tryAs(U.editor, `insert into storage.objects (bucket_id, name, owner) values ('trip-files', $1, $2)`, [goodPath, U.editor])).ok);
check("stranger cannot upload to trip folder",
  !(await tryAs(U.stranger, `insert into storage.objects (bucket_id, name, owner) values ('trip-files', $1, $2)`, [goodPath, U.stranger])).ok);
const strangerFiles = await as(U.stranger, `select id from storage.objects`);
check("stranger cannot see trip files", strangerFiles.rows.length === 0);

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
