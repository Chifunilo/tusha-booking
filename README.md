Tusha Booking — a [Next.js](https://nextjs.org) hotel/event booking frontend. This app has no database or server secrets of its own — it talks to [tusha-booking-backend](../tusha-booking-backend) (Express + Prisma) for everything: auth, data, and Cloudinary uploads.

## Running with Docker (recommended)

1. Start the backend first — see its README. It needs to be reachable before this app can do anything useful.
2. Copy the env file and fill in `JWT_SECRET` (it must be the **exact same value** as the backend's `JWT_SECRET` — this app verifies auth cookies locally in `middleware.ts` without calling the backend):
   ```bash
   cp .env.example .env
   ```
3. Start the app:
   ```bash
   docker compose up --build
   ```
4. Open [http://localhost:3000](http://localhost:3000).

`NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000`) is baked into the client bundle at build time via a Docker build arg — see `docker-compose.yml` / `Dockerfile` if you need to point at a different backend URL.

## Running locally without Docker

```bash
cp .env.example .env   # JWT_SECRET must match the backend's exactly
npm install
npm run dev
```

## Auth model

Login/signup happen on the backend, which sets an HttpOnly `auth_token` cookie. This app's own `middleware.ts` verifies that cookie locally (no network call) to gate protected pages (`/booking`, `/payment`, `/profile-page`), which only works because both apps share the same `JWT_SECRET`. All other data fetching goes to the backend directly via `fetch(`${NEXT_PUBLIC_API_URL}/api/...`, { credentials: 'include' })` — see `lib/api.ts`.

This relies on the cookie being a host-only cookie (no `Domain` set) shared between `localhost:3000` and `localhost:4000` in dev. In production, if frontend and backend end up on different domains (not just different ports), see the backend README's note on cookie domain configuration.

## Environment variables

See `.env.example` for the full list.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [tusha-booking-backend](../tusha-booking-backend) — the API this app depends on
