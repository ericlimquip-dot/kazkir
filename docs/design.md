# Kazkir — Design Document

Status: **confirmed** (2026-10-12). Source: four-round design interview + Originkit "Features 01" visual base.

## 1. Product

Kazkir is a trip planner for leisure trips abroad with friends and colleagues. Private first (invite-only), built so it can go public later. Zero running cost. Must stay useful in remote areas with no internet (e.g. Kazakhstan, Kyrgyzstan mountains).

**Users:** an organiser (owner) plus invited friends on a mix of iPhone and Android, Indonesian, paying in Rupiah.

**Languages:** English + Bahasa Indonesia (i18n from day one).

## 2. Stack (all free tiers)

| Concern        | Choice                                                                           | Notes                                                                          |
| -------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| App            | Next.js 16 (App Router), TypeScript 5, React 19                                  | Installable PWA                                                                |
| Styling        | Tailwind CSS 4 + Originkit theme tokens                                          | See §8                                                                         |
| Hosting        | Vercel Hobby                                                                     |                                                                                |
| Backend        | Supabase free: Postgres, Auth, Realtime, Storage                                 | 500 MB DB, 1 GB storage; scheduled keep-alive ping so the project never pauses |
| Auth           | Google sign-in + email magic link                                                | No SMS (costs money)                                                           |
| Places         | Google Places API, card on file, **hard daily quota caps at the free allowance** | Fallback: paste a Google Maps link, coordinates parsed from it                 |
| Exchange rates | Free daily rate API, owner override per trip                                     |                                                                                |
| Push           | Web Push (VAPID) from a Supabase scheduled function                              | iPhone requires "Add to Home Screen"                                           |
| Offline        | Service worker + IndexedDB cache + outbox queue                                  |                                                                                |

## 3. Trip lifecycle

`Idea → Planning → Booked → Ongoing → Done`

- **Idea / Planning:** dates optional. Days are "Day 1…Day N" until a start date is set; setting it maps days onto the calendar.
- **Booked:** dates fixed; reminders and calendar export switch on; trip auto-cached offline.
- **Ongoing:** app opens to **Today**.
- One trip can span several cities and countries. Each item has a location, a time zone (IANA) and a currency. Times are stored as destination local time + zone.

## 4. Itinerary items

Shared fields: title, type, day (or unscheduled/wishlist), order, start/end time or "anytime", time zone, place, cost estimate (amount + currency, per person or shared), status (`idea → planned → booked → done`), notes, attachments, comments, votes.

| Type                | Extra fields                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| ✈️ Flight           | flight number, from/to airports, terminals, booking code                                                                                      |
| 🏨 Stay             | check-in date/time, check-out date/time; rendered on every night it covers                                                                    |
| 🚐 Tour             | operator, contact (WhatsApp/phone), pickup time + place, voucher, inclusions, cancellation deadline, **stops** (ordered list of places/times) |
| 📍 Place / Activity | —                                                                                                                                             |
| 🍜 Food             | —                                                                                                                                             |
| 🚆 Transport        | mode (train/bus/transfer/ferry), from → to                                                                                                    |
| 📝 Free time / Note | —                                                                                                                                             |

Flights and stays are entered by hand with the booking PDF/screenshot attached. Tours can be added before departure or on the spot in under a minute.

## 5. References and tips

- **Reference** = link + optional caption text / screenshot + note + tags + zero or more linked places.
- Sources: Instagram, Threads, TikTok, or any URL.
- Capture:
  - Android: installed PWA registers as a **Web Share Target** (share from the app straight to Kazkir).
  - iPhone: copy link, open Kazkir, tap **"Paste link from clipboard?"**.
- Link preview: TikTok oEmbed gives caption + thumbnail; Instagram/Threads usually give nothing — the link is always saved anyway.
- **Find place:** highlight or type a name → Google Places search → confirm → linked. Manual Google Maps link paste always available.
- A place reference can be added to a day (becomes an itinerary item linked to the reference).
- **Tips** (no place) live on the trip's tips board, optionally pinned to a city or day.
- AI place detection is deferred (paid).

## 6. Collaboration

**Roles** (per trip): Owner (everything) · Editor (edits directly) · Contributor (default for invitees; adds references, comments, votes, proposes) · Viewer (read only).

**Invites:** expiring links, WhatsApp-friendly; owner picks the role per link and can change a member's role later.

**Proposals:** contributors' add / move / remove / edit actions — including drag-and-drop between days — create a proposal shown as a ghost item ("Rina wants to move Ramen Ichiran from Day 2 to Day 3"). Owner or editor accepts or rejects; accept applies the change.

**Voting:** 👍 on ideas, references and proposals.

**Comments:** on items and references, plus one trip-wide thread. @mentions, emoji reactions, compressed photos.

## 7. Planning interactions

- **Phone:** one vertical list of days with an **Unscheduled / Wishlist** tray on top. Long-press to drag between days or reorder; auto-scroll while dragging. **"Move to Day…"** menu as the one-handed / accessible alternative.
- **Laptop:** days as side-by-side columns.
- Owner/editor moves apply immediately with **undo**; contributor moves become proposals.
- Times don't shift on move unless "keep the same time" is chosen.

## 8. Visual design (Originkit Features 01 base)

The landing section in `components/originkit/features-01.tsx` sets the visual language for the whole app.

**Tokens** (to be defined in `app/kazkir-theme.css` as Tailwind `@theme` values):

| Token          | Value                                                   | Use                                      |
| -------------- | ------------------------------------------------------- | ---------------------------------------- |
| `ink`          | `#1e1e1e` / headings `#010110`                          | primary text, icons                      |
| `muted`        | `#45545e`                                               | body/secondary text                      |
| `muted-teal`   | `#4c6a75`                                               | text on active/selected surfaces         |
| `muted-grey`   | `#60605d`                                               | tertiary text                            |
| `sky-100`      | `#bce7f8`                                               | selected tab / active day / primary chip |
| `sky-300`      | `#9bd3e9`                                               | selected border                          |
| `sky-400`      | `#90d7f3`                                               | active icon tile border                  |
| `line`         | `#e5e5e5`, `#dfe1e2`                                    | borders, dividers                        |
| `hover`        | `#f7f9fb`                                               | hover surface                            |
| `surface-warm` | gradient `135deg #fffcf5 → #fdfdfd → #f7fcff → #f0f8ff` | preview panels, empty states             |
| `dot-grid`     | radial `#c8cedd` 1px on 11px grid, 40%                  | canvas backgrounds (Plan board)          |

**Shape & depth:** cards `rounded-3xl` white with the layered `CARD_SHADOW`; list rows/tabs `rounded-xl`; panels `rounded-[17px]`; icon tiles 40px `rounded-lg` with white→`#f2f2f2` gradient (idle) or white + `sky-400` border (active).

**Type:** Inter; headings medium weight, tracking `-0.04em`, line-height 1.12; UI text 13–16px medium, tracking `-0.01em`.

**Motion:** `animate-section-rise` (500ms) for screen entrances with 80ms stagger; `animate-hero-reveal` for swapped content; `motion-reduce` respected everywhere.

**Assets reused** (`public/originkit/features-01/`): `bg.png` (warm-to-sky gradient — app shell header / onboarding / login backdrop), `lights.png`, `card-texture.png`, `pattern.svg`, phone frame SVGs (`phone-*.svg`, for "Add to Home Screen" onboarding and marketing mockups). Stock screenshots (`meeting.png`, `planning.png`, `event.png`, `powerful-integration.png`, `screen-*.png`, `task-members.png`) are placeholders to be replaced with real Kazkir screens.

**Pattern mapping:** the vertical tab list → item/day lists and trip tab bar; the active blue tab → selected day, current "Next up" item; the preview panel → item detail sheet and the Plan canvas.

## 9. Screens

- **Landing** (signed out): Features 01 section + sign-in.
- **Home:** trip cards grouped by stage.
- **Trip** tabs: **Plan** (days + wishlist tray) · **Ideas** (references, wishlist, tips board) · **Money** (v1.1) · **People** (members, roles, invites).
- **Today** (ongoing trips): today's plan + offline "Next up" card.
- **Item detail** sheet, **Reference detail**, **Inbox**, **Settings** (language, notifications, maps apps).

## 10. Maps — "Open in…"

Each place stores coordinates once. Buttons generated per app: Google Maps, 2GIS, MAPS.ME, Yandex Maps, Naver Map, Kakao Map, Amap, Apple Maps, plus **custom URL templates** (`{lat}`, `{lng}`, `{name}`). Defaults by country (e.g. KZ/KG → 2GIS + MAPS.ME + Google; KR → Naver + Kakao + Google; CN → Amap), overridable per trip.

## 11. Notifications

- **Itinerary reminders** (each member, adjustable/mutable): 30 min before items, 60 min before tour pickups, 7:00 local daily summary.
- **Calendar export:** subscribable `.ics` feed per member per trip; alarms fire offline.
- **Offline "Next up"** screen from cached data.
- **Collaboration:** push for @mentions, proposals awaiting your decision, decisions on your proposals. Everything else → in-app inbox. Per-trip toggles.

## 12. Offline

- Auto-cached: all Booked and Ongoing trips (items, places, vouchers, references, tips, members' contacts). Idea/Planning trips cacheable by hand.
- Offline actions: mark done, notes, comments, add expense, move item → **outbox**, synced on reconnect.
- Conflicts: last-write-wins per field; overwritten value kept in item history.
- Badge: "Offline · 3 changes waiting".

## 13. Money (v1.1)

- Estimates in local currency → IDR at the trip rate (daily auto, owner override).
- Per-person vs shared costs; totals per person and for the group.
- Expenses: who paid, amount in local currency, split equal / shares / exact; linkable to an item (estimate vs actual).
- Settle-up: minimal transfers in Rupiah.

## 14. Data model (Supabase / Postgres)

```
profiles(id → auth.users, display_name, avatar_url, locale, home_currency='IDR')
trips(id, owner_id, title, stage, start_date?, day_count, cover_image, default_currency, idr_rate_override?, created_at)
trip_members(trip_id, user_id, role[owner|editor|contributor|viewer], notif_prefs jsonb)
trip_invites(id, trip_id, token, role, expires_at, created_by, max_uses?)
trip_cities(id, trip_id, name, country_code, timezone, currency, maps_apps text[])
days(id, trip_id, day_index, date?, city_id?)
places(id, trip_id, name, lat, lng, address, country_code, google_place_id?, source_url?)
items(id, trip_id, day_id?, sort_key, type, title, status, start_time?, end_time?, timezone,
      place_id?, cost_amount?, cost_currency?, cost_basis[per_person|shared], details jsonb,
      created_by, updated_at, version)
tour_stops(id, item_id, sort_key, place_id?, time?, note)
attachments(id, trip_id, item_id?, reference_id?, storage_path, mime, size)
trip_references(id, trip_id, url, platform, caption?, note?, thumbnail_url?, tags text[], created_by)
reference_places(reference_id, place_id, trip_id)
tips(id, trip_id, body, city_id?, day_id?, created_by)
proposals(id, trip_id, author_id, kind[add|move|remove|edit], payload jsonb, status, decided_by?, decided_at?)
votes(user_id, target_type, target_id, value)
comments(id, trip_id, target_type[item|reference|trip], target_id?, author_id, body, mentions uuid[], photo_path?)
reactions(comment_id, user_id, emoji)
item_history(id, item_id, field, old_value, new_value, changed_by, changed_at)
notifications(id, user_id, trip_id, kind, payload, read_at?)
push_subscriptions(id, user_id, endpoint, keys jsonb)
exchange_rates(date, currency, idr_per_unit)
-- v1.1
expenses(id, trip_id, item_id?, paid_by, amount, currency, idr_rate, note, created_at)
expense_splits(expense_id, user_id, share_type, share_value)
```

Row-level security on every table: access only through `trip_members`; write rights by role; contributors write only to references, comments, votes, proposals, tips.

## 15. Risks and limits

- iPhone: no share-sheet entry; push only after Add to Home Screen.
- No push without internet → calendar export + offline Next up are the safety net.
- Free tier limits: compress images (vouchers ≤ ~300 KB, comment photos ≤ ~200 KB).
- Google quota caps can be hit → manual link paste fallback.
- Instagram/Threads link previews mostly unavailable.

## 16. Phases

- **v1:** trips & days (undated), all item types incl. tours with stops & vouchers, references + Find place, tips board, invites & roles, comments + trip thread, voting, drag-and-drop planning, offline mode, reminders + calendar export, Open in… maps, EN/ID.
- **v1** also includes the proposals workflow (moved from v1.1 on 2026-10-12).
- **v1** also shows a live Rupiah estimate for every cost (daily rate, ExchangeRate-API) — added 2026-10-13.
- **v1.1:** trip budget totals + owner rate override, bill splitting + settle-up.
- **v2:** maps view, public read-only web viewer, AI place detection, booking-email parsing, native store wrapper.
