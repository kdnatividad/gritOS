# gritOS

**Run your life on discipline.**

gritOS is a no-BS workout tracking app built as a personal operating system for consistency. Log sessions, track progress, and execute daily — without relying on motivation.

**Live:** [os-beta.vercel.app](https://os-beta.vercel.app)

---

## Features

- **Exercise library** — default exercises across Push / Pull / Legs / Core / Cardio, with add, rename, and delete
- **Workout plans** — create named plans (e.g. "Push Day"), add exercises, and start sessions from them
- **Session logging** — log sets with weight, reps, and notes; view per-exercise set history inline
- **Plates keyboard** — tap plates to build a barbell weight; both sides auto-calculated; lbs and kg support
- **Dashboard** — weekly activity chart, streak, total sessions/sets, top exercise, recent sessions
- **Mobile-first** — full bottom nav on mobile, responsive layout down to 430px, no horizontal overflow

---

## Philosophy

> Execution over motivation.

gritOS is designed for people who train with intent. No gamification. No noise. Just a system that helps you show up, do the work, and improve.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | TailwindCSS 4 + CSS custom properties |
| State | Zustand 5 |
| ORM | Prisma 5 |
| Database | PostgreSQL (Vercel Postgres / Supabase) |
| Charts | Recharts 3 |
| Deployment | Vercel |

---

## Project Structure

```
app/
  page.tsx               # Dashboard
  layout.tsx             # Root layout — sidebar + bottom nav
  global.css             # Design tokens, global styles, responsive breakpoints
  workouts/page.tsx      # Exercises, plans, and session logger
  analytics/             # Coming soon
  settings/              # Coming soon
  api/
    exercises/           # GET all, POST create
    exercises/[id]/      # PATCH rename, DELETE
    plans/               # GET all, POST create
    plans/[id]/          # DELETE
    plans/[id]/items/    # POST add exercise, DELETE remove
    sessions/            # POST start session
    sets/                # POST log set

components/
  layout/
    Sidebar.tsx          # Desktop sidebar nav
    BottomNav.tsx        # Mobile fixed bottom nav
  workouts/
    WorkoutLogger.tsx    # Active session logger with plates keyboard
    ExerciseOverview.tsx # Per-exercise history charts

store/
  useWorkoutStore.ts     # Active session sets (Zustand)
  usePrefsStore.ts       # Unit preference + increment (Zustand, persisted)

hooks/
  useIsMobile.ts         # Client-side 640px breakpoint hook

prisma/
  schema.prisma          # PostgreSQL schema
```

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/kdnatividad/gritOS.git
cd gritOS
npm install
```

### 2. Set up the database

Create a PostgreSQL database (local, [Supabase](https://supabase.com), or [Neon](https://neon.tech)) and add the connection string to `.env`:

```env
DATABASE_URL="postgresql://user:password@host:5432/gritos"
```

### 3. Run migrations

```bash
npx prisma migrate deploy
```

### 4. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

1. Push to GitHub and import the repo in Vercel
2. Add `DATABASE_URL` in **Project Settings → Environment Variables**
3. The build command runs migrations automatically on every deploy:
   ```
   prisma generate && prisma migrate deploy && next build
   ```

---

## Roadmap

- [x] Workout session logging
- [x] Exercise library (add, rename, delete)
- [x] Workout plans
- [x] Plates keyboard
- [x] Dashboard with weekly chart and streak
- [x] Mobile bottom nav + responsive layout
- [ ] Analytics page
- [ ] Settings page
- [ ] Offline support

---

## License

MIT

---

**Consistency is the system.**
