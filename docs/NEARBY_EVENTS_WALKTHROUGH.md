# Nearby Events Feature — Walkthrough

A step-by-step guide for implementing "Find gigs near you" so workers see events sorted by distance.

---

## 1. Feature Overview

| What | Description |
|------|-------------|
| **Goal** | Gig workers see events near their current location, sorted by distance |
| **User** | Gig worker (Find Work screen) |
| **Input** | Worker's location (GPS or manual city/area) |
| **Output** | Events ranked by distance, with "X km away" on cards |

---

## 2. User Walkthrough (Worker Experience)

### First-time flow

1. Worker opens **Find Work** (worker home).
2. A small banner appears above the gig list:
   - **"Find gigs near you"** + primary button: **Use my location**
   - Link: **Choose city instead**
3. Worker taps **Use my location**:
   - System shows native permission dialog (Allow / Don't Allow).
   - If **Allow** → we get coordinates → call backend → show "Nearby" results.
   - If **Don't Allow** → show: "No location access. Try choosing a city below."
4. Worker taps **Choose city instead**:
   - Search box opens (similar to Create Event location search).
   - Worker types city or area → selects from list.
   - We geocode → get lat/lng → call backend → show "Nearby" results.
5. Filter pills at top:
   - **All** — all available gigs (current behavior).
   - **Nearby** — only gigs within radius, sorted by distance.
   - **Saved** — only bookmarked gigs.
6. Each gig card shows:
   - Title, pay, date, location.
   - **2.3 km away** (when worker location is known and event has coordinates).

### Returning user flow

- If we saved their last location (city or lat/lng):
  - Auto-load **Nearby** when they open Find Work.
- If they denied location and never chose a city:
  - Show the banner again on next open.
- They can always switch filters: All / Nearby / Saved.

---

## 3. Technical Walkthrough

### 3.1 Backend

#### Step 1: Database

- Ensure `events` table has:
  - `latitude` (DECIMAL)
  - `longitude` (DECIMAL)
- If missing, add migration:

```sql
ALTER TABLE events ADD COLUMN latitude DECIMAL(10,8);
ALTER TABLE events ADD COLUMN longitude DECIMAL(11,8);
```

#### Step 2: Populate coordinates on create/update

- When organizer creates/edits an event and selects a location on the map:
  - Save `latitude` and `longitude` from the selected marker.
- When organizer uses location search and picks a place:
  - Geocode (e.g. Nominatim) returns lat/lng → save to `events`.

#### Step 3: New endpoint

`GET /events/nearby?lat=28.6139&lng=77.2090&radiusKm=25`

- **Auth**: Required (worker token).
- **Query**:
  - `lat`, `lng`: worker's location.
  - `radiusKm`: max distance (default 25, clamp 5–100).
- **Logic**:
  - Use Haversine formula to compute distance for each event with non-null lat/lng.
  - Filter: `status = 'published'` AND `distance <= radiusKm`.
  - Order by: `distance ASC`, then `event_date ASC`.
- **Response**:
  - Same event shape as browse, plus `distanceKm` per event.

#### Step 4: Haversine in SQL

```sql
SELECT e.*,
  (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance_km
FROM events e
WHERE e.status = 'published'
  AND e.latitude IS NOT NULL
  AND e.longitude IS NOT NULL
HAVING distance_km <= ?
ORDER BY distance_km ASC, e.event_date ASC;
```

---

### 3.2 Mobile App

#### Step 1: Dependencies

- `expo-location` for GPS.
- No new deps if you already use Nominatim for Create Event geocoding.

#### Step 2: API client

Add to `lib/api.ts`:

```ts
async getNearbyEvents(lat: number, lng: number, radiusKm = 25) {
  return this.request<{ events: any[] }>(
    `/events/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`
  );
}
```

#### Step 3: Location hook / service

- `requestLocationPermission()` → returns `{ granted, coords }` or `{ granted: false }`.
- `getLastKnownLocation()` — optional cache.
- `geocodeCity(cityName)` — reuse Nominatim for manual city input.

#### Step 4: WorkerDashboard changes

- State:
  - `workerLocation: { lat, lng } | null`
  - `locationPermission: 'none' | 'denied' | 'granted'`
  - `activeFilter: 'all' | 'nearby' | 'saved'`
- UI:
  - Location banner (first time or when no location).
  - Filter pills: All / Nearby / Saved.
  - When `activeFilter === 'nearby'` and `workerLocation`:
    - Call `getNearbyEvents(lat, lng)`.
    - Show results with `distanceKm` on cards.
  - When no worker location but user picks "Nearby":
    - Show banner: "Allow location or choose a city to see nearby gigs."

#### Step 5: Persist choice (optional)

- Store `last_lat`, `last_lng`, `last_city` in AsyncStorage or `worker_profiles`.
- On next open, use that to auto-load Nearby.

---

## 4. Implementation Order

| Order | Task | Owner |
|-------|------|-------|
| 1 | Add `latitude`, `longitude` to `events` (migration) | Backend |
| 2 | Ensure Create Event saves lat/lng when location is selected | Backend |
| 3 | Add `GET /events/nearby` with Haversine | Backend |
| 4 | Add `api.getNearbyEvents()` in `lib/api.ts` | Frontend |
| 5 | Add `expo-location` + permission flow | Frontend |
| 6 | Add location banner + "Use my location" / "Choose city" | Frontend |
| 7 | Add Nearby filter + call `getNearbyEvents` when active | Frontend |
| 8 | Show `distanceKm` on gig cards when available | Frontend |
| 9 | (Optional) Persist last location for returning users | Frontend |

---

## 5. Edge Cases

| Case | Handling |
|------|----------|
| Permission denied | Show "Choose city" option; no Nearby until they pick a city or re-enable |
| GPS off | Same as denied; gracefully fall back to manual city |
| Event has no lat/lng | Exclude from Nearby; still show in "All" |
| No events in radius | Show "No nearby gigs" + option to increase radius or change city |
| Geocode fails for city | Show error; let user retry or pick a different place |

---

## 6. Quick Reference

- **Worker flow**: Open Find Work → Allow location or choose city → Nearby filter → see events with distance.
- **Backend**: `GET /events/nearby?lat&lng&radiusKm` → Haversine filter + sort.
- **DB**: `events.latitude`, `events.longitude` must be populated when organizer sets location.
