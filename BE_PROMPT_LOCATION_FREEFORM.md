# Backend handoff — free-form job locations (FE Phase 4.6)

The employer dashboard now lets users post jobs at **any** location in Nigeria, not just the 75 preset neighborhoods we previously seeded. Two new input methods feed into this:

1. **"Use my location"** — browser geolocation, then Google reverse-geocode → fills state/city/address.
2. **Places Autocomplete search** in the location picker — fills the same fields from Google's address_components.

When the user picks "Other (type details below)" in the Area dropdown, or either of the above auto-flips them to "Other", they enter:

- **State** (one of 36 Nigerian states + FCT, validated against a fixed FE list).
- **City or town** (free text).
- **Address** (free text — may be the Google formatted_address e.g. *"14 Wharf Road, Apapa, Lagos 102273, Nigeria"*).
- **lat / lng** — set by the map pin (search, geolocation, click, or drag).

---

## Wire-format impact

`POST /v1/employer/jobs` and `PATCH /v1/employer/jobs/:id` already accept this payload — no schema change required today. What changes in practice:

| Field | Before (preset only) | After (preset or Other) |
|---|---|---|
| `location.neighborhood` | One of ~75 known names from `apps/employer-web/lib/nigerianLocations.ts` | **Any string** the user typed for the "City or town" field. Empty/omitted when the user didn't fill the Other branch. |
| `location.address` | Short street address ("14 Wharf Road, Apapa") | May be the Google `formatted_address`, e.g. *"14 Wharf Road, Apapa, Lagos 102273, Nigeria"* — country + postal code may be appended. |
| `location.lat` / `location.lng` | Inside Lagos metro (≈ 6.4–6.6 lat, 3.27–3.62 lng) | Anywhere in Nigeria. The Places Autocomplete is `componentRestrictions: { country: 'ng' }`. |

The FE does **not** currently send `state` or `city` as separate fields. If you want them structured on the `Job` entity, see "Decision needed" below.

---

## What I need from the BE

### 1. Loosen `neighborhood` validation (required)

If `CreateJobDto.location.neighborhood` is constrained to a fixed enum or regex, drop that restriction. It's now an arbitrary user-typed string (or omitted entirely).

Sensible constraint: `@IsString() @MaxLength(120) @IsOptional()`.

### 2. Don't assume lat/lng are Lagos-bound

Any Nigeria-wide validation is fine. If you have a `latitudeInLagosMetro` or similar guard, swap it for the country bounding box:

```
lat ∈ [4.0, 14.0]
lng ∈ [2.5, 14.7]
```

(That's the rough rectangle around Nigeria. Worker matchmaking may still want to filter by proximity, but the schema-level guard shouldn't reject e.g. an Abuja job.)

### 3. Address length

If `address` has a length cap, raise it to 200 (matches the FE Zod schema). Google formatted addresses run long.

### 4. Decision needed — do you want `state` + `city` as separate fields?

Two options:

**Option A — keep the current shape (status quo).** The FE folds the user's city into `neighborhood` and the rest into `address`. No BE schema change. Pro: zero migration. Con: filtering jobs by state/city later requires parsing the freeform string.

**Option B — add `state` + `city` to `JobLocationDto`.** FE will send them when populated. BE persists them as nullable columns on `Job`. Enables clean state/city filtering on the Jobs list endpoint.

If you pick B, the new shape:

```ts
JobLocationDto = {
  lat: number;
  lng: number;
  address: string;             // existing
  neighborhood?: string | null; // existing — now broader
  state?: string | null;       // NEW — one of 36 NG states or "FCT (Abuja)"
  city?: string | null;        // NEW — free text
};
```

The FE list-filter endpoint `GET /v1/employer/jobs?neighborhood=...` already accepts a free string — if you add a `state=` filter on option B, the FE list page can wire it up later.

---

## Google Cloud APIs (already on the FE side, but the BE should know)

The FE now uses three Google Maps APIs, all keyed off `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`:

- **Maps JavaScript API** — base map render (already enabled).
- **Places API** — Autocomplete search box.
- **Geocoding API** — reverse geocode after "Use my location".

If any are not enabled on the GCP project, those specific UX paths silently degrade (search box no-ops, geolocation still works but doesn't auto-fill state/city). No FE crash either way.

---

## Sample payloads after this lands

**Preset location (no change):**
```json
{
  "title": "Container loaders, Apapa",
  "location": {
    "lat": 6.4458,
    "lng": 3.3608,
    "address": "14 Wharf Road, Apapa",
    "neighborhood": "Apapa"
  }
}
```

**"Other" via geolocation auto-fill (new shape with Option A):**
```json
{
  "title": "Event setup crew",
  "location": {
    "lat": 9.0578,
    "lng": 7.4951,
    "address": "Plot 1234 Wuse 2, Abuja, FCT 900288, Nigeria",
    "neighborhood": "Abuja"
  }
}
```

**Same payload under Option B (if adopted):**
```json
{
  "title": "Event setup crew",
  "location": {
    "lat": 9.0578,
    "lng": 7.4951,
    "address": "Plot 1234 Wuse 2, Abuja, FCT 900288, Nigeria",
    "neighborhood": "Abuja",
    "state": "FCT (Abuja)",
    "city": "Abuja"
  }
}
```

---

## What's already working FE-side, no BE action needed

- Worker matchmaking proximity (`lat`/`lng` is authoritative; preset name was always cosmetic).
- Map rendering on overview / jobs detail / workers active — those screens read `lat`/`lng` and render the pin regardless of `neighborhood` value.
- Existing 75 presets still appear in the dropdown and still send the canonical name as `neighborhood`.

---

## Quick yes/no

If you can confirm:

1. ✅ / ❌ Loosen `neighborhood` validation as described in §1.
2. ✅ / ❌ Country-wide lat/lng bounds (§2).
3. ✅ / ❌ Address length cap 200 (§3).
4. **A or B?** — keep shape (A) or add `state`/`city` to the DTO (B).

I'll wire the FE-side end of (4) when the openapi spec is regenerated.
