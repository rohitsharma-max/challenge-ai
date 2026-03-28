# ⚡ Streakify

A gamified habit-building web app. One personalized challenge every day — complete it, earn XP, build your streak.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, JavaScript) |
| Database | PostgreSQL |
| ORM | **Prisma** |
| Auth | JWT via `jose` in HttpOnly cookies |
| Styling | CSS Modules + custom design system |
| Animations | CSS keyframes + `canvas-confetti` |

---

## ⚡ Quick Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Install
```bash
cd daily-ai-challenge
npm install        # also runs `prisma generate` via postinstall
```

### 2. Configure environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/daily_ai_challenge
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
```

### 3. Create database
```sql
-- In psql or pgAdmin: 
CREATE DATABASE daily_ai_challenge;
```

### 4. Run Prisma migrations + seed
```bash
npm run db:migrate   # Applies schema via Prisma Migrate
npm run db:seed      # Seeds 40+ challenges into the DB
```

### 5. Start
```bash
npm run dev          # → http://localhost:3000
```

---

## 🗄️ Prisma Schema Overview

```
User
 ├── id, name, email, passwordHash
 ├── categories[], difficulty, allowOutdoor
 ├── currentStreak, bestStreak, totalXp
 ├── theme, lastRestoreDate
 └── relations: UserChallenge[], StreakRestore[]

Challenge (seeded pool)
 ├── title, description, category, difficulty
 ├── isOutdoor, xpReward, estimatedMinutes
 └── relations: UserChallenge[]

UserChallenge (one per user per day)
 ├── userId, challengeId, challengeDate
 ├── status (pending | completed | missed | restored)
 ├── xpEarned, proofImageUrl, completedAt
 └── @@unique([userId, challengeDate])

StreakRestore
 └── userId, xpSpent, restoredDate
```

---

## 📡 API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/onboarding` | Save preferences |
| GET | `/api/dashboard` | Today's challenge + stats |
| POST | `/api/challenges/complete` | Complete challenge (+ optional proof upload) |
| POST | `/api/challenges/restore` | Restore missed streak (costs 100 XP) |
| GET | `/api/history` | Challenge history |
| GET | `/api/profile` | Profile + stats |
| PATCH | `/api/profile` | Update preferences |

---

## 🎮 XP & Streak Rules

| Action | XP |
|--------|----|
| Easy challenge | +30 XP |
| Medium challenge | +60 XP |
| Hard challenge | +120 XP |
| Streak restore | −100 XP |

- **Level up** every 500 XP
- **Miss a day** → streak resets to 0
- **Restore window** → within 24 hours of a miss

---

## 🛠️ Commands

```bash
npm run dev            # Start dev server
npm run build          # Production build
npm run db:migrate     # Run Prisma migrations
npm run db:seed        # Seed challenge pool
npm run db:studio      # Open Prisma Studio (visual DB browser)
```

---

## 📁 Project Structure

```
prisma/
├── schema.prisma          # Prisma data model
└── seed.js                # Challenge pool seeder

src/
├── app/
│   ├── (auth)/            # login, signup
│   ├── (app)/             # dashboard, history, profile
│   ├── onboarding/
│   └── api/               # all API routes
├── components/providers/
│   └── ThemeProvider.js
└── lib/
    ├── prisma.js          # Prisma client singleton
    ├── auth.js            # JWT + bcrypt utilities
    └── challenges.js      # All business logic (Prisma queries)
```
