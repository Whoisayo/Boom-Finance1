# Boom Finance Backend

A minimal personal-use backend: an AI Coach proxy (real, tested) and an Open Banking connection (written correctly, untested — see below). Built for **one person to deploy one copy of this for themselves** — see the earlier discussion on why that model, not a shared multi-user service.

## What's actually verified vs. not

| Piece | Status |
|---|---|
| Server, routes, data persistence | **Tested** — ran it, hit every endpoint with curl, confirmed data survives a full restart |
| **Frontend ↔ backend wiring** | **Tested end-to-end** — ran the real backend alongside the real frontend (via a headless DOM with real network access), made an actual investment deposit through the UI, confirmed it persisted to the backend, then loaded the frontend completely fresh and confirmed it picked up the persisted change. This is the real round trip, not a mock. |
| AI Coach → Claude API proxy | **Tested against the real API** — confirmed the request reaches `api.anthropic.com` and gets a properly-formatted response back (verified with a dummy key). Frontend correctly falls back to an offline demo response with a clear disclaimer if the backend or API key isn't available. |
| Open Banking (Enable Banking) | **Written, not tested** — this sandbox has no network route to enablebanking.com. Correct against their documented API shape, but the JWT signing step is a stub (see `services/bankService.js`) and needs real work before it functions |

## Connecting the frontend to your deployed backend

The frontend (`boom_finance_os_vision.html`) has one line near the top of its script that controls this:

```js
const API_BASE_URL = 'http://localhost:3001';
```

Once you've deployed this backend (see below), change that line to your real backend URL, e.g. `https://your-app.onrender.com`. That's the only change needed — every data-loading and data-saving call in the frontend already goes through this constant.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in:
   - `ANTHROPIC_API_KEY` — from https://console.anthropic.com. Required for the AI Coach to actually respond.
   - `ENABLE_BANKING_APP_ID` / `ENABLE_BANKING_JWT` — from https://enablebanking.com, once you've registered. Required for bank sync. The Coach and data endpoints work fine without these.
3. Run it:
   ```
   npm start
   ```
4. Check it's alive: open `http://localhost:3001/health`

## What's still genuinely missing before this is "done"

1. **Enable Banking JWT generation.** Their API requires RS256-signed, short-lived JWTs per request — `.env`'s `ENABLE_BANKING_JWT` is currently a placeholder for a static token, which isn't how their auth actually works long-term. Real implementation needs a small JWT-signing routine using the private key you get when registering your application with them.
2. **Frontend isn't wired to call this yet.** The prototype still holds its data in JavaScript variables in the browser. The next step is replacing those in-memory arrays with calls to `GET /api/data/state` on load and `PUT /api/data/state` whenever something changes — the routes are ready, the frontend just isn't calling them yet.
3. **No encryption at rest for bank tokens.** `bankConnection` in `data/store.json` stores whatever Enable Banking's session response contains, in plain JSON. Your own Security & Compliance doc calls for encrypted token storage — worth doing before connecting a real bank account, not after.
4. **Deploy somewhere with HTTPS.** Both Enable Banking's OAuth redirect and general good practice require it. Render or Railway's free/hobby tiers both give you this automatically the moment you deploy — no extra setup needed on your end for that part specifically.

## Deploying (Render example)

1. Push this folder to a GitHub repo (private is fine — this has your setup, not your secrets, since `.env` is gitignored).
2. On Render: New → Web Service → connect the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add your environment variables (`ANTHROPIC_API_KEY`, etc.) in Render's dashboard, not in the repo.
5. Render gives you a `https://your-app.onrender.com` URL automatically — that's your backend's real address, use it wherever the frontend currently expects `http://localhost:3001`.

## API reference

- `GET /health` — liveness check
- `GET /api/data/state` — returns all financial data
- `PUT /api/data/state` — replaces all financial data (frontend sends its current in-memory state)
- `POST /api/coach/chat` — `{ message, history? }` → `{ reply }`, grounded in real data from the store
- `GET /api/bank/status` — `{ configured, connected }`
- `GET /api/bank/banks?country=GB` — list supported banks
- `POST /api/bank/connect` — `{ bankName, country, redirectUrl }` → `{ url }` to redirect the user to
- `GET /api/bank/callback?code=...` — the bank redirects here after auth
- `GET /api/bank/transactions/:accountId` — fetch transactions for a connected account
