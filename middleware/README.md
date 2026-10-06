# Willow quick-commerce middleware

Sandbox orchestration layer for **Zepto / Blinkit / Swiggy Instamart** partner-shaped APIs.

This service does **not** scrape consumer apps and does **not** place real orders. Wire official partner credentials here when you have them; until then every adapter returns PIN-aware sandbox stock.

```bash
node --env-file-if-exists=.env.local server.mjs
```

`.env.local` is git-ignored. For the AI routes (`/agent` and the Learning coach) put `AI_PROVIDER=ollama` there; with no key it calls the local Ollama app at `http://localhost:11434`, and `AI_MODEL` picks the model (`gpt-oss:120b-cloud` runs on Ollama Cloud's free tier through your ollama.com sign-in; `qwen3:latest` runs fully offline). `AI_API_KEY` switches to Ollama Cloud directly, and `AI_PROVIDER` can also be `groq`, `gemini`, or `xai`.

Listens on `http://127.0.0.1:8790`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Adapter status |
| GET | `/catalog?q=&pin=` | Catalog search |
| POST | `/auto_order` | Map needs → SKUs, quote all apps, pick a winner |
| POST | `/orders` | Persist a sandbox cart/order |
| GET | `/orders/:id` | Status |
| POST | `/webhooks/order` | Status callback (`confirmed` → `packed` → `rider` → `delivered`) |
| POST | `/agent` | Ask Willow helper (`{"text":"..."}` → one allowlisted action). Same handler as the `willow-agent` Supabase Edge Function; needs the `AI_*` settings above |

Point the Vite app at it with `VITE_QC_API=http://127.0.0.1:8790`. The UI still works without this process (local sandbox engine).

For a deployed middleware instance, set `WILLOW_JWT_SECRET` to require HS256 bearer tokens on partner and coaching endpoints. Set `WILLOW_WEBHOOK_SECRET` to protect order callbacks. These are transitional controls until the app is connected to a managed identity provider and database; never use demo credentials or commit either secret.
