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
| `npm run icons` | Generate PWA / Android launcher icons |
| `npm run android:apk` | Build Fire Stick APK into `downloads/willow-movies.apk` |

Copy `.env.example` to `.env`. Values are validated with Zod in `src/env.ts`.

## Install as an app (laptop, phone, Fire Stick)

Anyone can open **Get the app** without signing in: [/#/get-app](https://raviacn95.github.io/child-management-system/#/get-app).

- **Laptop / Chromebook (Chrome or Edge):** the site asks to **Install app**. Willow then opens in its own window and stays in sync with this live site (PWA auto-update).
- **iPhone / iPad:** Share → Add to Home Screen.
- **Fire Stick / Android TV:** download `willow-movies.apk` from the same page. Fire OS will prompt **Install**. The APK is a thin shell that loads the live site, so movies and logins stay current.

Direct APK URL after each site deploy:

`https://raviacn95.github.io/child-management-system/downloads/willow-movies.apk`

On a Stick, the Downloader app can fetch that address if Silk blocks the file. Enable apps from unknown sources if Fire OS asks.

Each GitHub Pages deploy keeps the **previous live build** at `releases/previous/`. If a new release crashes on boot, Willow switches to that last stable app instead of leaving people on a broken screen.


Local APK (optional):

```bash
cd app
npm run android:apk
```


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

## Family meal planner

`Meals` (and Grow → Meal plan) maps age + BMI percentile to pediatric nutrient targets, a shared Indian plate, growth scores (not calorie ceilings), and a grocery list.

- Catalog + JSON Schema: `src/data/meal-planner.json`, `src/data/meal-planner.schema.json`
- Engine: `src/features/meals/plan.ts` (`POST /api/meal-planner/plan`)
- Photo/chat demo recognizer: `src/features/meals/recognize.ts`
- Cook once, assign portions per child; allergen + vegetarian/Jain/dairy-free filters

## Horizon activities (15)

`Grow at home → Horizons` (and **10 skills → Activity**) maps Piaget / Montessori / WHO play into daily tasks by age (2–5, 6–9, 10–13) and BMI percentile overlay.

- Catalog + schema: `src/data/horizons.json`, `src/data/horizons.schema.json`
- Request schema: `src/data/horizons-plan-request.schema.json`
- Engine: `src/features/grow/horizons.ts` (`POST /api/horizons/plan`)
- Home panel: **Today’s horizons**

## Parent growth feed (33–50, India)

`Parent feed` is a personalized mix of movies, learning, parenting science, and finance (15 curated official links). Ranked by impact score + interests/goals/time/language + thumbs.

- Catalog: `src/data/parent-feed.json` + `parent-feed.schema.json`
- Engine: `src/features/parent-feed/plan.ts` (`POST /api/parent-feed/plan`)
- Daily playlist + weekly deep dive. Not investment or medical advice. No piracy.

## Movies & series (100, 50+ channels)

`Movies` (and Parent feed) serve a **dynamic 100-title shelf** ranked by critic / audience / YouTube / Instagram heat, with official watch-search links (Prime, Google Play Movies, SonyLIV, JioHotstar, ManoramaMAX, Netflix, JustWatch, and 50+ others). Malayalam cinema is first-class. Shuffle reseeds the ranker.

- Schema: `src/data/movie-recommendations.schema.json`
- Platforms: `src/data/streaming-platforms.json` (add a storefront = one JSON object)
- Titles: `src/data/movies-data.ts` (append a compact row)
- Engine: `GET|POST /api/movies/recommend` (`limit` 100, `seed` reshuffles)

## Stay signed in + OTT vault + Fire Stick

Willow login now lasts **90 days** on this device (`Keep me signed in`). Each Willow user has **My OTTs**: save Prime / Netflix / SonyLIV / Hotstar emails (reminders only). Passwords stay in those official apps on the Stick.

**TV tonight** (`/#/tv`) is the living-room shelf that replaces Google Play Movies. Watch buttons open the native Fire TV app.

Install from the website (no Android Studio required): [/#/get-app](https://raviacn95.github.io/child-management-system/#/get-app). On the Stick find **Willow Movies** on the Apps row. Turn on **Settings → Fire TV / living room**.

## Erotic shelf (18+, 150 titles)

Parent/director only, behind an age gate (`/#/erotic`). Same recommendation schema (`shelf: "erotic"`), always 150 titles ranked by erotic heat + critics + YouTube/Instagram. Official storefront links only. Not shown to teachers, children, or on Home. Do not open this on a classroom tablet.
