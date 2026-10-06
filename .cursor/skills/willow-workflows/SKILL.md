---
name: willow-workflows
description: Willow-specific rules for phone-to-TV pairing, official streaming links, in-app Update versus APK install, Playwright, and GitHub Pages. Use when changing cast pairing, movie or channel open links, the Android shell, Playwright tests, or a deploy.
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
