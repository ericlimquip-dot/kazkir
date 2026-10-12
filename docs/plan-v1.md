# Kazkir — v1 Build Plan

Companion to [design.md](design.md). Each milestone ends with something you can open on your phone and try. Milestones run in order; tasks inside a milestone can mostly run in parallel.

## M0 — Foundation (done)

- [x] Next.js 16 + TypeScript 5 + Tailwind 4 project
- [x] Originkit Features 01 landing section with Kazkir copy
- [x] Git repo + first commit
- [x] `app/kazkir-theme.css`: design tokens from design.md §8 (colours, shadows, radii, motion)
- [x] Shared UI primitives in `components/ui/` built from the Features 01 patterns: `Card`, `TabList` (vertical + horizontal), `IconTile`, `Button`, `Chip`, `Sheet` (bottom sheet on phone, side panel on laptop), `EmptyState` (warm gradient + dot grid)
- [x] i18n setup (EN + ID message files, locale switch)
- [x] ESLint + Prettier, Vitest, Playwright smoke test

**Done when:** landing page + a component gallery page render in both languages on phone and laptop.

## M1 — Accounts and backend (done 2026-10-12)

- [x] Supabase project (free tier) + keep-alive scheduled ping (GitHub Actions)
- [x] Schema migrations for v1 tables (design.md §14) + RLS policies + policy tests (`npm run test:db`, 35 checks)
- [x] Auth: Google + email magic link; `profiles` row on first sign-in
- [x] Vercel deployment (Hobby), env vars, preview deploys — https://kazkir.vercel.app (sin1)
- [x] PWA manifest, icons, service worker shell; "Add to Home Screen" onboarding using the phone-frame assets

**Done when:** you can sign in on the deployed URL and install Kazkir on your phone's home screen.

## M2 — Trips and itinerary

- [ ] Home: trip cards by stage; create trip (title, destination cities, optional dates/day count)
- [ ] Trip stages + date-setting that maps Day 1…N onto the calendar
- [ ] Cities with time zone + currency; days linked to cities
- [ ] Items: all 7 types with type-specific forms (design.md §4)
- [ ] Tours: stops editor, voucher upload with client-side compression, operator WhatsApp link
- [ ] Stay rendering across nights
- [ ] Item detail sheet; status changes

**Done when:** you can build a full undated trip plan, then set dates and see it on real days.

## M3 — Planning board

- [ ] Plan tab: vertical day list + Unscheduled/Wishlist tray (phone), columns (laptop)
- [ ] Drag-and-drop (dnd-kit): long-press, auto-scroll, reorder, cross-day move; fractional `sort_key`
- [ ] "Move to Day…" menu; undo toast
- [ ] "Keep the same time" option on move
- [ ] Realtime sync of board changes between members

**Done when:** two people on two phones see each other's moves live.

## M4 — Places and maps

- [ ] Google Places search proxied through a server route; quota caps configured in Google Cloud; graceful "quota reached" fallback
- [ ] Google Maps link paste → coordinate parsing
- [ ] "Open in…" builder: Google, 2GIS, MAPS.ME, Yandex, Naver, Kakao, Amap, Apple, custom templates; country defaults + per-trip override

**Done when:** every place opens correctly in 2GIS and MAPS.ME on a real phone.

## M5 — References and tips

- [ ] Ideas tab: references grid + tips board + wishlist
- [ ] Add reference: paste link; TikTok oEmbed preview; caption/screenshot attach; tags
- [ ] Android Web Share Target; iPhone clipboard-paste prompt
- [ ] Find place from caption text; link places; "Add to day"
- [ ] Tips pinned to city/day

**Done when:** sharing a TikTok on Android and pasting an Instagram link on iPhone both end up as places in the plan.

## M6 — Collaboration

- [ ] People tab: members, roles, change role, remove member
- [ ] Invite links (expiring, role per link), WhatsApp share, join flow after sign-in
- [ ] Comments on items/references + trip thread; @mentions; reactions; compressed photos
- [ ] Voting on ideas/references
- [ ] Contributor permissions enforced in UI + RLS
- [ ] In-app inbox

**Done when:** an invited friend joins from WhatsApp, comments, votes and @mentions you.

## M6b — Proposals

- [ ] `proposals` table + RLS; kinds: add / move / remove / edit
- [ ] Contributor drag-and-drop and edits create proposals instead of changes
- [ ] Ghost items on the Plan board ("Rina wants to move … to Day 3")
- [ ] Accept / reject for owner and editors; accept applies the change atomically (server function)
- [ ] Stale-proposal handling: if the target item changed or was deleted, show "outdated" and allow reject only
- [ ] Push to deciders; push to author on decision; voting on proposals

**Done when:** a contributor drags an item to another day, you get a push, accept it, and the board updates for everyone.

## M7 — Offline

- [ ] IndexedDB cache of Booked/Ongoing trips (+ manual "save offline" for others); voucher files cached
- [ ] Outbox for offline actions (done, note, comment, move); replay on reconnect
- [ ] Last-write-wins per field with `version` check; `item_history` records overwrites
- [ ] Offline badge + pending-changes count
- [ ] Today view + Next up card from cache

**Done when:** in airplane mode you can open the trip, view vouchers, mark items done, and everything syncs when back online.

## M8 — Reminders and notifications

- [ ] Web Push subscription + VAPID keys; per-user, per-trip preferences
- [ ] Scheduler (Supabase cron / edge function): item reminders (30 min / 60 min tours), 7:00 local daily summary, in each item's time zone
- [ ] Collaboration pushes: mentions, proposals, decisions
- [ ] Per-member `.ics` calendar feed with VALARMs; "Add to calendar" for Google/Apple

**Done when:** reminders arrive on both an iPhone (installed) and an Android phone, and calendar alarms fire offline.

## M9 — Polish and launch to your group

- [ ] Replace Originkit stock screenshots with real Kazkir screens
- [ ] Accessibility pass (keyboard, screen reader labels, reduced motion)
- [ ] Bahasa Indonesia copy review
- [ ] Storage/quota monitoring page for the owner
- [ ] Invite your group; plan the first real trip in it

## v1.1 (next)

Budget estimates + exchange-rate override, bill splitting + settle-up.

## Working agreement

- Claude Code builds, you review each milestone on your phone before the next starts.
- Each milestone = one branch + PR with screenshots.
- No paid services without asking first (design goal: Rp 0/month).
