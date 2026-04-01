# Valorant Sangam

Valorant Sangam is a Next.js tournament control app for running small Valorant events. It currently covers:

- public tournament home with series, upcoming maps, team pages, and brackets
- admin login with short-lived in-memory access
- series creation
- series-integrated map veto flow
- ordered map result entry with Valorant score validation
- single-elimination bracket management

## Stack

- Next.js 16
- React 19
- TypeScript
- MongoDB
- Zod
- Tailwind CSS v4

## Current Architecture

### Public routes

- `/`
  Shows all series, upcoming played-next maps, and brackets.
- `/team/[slug]`
  Shows all series for a given team.
- `/brackets/[id]`
  Shows the public bracket view.

### Admin routes

- `/admin`
  Main admin hub for series.
- `/admin/series/[id]`
  Series workspace for map pool setup, veto actions, and result entry.
- `/admin/brackets`
  Bracket hub.
- `/admin/brackets/[id]`
  Bracket workspace for seeding and winner advancement.

### API routes

- `POST /api/admin/login`
- `GET, POST /api/series`
- `GET, DELETE /api/series/[id]`
- `POST, PATCH /api/series/[id]/veto`
- `POST /api/series/[id]/results`
- `PATCH, DELETE /api/series/[id]/results/[order]`
- `GET /api/team/[slug]`
- `GET, POST /api/brackets`
- `GET, PATCH, DELETE /api/brackets/[id]`
- `PATCH /api/brackets/[id]/matches/[round]/[match]`
- `GET /api/health`

## Brackets

Brackets are single elimination and use two layers:

- `lib/brackets.ts` computes bracket state from `teams` plus winner selections
- `@g-loot/react-tournament-brackets` handles the visual layout engine

This keeps progression logic separate from rendering math.

## Valorant Score Rules

The app accepts only valid final Valorant map scores:

- regulation: `13-0` through `13-11`
- overtime: `14-12`, `15-13`, `16-14`, and so on

It rejects ties and impossible endings like `13-12`, `12-10`, or `0-0`.

## Environment Variables

Create `.env.local` or `.env` with:

```env
MONGODB_URI=
MONGODB_DB_NAME=
AUTH_JWT_SECRET=
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Run checks:

```bash
npm run lint
npm run build
```

## Admin Setup

Seed the admin user:

```bash
npm run seed:admin
```

The admin token is returned by the login route and kept only in client memory. Refreshing the admin page logs the operator out.

## Data Model Notes

### Series

A series stores:

- `teamA`, `teamB`
- team slugs and `pairKey`
- `format`
- integrated veto state
- ordered results

`pairKey` is retained for grouping and lookups, but it is no longer treated as globally unique. Rematches are allowed.

### Brackets

A bracket stores:

- title
- team count and bracket size
- seeded team list
- winner selections

The round tree is derived on read instead of being stored as mutable nested match documents.

## Cleanup Status

Legacy standalone match-history and veto-session routes were removed. The app now uses the series workspace as the single source of truth for veto and results.
