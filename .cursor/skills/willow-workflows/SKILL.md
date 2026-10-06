---
name: willow-workflows
description: Willow-specific rules for phone-to-TV pairing, official streaming links, the movie-list refresh, Willow Coach, the Ask Willow agent, in-app Update versus APK install, Playwright, and GitHub Pages. Use when changing cast pairing, movie or channel open links, the agent, the Android shell, Playwright tests, or a deploy.
---

# Willow workflows

Write prompts for these jobs as identity, steps, and a fixed output. Do not paste another product's system prompt into the repo.

## Pairing

- Phone opens `#/link?c=<topic>.<key>` on the same site the TV is running.
- The TV must Allow. Phone wait is 120s. The TV prompt closes 20s sooner.
- Session material is the pair topic plus both public keys. Do not put a child name, PIN, email, or health note in a pair payload, share link, or log.

## Streaming links

- Official apps only: Netflix, Prime Video, Hotstar, SonyLIV, Apple TV, Zee5, YouTube, Sun NXT.
- A custom app is a name the user typed, plus an optional package and a search link that contains `{q}`. Do not preset an unofficial package or scheme.
- Phone title links name the installed package. TV links stay web links.
- Movie-card aria-label stays `Open ${title}`.

## Movie list

- New titles are refreshed on a schedule by `.github/workflows/movies-feed.yml` onto `gh-pages` `movies-fresh.json`.
- The TMDB key stays in GitHub secrets. Do not commit it or put it in a prompt.
- Leave the list unchanged when the fetched titles match the live file.

## Willow Coach

- The model receives only an age band, an allowlisted interest, a country code, and the module.
- A reply that repeats the instructions, or that includes medical details, contact details, or sexual content about a child, is withheld.

## Ask Willow agent

- The device parser in `app/src/features/agent/localIntent.ts` runs first. Only text it cannot place goes to the `willow-agent` Supabase function, which calls Grok.
- The request body is exactly `{"text": ...}`. Text with a roster name, a number, an email, or a health word stays on the device.
- The model returns one action from the `supabase/functions/willow-agent/agent.mts` enums. The client builds every URL from the official platform list and never uses a URL from the model.
- Keep the server enums and `app/src/features/agent/schema.ts` matched; `contract.test.ts` fails if they drift.
- `GROK_API_KEY` is a Supabase secret only. `VITE_AGENT_URL` is the public function URL; left empty, the app answers on the device only.

## Update versus APK

- In-app Update reloads the live site. It does not replace `MainActivity`.
- A new debug APK is signed with a new key, so Android rejects install-over. Uninstall the old app, then install `downloads/willow.apk`.
- Do not commit a keystore. Do not claim in-place update works until a saved signing key and a rising versionCode are actually configured.

## Playwright

- The dev app registers an MSW service worker. Stub with `page.context().route`, not `page.route`.
- Run `npx playwright test <spec> --workers=2` from `app/`.
- Keep language-filter button labels unchanged.

## GitHub Pages

- A push to `main` starts Deploy GitHub Pages.
- Confirm the live build from the `gh-pages` `release.json` contents API.
- Commit only the lines from the current task. Do not force-push.
