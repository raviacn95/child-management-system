# Willow quick-commerce middleware

Sandbox orchestration layer for **Zepto / Blinkit / Swiggy Instamart** partner-shaped APIs.

This service does **not** scrape consumer apps and does **not** place real orders. Wire official partner credentials here when you have them; until then every adapter returns PIN-aware sandbox stock.

```bash
node server.mjs
```

Listens on `http://127.0.0.1:8790`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Adapter status |
| GET | `/catalog?q=&pin=` | Catalog search |
| POST | `/auto_order` | Map needs → SKUs, quote all apps, pick a winner |
| POST | `/orders` | Persist a sandbox cart/order |
| GET | `/orders/:id` | Status |
| POST | `/webhooks/order` | Status callback (`confirmed` → `packed` → `rider` → `delivered`) |

Point the Vite app at it with `VITE_QC_API=http://127.0.0.1:8790`. The UI still works without this process (local sandbox engine).
