# Trim

URL shortener with click analytics.

- **Server** — Express, TypeScript, MongoDB (`/server`)
- **Client** — React, Vite, Tailwind, shadcn/ui (`/client`)

## Quick start

**Needs:** Node.js 20+, MongoDB running.

```bash
# Terminal 1 — API
cd server
npm install
cp .env.example .env
npm run dev

# Terminal 2 — UI
cd client
npm install
cp .env.example .env
npm run dev
```


| What        | URL                                                        |
| ----------- | ---------------------------------------------------------- |
| Dashboard   | [http://localhost:5173](http://localhost:5173)             |
| API         | [http://localhost:4000/api](http://localhost:4000/api)     |
| Short links | [http://localhost:4000/:code](http://localhost:4000/:code) |


Check the API: `curl http://localhost:4000/api/health`

**Build for production**

```bash
cd server && npm run build && npm start
cd client && npm run build && npm run preview
```

## Environment variables

Both packages include a `.env.example`. Copy it to `.env` and adjust if needed.

`**server/.env**`

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/trim
BASE_URL=http://localhost:4000
CLIENT_URL=http://localhost:5173
```

`**client/.env**`

```env
VITE_API_URL=http://localhost:4000
```

## How it works

1. User creates a link → saved in MongoDB with a 7-char `shortCode`
2. Visitor opens `/:shortCode` → server records a click, redirects with **302**
3. Dashboard reads analytics from click events (grouped in MongoDB aggregations)

## Design choices


| Topic       | Choice                                                           | Why                                                 |
| ----------- | ---------------------------------------------------------------- | --------------------------------------------------- |
| Short codes | 7-char `nanoid` + retry on collision                             | Non-guessable; no counter that leaks volume         |
| Clicks      | One document per click                                           | Flexible analytics; cost is more reads at scale     |
| Indexes     | Unique `shortCode` on urls; `{ shortCode, clickedAt }` on clicks | Fast lookup + time-range queries                    |
| Redirect    | **302**, not 301                                                 | Browsers cache 301; 302 keeps click counts accurate |


## API


| Method | Path                        | Description               |
| ------ | --------------------------- | ------------------------- |
| GET    | `/api/health`               | Health check              |
| POST   | `/api/urls`                 | Create link               |
| GET    | `/api/urls`                 | List links + click counts |
| GET    | `/api/urls/:code/analytics` | Analytics                 |
| GET    | `/:shortCode`               | Redirect + record click   |


