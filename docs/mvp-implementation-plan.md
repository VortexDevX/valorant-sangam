# Valorant Sangam MVP Implementation Plan

## Goal

Build a basic working web app for a college Valorant tournament with:

- Public match history on `/`
- Hidden admin-only add/edit/delete match flow on `/admin/add-match`
- Hidden admin-only map veto flow on `/admin/map-select`
- MongoDB for persistence
- Next.js deployed on Vercel
- Functional first, Valorant-style UI later

The main route must not expose navigation to the map-selection page.

## Product Scope

### Public

- View match history on `/`
- See latest matches first

### Admin

- Login required on `/admin/add-match`
- Login required on `/admin/map-select`
- Add match result
- Edit match result
- Delete match result
- Run and save a Valorant veto session

### MVP Match Fields

- `teamA`
- `teamB`
- `map`
- `score`
- `note`

### MVP Veto Fields

- `teamA`
- `teamB`
- `format` (`bo1`, `bo3`, `bo5`)
- veto actions in order
- picked/decider maps
- starting side selection per played map (`atk` or `def`)

## Technical Direction

### Stack

- Next.js with App Router
- TypeScript
- MongoDB Atlas
- Next.js Route Handlers for Vercel serverless APIs
- Basic CSS only for MVP

### Why This Shape

- The UI can stay mostly client-driven.
- Database access still needs a trusted server boundary, so Route Handlers will act as the API layer.
- This works cleanly on Vercel without a separate backend deployment.

## Routes

### App Routes

- `/`
  - public match history page
  - newest first
  - no links to admin routes
- `/admin/add-match`
  - login wall first
  - after login: add form + match list with edit/delete controls
- `/admin/map-select`
  - login wall first
  - after login: veto flow setup and live veto board

### API Routes

- `POST /api/admin/login`
  - verify username/password against MongoDB
  - return a short-lived token
- `GET /api/matches`
  - public
  - returns matches sorted by newest first
- `POST /api/matches`
  - admin only
  - create a match result
- `PATCH /api/matches/[id]`
  - admin only
  - edit match result
- `DELETE /api/matches/[id]`
  - admin only
  - delete match result
- `POST /api/veto`
  - admin only
  - create a new veto session
- `GET /api/veto/[id]`
  - admin only for MVP
  - fetch one veto session
- `PATCH /api/veto/[id]`
  - admin only
  - apply the next veto action

## Auth Plan

### Requirements Confirmed

- Only one admin account
- Credentials stored in MongoDB, not hardcoded in source
- No persistent login
- Admin must log in again after refresh/revisit

### Implementation

- Store one admin record in an `admins` collection.
- Password is stored as a bcrypt hash, never plain text.
- `POST /api/admin/login` validates credentials and returns a short-lived signed token.
- The token is kept only in memory on the client, not in cookies, not in local storage, not in session storage.
- Refreshing the page clears access and forces login again.

### Why Token-in-Memory

- It satisfies the "login again and again" requirement.
- It avoids sending the raw password with every protected request after login.
- It gives basic route protection without session persistence.

### Required Env Vars

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `AUTH_JWT_SECRET`

### Admin Seeding

Use a one-time local seed script to create or update the single admin record in MongoDB.

This keeps credentials out of source control and still stores the real account in the database.

## MongoDB Collections

### `admins`

```json
{
  "_id": "ObjectId",
  "username": "admin",
  "passwordHash": "bcrypt-hash",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

Constraints:

- unique index on `username`

### `matches`

```json
{
  "_id": "ObjectId",
  "teamA": "Team Alpha",
  "teamB": "Team Beta",
  "map": "bind",
  "score": "13-11",
  "note": "Grand final",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

Notes:

- `score` stays as a display string for MVP
- server normalizes values like `12- 14` to `12-14`
- `/` sorts by `createdAt` descending

### `vetoSessions`

```json
{
  "_id": "ObjectId",
  "teamA": "Team Alpha",
  "teamB": "Team Beta",
  "format": "bo3",
  "status": "in_progress",
  "mapPool": ["bind", "breeze", "fracture", "haven", "lotus", "pearl", "split"],
  "actions": [
    {
      "step": 1,
      "team": "teamA",
      "type": "ban",
      "map": "split",
      "createdAt": "ISODate"
    }
  ],
  "result": {
    "maps": [
      {
        "order": 1,
        "map": "bind",
        "pickedBy": "teamA",
        "sideChosenBy": "teamB",
        "startingSide": "def"
      }
    ],
    "deciderMap": null
  },
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

Notes:

- `status` can be `in_progress` or `completed`
- `actions` is the source of truth
- `result` is derived and stored for easier rendering

## Fixed Map Pool

Full supported map list:

- `abyss`
- `ascent`
- `bind`
- `breeze`
- `corrode`
- `fracture`
- `haven`
- `icebox`
- `lotus`
- `pearl`
- `split`
- `sunset`

Admin first selects exactly 7 maps for a series. The veto flow then runs only on that selected 7-map pool.

Map images are served from [`public/maps`](D:\Mihir\Valorant_Sangam\public\maps).

## Veto Flow Rules

These flows will be implemented as a deterministic state machine.

### Shared Rules

- At the start, admin enters `teamA`, `teamB`, and series format.
- Team labels are logical positions, not seeded automatically.
- Only valid next actions are enabled.
- A map cannot be selected twice.
- Each action is persisted immediately.

### BO1

Sequence:

1. Team A bans
2. Team B bans
3. Team A bans
4. Team B bans
5. Team A bans
6. Team B bans
7. Remaining map becomes decider
8. Team B chooses starting side on decider map

### BO3

Sequence:

1. Team A bans
2. Team B bans
3. Team A picks map 1
4. Team B chooses starting side for map 1
5. Team B picks map 2
6. Team A chooses starting side for map 2
7. Team A bans
8. Team B bans
9. Remaining map becomes decider map 3
10. Team B chooses starting side for decider map

### BO5

Sequence:

1. Team A bans
2. Team B bans
3. Team A picks map 1
4. Team B chooses starting side for map 1
5. Team B picks map 2
6. Team A chooses starting side for map 2
7. Team A picks map 3
8. Team B chooses starting side for map 3
9. Team B picks map 4
10. Team A chooses starting side for map 4
11. Remaining map becomes decider map 5
12. Team B chooses starting side for decider map

### Stored Action Types

- `ban`
- `pick`
- `side`
- `decider`

## Validation Rules

### Match Validation

- `teamA`: required, trimmed, non-empty
- `teamB`: required, trimmed, non-empty
- `teamA !== teamB`
- `map`: must be one of the 7 active maps
- `score`: required, normalized to `number-number`
- `note`: optional, trimmed, capped length

Recommended score regex:

```txt
^\d{1,2}\s*-\s*\d{1,2}$
```

### Auth Validation

- username required
- password required
- compare with bcrypt hash from MongoDB

### Veto Validation

- format must be one of `bo1`, `bo3`, `bo5`
- next action must match allowed step in state machine
- chosen map must still be available
- side must be `atk` or `def`

## Suggested Project Structure

```txt
app/
  api/
    admin/
      login/
        route.ts
    matches/
      route.ts
      [id]/
        route.ts
    veto/
      route.ts
      [id]/
        route.ts
  admin/
    add-match/
      page.tsx
    map-select/
      page.tsx
  page.tsx
components/
  admin-login-form.tsx
  add-match-form.tsx
  match-history-list.tsx
  veto-board.tsx
  veto-setup-form.tsx
lib/
  auth.ts
  mongodb.ts
  map-pool.ts
  validators.ts
  veto-engine.ts
scripts/
  seed-admin.ts
types/
  match.ts
  veto.ts
docs/
  mvp-implementation-plan.md
assets/
  bind.webp
  breeze.webp
  fracture.webp
  haven.webp
  lotus.webp
  pearl.webp
  split.webp
```

## Core Modules

### `lib/mongodb.ts`

- creates and reuses the MongoDB connection
- safe for Vercel route handlers

### `lib/auth.ts`

- verify admin password
- sign short-lived token
- verify token for protected APIs

### `lib/map-pool.ts`

- exports fixed active map pool
- exports map metadata and image paths

### `lib/veto-engine.ts`

- central state machine for `bo1`, `bo3`, `bo5`
- computes current step
- validates action
- returns updated session state

### `lib/validators.ts`

- zod schemas for auth, matches, and veto actions

## Functional MVP Screens

### `/`

- title
- match history list
- newest first
- no admin links

### `/admin/add-match`

- login form if not authenticated in memory
- match form
- existing match list
- edit button
- delete button

### `/admin/map-select`

- login form if not authenticated in memory
- series setup form
- live veto board
- action timeline
- selected maps and side choices

## Implementation Order

### Phase 1: Project Setup

1. Initialize Next.js app with TypeScript
2. Install MongoDB, bcrypt, jose, zod
3. Add env handling
4. Add Mongo connection utility

### Phase 2: Auth Foundation

1. Create `admins` schema assumptions
2. Build `scripts/seed-admin.ts`
3. Build `POST /api/admin/login`
4. Build in-memory admin gate component

### Phase 3: Match History

1. Create `GET /api/matches`
2. Create `POST /api/matches`
3. Create `PATCH /api/matches/[id]`
4. Create `DELETE /api/matches/[id]`
5. Build `/`
6. Build `/admin/add-match`

### Phase 4: Veto Engine

1. Implement fixed map pool module
2. Implement veto state machine
3. Create `POST /api/veto`
4. Create `GET /api/veto/[id]`
5. Create `PATCH /api/veto/[id]`
6. Build `/admin/map-select`

### Phase 5: Hardening

1. Input validation
2. Empty states
3. Loading and error states
4. Basic confirmation before delete
5. Manual testing on all three veto formats

### Phase 6: UI Pass Later

- pure Valorant visual language
- map cards from provided assets
- stronger typography and layout
- motion and polish

## Testing Checklist

### Auth

- valid login succeeds
- wrong password fails
- refresh removes access

### Matches

- create match works
- edit match works
- delete match works
- `/` shows newest first
- no link to admin routes on `/`

### Veto

- BO1 completes correctly
- BO3 completes correctly
- BO5 completes correctly
- invalid repeated map selection is blocked
- side selection only appears on the correct steps
- completed veto session is saved in MongoDB

## Known MVP Tradeoffs

- No persistent login by design
- Only one admin account
- No public display for stored veto history yet
- Score is stored as a simple display string, not full round-by-round stats
- Route visibility is hidden in UI, not secret from anyone who knows the URL

## Next Step

After this doc is approved, implementation should start in this order:

1. Next.js scaffold
2. MongoDB connection and admin seed flow
3. Match history CRUD
4. Veto engine and veto route
5. Basic functional pages
6. Valorant UI pass later
