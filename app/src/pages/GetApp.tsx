import { Download, Monitor, Smartphone, Sparkles, Tv } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandRights } from '../components/BrandRights'
import { LookPicker } from '../components/LookPicker'
import { ShareButton } from '../features/share/ShareSheet'
import { Button } from '../components/ui'
import { APK_RELEASE_URL, apkDownloadUrl, apkTvDownloadUrl, LIVE_SITE } from '../features/install/assets'
import { installSurface, isIosSafari, prefersApkInstall } from '../features/install/detect'
import { useInstallPrompt } from '../features/install/InstallProvider'
import { downloadLiveLauncher, launchPlan, openLiveAppWindow } from '../features/install/launcher'
import { homePath } from '../lib/tv'
import { useStore } from '../store'

export function GetApp() {
  const { state } = useStore()
  const { installed, install, status } = useInstallPrompt()
  const signedIn = Boolean(state.currentUserId)
  const surface = installSurface()
  const wantApk = prefersApkInstall()
  const apkHref = apkDownloadUrl()
  const tvApkHref = apkTvDownloadUrl()
  const [apkReady, setApkReady] = useState<boolean | null>(null)
  const [launched, setLaunched] = useState('')

  useEffect(() => {
    let cancelled = false
    void fetch(apkHref, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled) setApkReady(res.ok)
      })
      .catch(() => {
        if (!cancelled) setApkReady(false)
      })
    return () => {
      cancelled = true
    }
  }, [apkHref])

  function launchLiveApp() {
    const plan = launchPlan()
    if (plan.kind === 'apk' || plan.kind === 'homescreen') {
      void install()
      setLaunched(plan.kind)
      return
    }
    const filename = downloadLiveLauncher()
    openLiveAppWindow()
    setLaunched(filename)
    void install()
  }

  return (
    <div className="look-shell min-h-screen" data-testid="get-app">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-2 text-pine">
          <Sparkles size={20} />
          <span className="font-display text-xl font-semibold">Willow™</span>
        </div>
        <div className="flex items-center gap-3">
          <ShareButton />
          <Link className="text-sm font-semibold text-pine" to={signedIn ? homePath() : '/login'}>
            {signedIn ? 'Open Willow →' : 'Sign in →'}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Free · No Play Store required</p>
        <h1 className="font-display mt-2 text-4xl font-semibold">Install Willow as an app</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Android phones install a real <strong>willow.apk</strong>. Windows gets a live app window. Fire Stick uses the
          same APK on the Apps row.
        </p>
        <div className="card mt-6 p-5">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Seven looks · Willow mark only</p>
          <h2 className="font-display mt-1 text-xl font-semibold">Seven Willow looks</h2>
          <p className="mt-1 text-sm text-muted">
            Hover to preview, click to save. Fire Stick opens the Household Hub — kids’ learning, parent growth, and
            family movies.
          </p>
          <div className="mt-4">
            <LookPicker />
          </div>
        </div>

        <section className="card mt-8 p-6" data-testid="phone-install">
          <Smartphone className="text-pine" />
          <h2 className="font-display mt-3 text-2xl font-semibold">Android phone or tablet</h2>
          <p className="mt-2 text-sm text-muted">
            Download the APK, open the file, tap Install. After that, tap <strong>Update</strong> in the app — it
            checks the official Willow source and updates only if this copy is behind. Do not uninstall. Child records
            stay on the phone.
          </p>
          <a
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-pine px-3.5 py-2 text-base font-semibold text-white hover:bg-[#175c4b]"
            href={apkHref}
            download="willow.apk"
            data-testid="phone-apk-download"
          >
            <Download size={18} />
            Download Willow.apk
          </a>
          <p className="mt-3 break-all font-mono text-[11px] text-muted">{apkHref}</p>
          <p className="mt-1 break-all font-mono text-[11px] text-muted">{APK_RELEASE_URL}</p>
          {apkReady === false ? (
            <p className="mt-2 text-xs text-clay">
              If this link is not ready yet, use the GitHub Releases copy below after the site finishes publishing.
              Then open the .apk from Downloads — never a Willow-Live-App text file.
            </p>
          ) : null}
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs text-muted">
            <li>Tap Download Willow.apk — do not open any Willow-Live-App text file.</li>
            <li>Open the download → Install → Open.</li>
            <li>Sign in once with Keep me signed in.</li>
            <li>Later, tap Update in the header — do not uninstall.</li>
          </ol>
        </section>

        <section className="card mt-4 p-6" data-testid="update-instead">
          <h2 className="font-display text-2xl font-semibold">Already installed? Update</h2>
          <p className="mt-2 text-sm text-muted">
            Do not uninstall or download the APK again. Open Willow and tap <strong>Update</strong> — it checks the
            official source and applies a newer build only from there. If the phone is stuck on an old screen, use
            Update now once. Child records stay on this device.
          </p>
          <a
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-line px-3.5 py-2 text-base font-semibold"
            href={`${LIVE_SITE}update.html`}
            data-testid="open-update-page"
          >
            Update now
          </a>
        </section>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section className="card p-6" data-testid="laptop-install">
            <Monitor className="text-pine" />
            <h2 className="font-display mt-3 text-2xl font-semibold">This laptop or Chromebook</h2>
            <p className="mt-2 text-sm text-muted">
              Downloads a Willow app file and opens the live site as an app window — same data as the website.
            </p>
            {installed ? (
              <p className="mt-4 rounded-xl bg-pine-soft px-4 py-3 text-sm font-semibold text-pine">
                You are already running the Willow app.
              </p>
            ) : wantApk ? (
              <p className="mt-4 text-sm text-muted">On this phone use Download Willow.apk above. Never a .desktop file.</p>
            ) : (
              <Button
                className="mt-5 min-h-12 w-full text-base"
                type="button"
                onClick={launchLiveApp}
                data-testid="pwa-install"
              >
                <Download size={18} />
                {status === 'prompting' ? 'Opening live app…' : 'Download & launch live app'}
              </Button>
            )}
            <div className="mt-4 rounded-xl border border-line bg-sand px-4 py-3 text-sm" data-testid="laptop-install-help">
              {launched && launched !== 'apk' && launched !== 'homescreen' ? (
                <p className="font-semibold text-pine">
                  Downloaded {launched} and opened live Willow. Open the file if Windows asks “Keep anyway”.
                </p>
              ) : isIosSafari() || surface === 'ios' ? (
                <p>On iPhone/iPad: tap Share → Add to Home Screen → Add.</p>
              ) : wantApk ? (
                <p>Android installs willow.apk — not Willow-Live-App.desktop.</p>
              ) : (
                <p className="text-xs text-muted">
                  Click the button: your browser saves <strong>Willow-Live-App</strong> and a live Willow window opens.
                </p>
              )}
            </div>
          </section>

          <section className="card p-6" data-testid="firestick-install">
            <Tv className="text-pine" />
            <h2 className="font-display mt-3 text-2xl font-semibold">Fire Stick / Android TV</h2>
            <p className="mt-2 text-sm text-muted">
              Same APK. The Stick will ask “Do you want to install this app?”. Then open <strong>Willow</strong> on
              the Apps row.
            </p>
            <a
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-pine px-3.5 py-2 text-base font-semibold text-white hover:bg-[#175c4b]"
              href={tvApkHref}
              download="willow-movies.apk"
              data-testid="apk-download"
            >
              <Download size={18} />
              Download Fire Stick APK
            </a>
            <p className="mt-3 break-all font-mono text-[11px] text-muted" data-testid="apk-url">
              {tvApkHref}
            </p>
          </section>
        </div>

        <p className="mt-6 text-xs text-muted">
          Same Willow™ for everyone — directors, teachers, parents, phones, and living-room TVs. Website: {LIVE_SITE}
        </p>
        <BrandRights className="mt-3" />
      </main>
    </div>
  )
}
