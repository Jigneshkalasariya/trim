# AI Usage

## Tools

- **Cursor** — most of the code (server, client, components)
- **Claude** — planning and debugging help

## What AI did well

- Express/Mongoose setup and route boilerplate
- MongoDB aggregation for analytics (`clicksPerDay`, referrer breakdown)
- shadcn/ui wiring (Dialog, Table, forms)

## What AI got wrong

- **Recharts chart** — used `type="monotone"`, so one day of clicks looked like a smooth ramp. Fixed with `type="step"` and filling missing days with zero.
- **Analytics `originalUrl`** — API response was missing the field until the server was rebuilt; added a client fallback in the meantime.

## What I wrote myself

- README design decisions (nanoid, 302, per-click storage, indexes) — I chose these before coding and wanted to own the reasoning for review.

