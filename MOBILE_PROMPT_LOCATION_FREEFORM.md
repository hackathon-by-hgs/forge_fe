# Worker-mobile handoff — free-form job locations

Companion to [BE_PROMPT_LOCATION_FREEFORM.md](BE_PROMPT_LOCATION_FREEFORM.md). Employers can now post jobs anywhere in Nigeria, not just the 75 Lagos-heavy preset neighborhoods. This affects what shows up in a worker's feed and how the mobile app should render it.

The single biggest change — matching workers to jobs by **lat/lng distance** instead of `neighborhood` string equality — is a backend job. This doc covers the mobile-FE-side adjustments that fall out of it.

---

## What changes in the wire format

`GET /v1/me` and the worker job feed both surface `job.location`. New possibilities:

| Field | Before | Now |
|---|---|---|
| `location.neighborhood` | One of ~75 known preset names ("Apapa", "Lekki", …) | **Any string** an employer typed — e.g. "Wuse 2", "Plot 1234 Sango Ota", or absent entirely. |
| `location.address` | Short, hand-typed | May be Google's `formatted_address`, up to ~200 chars, often ending in *", Lagos 102273, Nigeria"*. |
| `location.lat` / `location.lng` | Lagos bounding box | Anywhere in Nigeria. Bounds the BE accepts: lat ∈ [4.0, 14.0], lng ∈ [2.5, 14.7]. |
| `state` / `city` *(if BE picks Option B)* | — | First-class nullable strings. Use `state` for region filters. |

---

## Mobile FE adjustments

### 1. Drop any hardcoded preset list in filter UI

If the worker app has a "Filter by neighborhood" picker driven by a static list mirroring the 75 employer-side presets, it will silently exclude any jobs posted with custom locations. Two options:

- **Cheap fix**: change the filter to a "Near me" toggle that just asks the BE for jobs within N km of `worker.location.lat/lng`.
- **Better fix (if BE adopts Option B)**: switch to a State picker (36 NG states + FCT), with optional "City" free-text. State enum is fixed; matches the employer-web list.

Either way, **don't hardcode the 75 preset names** — they're not authoritative anymore.

### 2. Defensive rendering of `location.neighborhood`

Treat it as an arbitrary display string. Truncate to ~30 chars in list cells, full string in detail view. If it's empty/null, fall back to `location.address.split(',')[0]` or just `'—'`. Don't pattern-match against the old preset list.

```ts
// pseudo
function jobAreaLabel(job: Job): string {
  if (job.location.neighborhood) return job.location.neighborhood;
  return job.location.address.split(',')[0]?.trim() || '—';
}
```

### 3. Map view auto-fit / centering

If the worker app has a map screen (or the "view this job on a map" detail), it likely centers on Lagos by default. Jobs in Abuja/Port-Harcourt/Kano will be off-screen on first paint.

- Center the worker-feed map on `worker.location.lat/lng` (the worker's home coords), not a hardcoded Lagos center.
- For the job-detail map, fit bounds to `job.location.lat/lng` + the worker's location so both pins are visible.
- If `worker.location.lat/lng` is null (newly-signed-up worker without geolocation), fall back to country center (lat 9.082, lng 8.6753) and zoom out.

### 4. Distance display

If the app shows "X km away" badges, that comes from `haversine(worker, job)`. Already lat/lng-based, no change — but verify the badge still renders correctly for distances > 50 km (Abuja from Lagos is ~750 km — make sure the formatter doesn't overflow).

### 5. Worker home location capture (sign-up flow)

If worker sign-up currently asks for `homeNeighborhood` as a dropdown of presets, that's now a bottleneck. Consider:
- Same UX as the employer location picker: search via Places Autocomplete OR "Use my location" → store lat/lng.
- Persist both `homeNeighborhood` (for display) and `coords` (for matching).

This is the dependency for §1's "Near me" filter to work.

### 6. Job feed empty-state copy

If the worker is in a region where no jobs are posted yet (Kano, Calabar, etc.), the feed will be empty. Adjust copy: *"No jobs near you yet — try expanding your range or check back later."* rather than the old *"No jobs in your neighborhood"*.

---

## What stays the same

- Job acceptance, clock-in, clock-out, photo proof — all unchanged.
- SSE event vocabulary — unchanged.
- Wallet / withdrawal / virtual NUBAN — unchanged.
- `Worker.virtual_account` field on `/v1/me` — unchanged (still rolled out, ready for the mobile team per FE_MONEY_END_TO_END §3).

---

## Quick checklist for the mobile team

- [ ] Replace hardcoded neighborhood filter with "Near me" or State picker
- [ ] Defensive rendering: `location.neighborhood` is now any string, may be empty
- [ ] Center map on worker coords, not Lagos
- [ ] Verify distance formatter handles > 100 km cleanly
- [ ] Update sign-up to capture worker lat/lng (search + "Use my location")
- [ ] Update empty-state copy

The BE-side changes (proximity matching, worker.coords requirement) are tracked in [BE_PROMPT_LOCATION_FREEFORM.md](BE_PROMPT_LOCATION_FREEFORM.md). The mobile team needs the BE work to ship first — items 1, 3, and 5 above assume `worker.location.lat`/`lng` exists.
