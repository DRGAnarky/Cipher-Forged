# Cipher Forged

## Overview
Cipher Forged is a cipher-based learning game with authentication, game modes (Endless), story tutorials, 20 achievements, profile cosmetics, and a coin/points economy.

## Tech Stack
- Frontend: React + TypeScript + Tailwind CSS + Framer Motion
- Backend: Node.js + Express (TypeScript)
- Database: PostgreSQL with Drizzle ORM
- Auth: Replit Auth (OpenID Connect)

## Project Architecture
```
client/src/
  pages/         - Welcome, MainApp, Endless, Story, Profile
  components/    - ThemeProvider, DecryptAnimation, DailyLoginModal, AvatarDisplay, SigilIcon
  hooks/         - use-auth.ts, use-toast.ts
  lib/           - queryClient, cipher-logic, sigils, auth-utils, utils
server/
  routes.ts      - All API endpoints
  storage.ts     - DatabaseStorage implementing IStorage
  cipher-logic.ts - Caesar cipher encrypt/decrypt/generateChallenge/checkAnswer
  achievement-checker.ts - Achievement condition checking
  seed.ts        - Database seeding (ciphers, achievements, cosmetics, story content)
  db.ts          - Drizzle database connection
  replit_integrations/auth/ - Replit Auth integration
shared/
  schema.ts      - All Drizzle table definitions
  models/auth.ts - Users and sessions tables
```

## Key API Routes
- GET /api/me - Current user profile
- GET /api/ciphers - All ciphers with unlock status
- POST /api/ciphers/:id/unlock - Unlock cipher via coins or token
- POST /api/daily/claim - Claim daily login reward
- GET /api/story/:cipherId/:chapter - Story content
- POST /api/story/:cipherId/:chapter/:step/submit - Submit story answer
- POST /api/game/endless/generate - Generate endless challenge
- POST /api/game/endless/submit - Submit endless answer
- GET /api/profile - Profile with cosmetics
- POST /api/profile/select-title|avatar|frame - Select cosmetics
- GET /api/achievements - All achievements with unlock status

## Economy
- New users: 100 coins, 1 free unlock token
- +10 points per correct answer, every 50 points = 15 coins
- Daily login: +50 coins, streak bonuses at 7/14/21/28 days
- Cipher unlock: 150 coins or 1 token

## Recent Changes
- Initial build: Full MVP with auth, game modes, story, achievements, cosmetics
