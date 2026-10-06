# Google Play release checklist

This repository can build the Android App Bundle, but only the owner can complete Play Console ownership, signing, review, and distribution.

## Before the first upload

1. Create a Play Console developer account and verify the organisation and contact email.
2. Create the app with package name `care.willow.childcare`. This package name must never change after publication.
3. Generate an upload keystore and store it outside Git. Configure the GitHub secrets listed below.
4. Publish the privacy policy at `https://raviacn95.github.io/child-management-system/privacy.html`.
5. Complete the Data safety form. The current demo stores records locally, does not use Willow analytics/ads/crash reporting, and opens external storefronts under their own policies. Recheck this declaration before adding a backend, push notifications, payments, or analytics.
6. Add a support email, app icon, feature graphic, phone screenshots, tablet screenshots, and a short description in each launch language.
7. Complete the target audience, content rating, ads declaration, app access/demo credentials, and government/health claims questionnaires.
8. Upload the AAB to an internal test track, test on Android phone/tablet/TV, then promote through closed testing and production.
9. Use [google-play-listing.md](google-play-listing.md) for the listing draft and [worldwide-growth-plan.md](worldwide-growth-plan.md) for the launch program.

## Optional Grok Coach

Run the middleware beside Vite and set `GROK_API_KEY` only in the server environment. Never put the key in a `VITE_*` variable. The endpoint accepts only age band, allowlisted interests, country code, and module; it rejects child names, IDs, notes, allergies, and arbitrary prompts.

## GitHub Actions secrets

The `Android release bundle` workflow expects:

- `WILLOW_KEYSTORE_BASE64`
- `WILLOW_KEYSTORE_PASSWORD`
- `WILLOW_KEY_ALIAS`
- `WILLOW_KEY_PASSWORD`

The keystore is decoded only during the workflow and is not committed. Run the workflow manually with a new monotonically increasing `version_code` and a semantic `version_name`.

## Local release checks

```bash
cd app
npm ci
npm run icons
npm run android:preflight
$env:WILLOW_VERSION_CODE='4'
$env:WILLOW_VERSION_NAME='1.3.0'
npm run android:bundle
```

The generated bundle is `app/dist/releases/willow-release.aab`. Upload it in Play Console under **Testing → Internal testing** first. The GitHub workflow can build the signed bundle after the four signing secrets are configured.

Without a keystore, Gradle may produce an unsigned AAB for inspection, but Play Console will reject it. Do not distribute debug APKs as the production Play app.

## One million downloads

A million installs cannot be guaranteed by code. Plan staged country launches, translated store listings, onboarding and retention analytics with explicit consent, support operations, crash monitoring, paid acquisition, educator partnerships, and a content/update calendar. Add those services only after updating the privacy policy and Data safety declaration.