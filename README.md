# OrbitalSlots — Launch Slot Brokerage Platform

A production-ready MVP for discovering, reserving, and managing rideshare launch opportunities.

## Tech Stack

- **Framework**: Next.js 14 App Router (TypeScript)
- **Database**: Supabase Postgres via Prisma ORM
- **Auth**: Supabase Auth (email/password + magic link)
- **Payments**: Stripe (PaymentIntent with manual capture)
- **UI**: Tailwind CSS + shadcn/ui (dark-mode first)
- **Deploy**: Vercel + Supabase

## Roles

| Role | Access |
|------|--------|
| `BUYER` | Browse opportunities, manage payloads, submit/track requests, authorize deposits |
| `PROVIDER` | Create/manage launch opportunities, view inbound requests |
| `ADMIN` | Full access: triage, match, capture/void/refund, audit log |

## Local Development

### Prerequisites
- Node.js 18+
- Supabase project
- Stripe account

### 1. Clone and install

```bash
git clone <repo>
cd SpaceMarket
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required variables:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database setup

```bash
# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed with sample data
npm run db:seed
```

### 4. Supabase Auth setup

1. In Supabase dashboard → Authentication → Settings:
   - Enable email/password sign-ins
   - Enable magic link sign-ins
   - Set Site URL to `http://localhost:3000`
   - Add `http://localhost:3000/auth/callback` to Redirect URLs

### 5. Stripe webhook setup (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`.

### 6. Run development server

```bash
npm run dev
```

Visit http://localhost:3000

## Deployment (Vercel + Supabase)

1. Push to GitHub
2. Connect repo to Vercel
3. Add all environment variables in Vercel dashboard
4. Run migrations against production DB:
   ```bash
   DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy
   ```
5. Set up Stripe webhook endpoint: `https://your-app.vercel.app/api/webhooks/stripe`

## Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@orbitalslots.com | Set in Supabase Auth |
| Buyer | buyer@apexsat.com | Set in Supabase Auth |
| Provider | provider@orbexpress.com | Set in Supabase Auth |

> Note: Seed creates DB records with placeholder Supabase IDs. To test with real auth, create these users in Supabase Auth console and update `supabaseId` values in the DB.

## Routes

### Public
- `/` — Landing page

### Auth
- `/login` — Sign in (password + magic link)
- `/signup` — Create account (BUYER or PROVIDER role)

### Buyer (`/app/...`)
- `/app` — Dashboard
- `/app/opportunities` — Browse launch slots (filter by orbit/vehicle/mass)
- `/app/opportunities/[id]` — Slot detail + reserve CTA
- `/app/payloads` — Payload CRUD
- `/app/requests` — Request list + status tracking
- `/app/requests/[id]` — Request detail with messages and deposit step
- `/app/requests/[id]/payment` — Stripe deposit authorization
- `/app/notifications` — Notification inbox with mark-read

### Provider (`/provider/...`)
- `/provider` — Provider dashboard
- `/provider/opportunities` — Opportunity management
- `/provider/requests` — Inbound payload candidates

### Admin (`/admin/...`)
- `/admin` — Mission control triage dashboard
- `/admin/requests` — All requests with status filters
- `/admin/requests/[id]` — Full triage: status transitions, matching, notes, follow-ups
- `/admin/opportunities` — All opportunities
- `/admin/providers` — Provider verification
- `/admin/audit` — Audit log
- `/admin/import` — JSON bulk import

## Stripe Payment Flow

1. Admin marks request as "Ready for Deposit"
2. Buyer sees deposit CTA on request detail page
3. Buyer clicks → `/api/payments/create-intent` creates PaymentIntent (manual capture)
4. Buyer completes Stripe Payment Element → authorization hold placed
5. Stripe webhook updates payment status to `AUTHORIZED`, request to `DEPOSIT_AUTHORIZED`
6. Admin can **Capture** (charge), **Void** (cancel authorization), or **Refund** (after capture)

## Data Model

See `prisma/schema.prisma` for the full schema with 14 models:
User, Organization, OrganizationMember, ProviderProfile, BuyerProfile, Payload, LaunchOpportunity, ReservationRequest, Match, MessageThread, Message, AdminNote, FollowUp, Payment, Notification, AuditLog
