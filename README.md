# Valorant Circuit

🎮 A polished Next.js tournament controller for small Valorant events.

Valorant Circuit is designed to help organizers run match series, manage locker-room vetoes, and track bracket progress with a clean public dashboard.

---

## 🚀 What this app delivers

- **Public tournament home** with series, brackets, and upcoming matches
- **Team pages** that show all series for a given squad
- **Admin login** with a lightweight session flow
- **Series creation** and manual matchup entry
- **Map veto workflow** with pool selection and team picks
- **Score entry with Valorant validation** so only valid final map results are accepted
- **Single-elimination bracket control** with winner advancement and seeded matchups

---

## 🧠 Core experience

### Public side

- `/` — tournament overview, upcoming matches, and bracket summary
- `/team/[slug]` — team-specific pages and history
- `/brackets/[id]` — live bracket viewing for event fans

### Admin side

- `/admin` — admin control center for series and bracket tools
- `/admin/brackets` — bracket hub to create, edit, and lock bracket events
- `/admin/series/[id]` — detailed series workspace for vetoing maps and entering results

---

## 🧩 Key features

- **Bracket engine** lives in `lib/brackets.ts` and generates bracket state from seed data
- **Visual bracket rendering** uses `@g-loot/react-tournament-brackets`
- **Series logic** is centralized in `lib/series.ts` with veto flow, score derivation, and status rules
- **Score validation** is enforced in `lib/validators.ts` and blocks invalid Valorant scorelines
- **Admin auth** is handled via `app/api/admin/login/route.ts`, with token issuance for protected admin actions

---

## 🧪 Tech stack

- Next.js 16
- React 19
- TypeScript
- MongoDB
- Zod
- Tailwind CSS v4
- `@g-loot/react-tournament-brackets`
- `bcryptjs`, `jose`, `react-svg-pan-zoom`, `styled-components`

---

## ⚙️ Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

```env
MONGODB_URI=
MONGODB_DB_NAME=
AUTH_JWT_SECRET=
```

3. Run the dev server

```bash
npm run dev
```

4. Build for production

```bash
npm run build
```

---

## 🧑‍💻 Admin setup

Seed the admin account before using the admin UI:

```bash
npm run seed:admin
```

Then log in through the admin login form and manage:

- series matchups
- veto progress
- result entry
- bracket advancement

---

## ✅ Valid Valorant score rules

Allowed final scores:

- regulation: `13-0` through `13-11`
- overtime: `14-12`, `15-13`, `16-14`, etc.

Rejected scores include:

- ties like `13-13`
- impossible endings like `13-12` or `12-10`
- empty or malformed score strings

---

## 📁 Project layout

- `app/` — Next.js pages and API route handlers
- `components/` — UI components and admin interfaces
- `lib/` — core business logic, DB helpers, validators, and bracket utilities
- `types/` — shared TypeScript models for series, brackets, and veto logic

---

## 📝 Notes

- The public feed is mostly server-rendered and uses dynamic data loading
- Brackets are seeded to the next power of two and support BYEs automatically
- Series status is derived from veto state and result completion

Enjoy running events with Valorant Circuit. 👑
