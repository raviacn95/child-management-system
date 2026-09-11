# Willow — production app skeleton

React + TypeScript + Vite childcare OS. This folder is the product.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Demo password is `demo`.

| Role | Email |
|------|--------|
| Director | `director@willow.care` |
| Teacher | `teacher@willow.care` |
| Parent | `parent@willow.care` |

## Scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Vite + HMR (Tailwind, MSW in development) |
| `npm run build` | Typecheck, minify, PWA, gzip/brotli |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright (install browsers first) |
| `npm run lint` / `lint:eslint` | Oxlint + ESLint a11y |
| `npm run analyze` | Bundle visualizer → `dist/stats.html` |
| `npm run audit:deps` | `npm audit` |

Copy `.env.example` to `.env`. Values are validated with Zod in `src/env.ts`.

## 35-feature layout

```
app/
  edge/recommend.ts          # 21. Edge function for recommendations
  e2e/                       # 13. Playwright
  public/offline.html        # 10. PWA fallback
  src/
    api/                     # 14. react-query + Zod client; graphql stub
    app/prefetch.ts          # 6/21. route prefetch
    components/              # Error boundary, registry, theme toggle
    data/learning-channels.ts
    data/recommendation-schema.json
    features/
      auth/                  # 13/14. session JWT-shaped + RHF login
      learning/              # YouTube age-band pipeline
    i18n/                    # 17. en + hi
    lib/                     # rbac, audit, flags, csp, vitals, realtime
    mocks/                   # 20. MSW handlers
    pages/                   # lazy-loaded routes
    test/                    # 11/12. Vitest + Testing Library setup
    theme/                   # 18. light/dark/system
    env.ts                   # 4. typed env
  vite.config.ts             # aliases, PWA, compression, imagetools, analyzer, CSP
  eslint.config.js           # 2/15. Prettier + jsx-a11y
  playwright.config.ts
```

Optional later: `npx storybook@latest init` (stories live beside components), Sentry DSN in `VITE_SENTRY_DSN`, Apollo via `src/api/graphql/client.ts`.

## Learning recommendation pipeline

`Learning → Watch together` maps child age, stage, interests, and allergies to a curated YouTube pack (2–5 / 5–8 / 8–12). Output is JSON you can copy into Willow Mart.

Director **Home** loads packs from `GET /api/learning-packs` (MSW in dev, local JSON fallback).

- Catalog: `src/data/learning-packs.json`
- JSON Schema: `src/data/learning-packs.schema.json`
- Service: `src/features/learning/learningPacks.ts`
- Autoplay stays off on outbound links
- YouTube Kids deep links when the channel supports them
- India pack includes the Anekal preschool tip
