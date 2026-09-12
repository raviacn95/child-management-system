import { Download, Monitor, Smartphone, Sparkles, Tv } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui'
import { apkDownloadUrl, LIVE_SITE } from '../features/install/assets'
import { installSurface, isHandheld, isIosSafari } from '../features/install/detect'
import { useInstallPrompt } from '../features/install/InstallProvider'
import { downloadLiveLauncher, launchPlan, openLiveAppWindow } from '../features/install/launcher'
import { homePath } from '../lib/tv'
import { useStore } from '../store'

export function GetApp() {
  const { state } = useStore()
  const { installed, install, status } = useInstallPrompt()
  const signedIn = Boolean(state.currentUserId)
  const surface = installSurface()
  const handheld = isHandheld()
  const apkHref = apkDownloadUrl()
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
    if (plan.kind === 'homescreen') {
      void install()
      setLaunched('homescreen')
      return
    }
    const filename = downloadLiveLauncher()
    openLiveAppWindow()
    setLaunched(filename)
    void install()
  }

  return (
    <div className="min-h-screen bg-sand" data-testid="get-app">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-2 text-pine">
          <Sparkles size={20} />
          <span className="font-display text-xl font-semibold">Willow</span>
        </div>
        <Link className="text-sm font-semibold text-pine" to={signedIn ? homePath() : '/login'}>
          {signedIn ? 'Open Willow →' : 'Sign in →'}
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">Free · No Play Store required</p>
        <h1 className="font-display mt-2 text-4xl font-semibold">Install Willow as an app</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Click once to download the app and open live Willow in its own window. Fire Stick gets an APK that Fire OS
          will ask you to install.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="card p-6" data-testid="laptop-install">
            <Monitor className="text-pine" />
            <h2 className="font-display mt-3 text-2xl font-semibold">This laptop or Chromebook</h2>
            <p className="mt-2 text-sm text-muted">
              Downloads a Willow app file and opens the live site as an app window — same data as the website, ready
              to use now.
            </p>
            {installed ? (
              <p className="mt-4 rounded-xl bg-pine-soft px-4 py-3 text-sm font-semibold text-pine">
                You are already running the Willow app.
              </p>
            ) : handheld ? (
              <Button
                className="mt-5 min-h-12 w-full text-base"
                type="button"
                onClick={launchLiveApp}
                data-testid="pwa-install"
              >
                <Download size={18} />
                {status === 'prompting' ? 'Adding to Home Screen…' : 'Use live Willow on this phone'}
              </Button>
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
              {launched === 'homescreen' ? (
                <p className="font-semibold text-pine">
                  You are already on live Willow. Android Chrome: menu → Add to Home screen. iPhone: Share → Add to
                  Home Screen. Then open Willow from the home screen like any app.
                </p>
              ) : launched ? (
                <p className="font-semibold text-pine">
                  Downloaded {launched} and opened live Willow. Open the file if Windows asks “Keep anyway”, then use
                  Willow from the Start menu next time.
                </p>
              ) : isIosSafari() || handheld ? (
                <p>On a phone this site is the live app. Add it to your Home Screen — do not download a Windows file.</p>
              ) : (
                <p className="text-xs text-muted">
                  Click the button: your browser saves <strong>Willow-Live-App</strong> and a live Willow window opens.
                  Chrome/Edge may also offer Install app.
                </p>
              )}
            </div>
          </section>

          <section className="card p-6" data-testid="firestick-install">
            <Tv className="text-pine" />
            <h2 className="font-display mt-3 text-2xl font-semibold">Fire Stick / Android TV</h2>
            <p className="mt-2 text-sm text-muted">
              Download the APK. The Stick will ask “Do you want to install this app?”. Allow apps from this source if
              Fire OS asks, then open <strong>Willow Movies</strong> on the Apps row.
            </p>
            <a
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-pine px-3.5 py-2 text-base font-semibold text-white hover:bg-[#175c4b]"
              href={apkHref}
              download="willow-movies.apk"
              data-testid="apk-download"
            >
              <Download size={18} />
              Download Fire Stick app
            </a>
            <p className="mt-3 break-all font-mono text-[11px] text-muted" data-testid="apk-url">
              {apkHref}
            </p>
            {apkReady === false ? (
              <p className="mt-2 text-xs text-clay">
                The APK goes live with each site publish. If the file is missing, push these changes to GitHub, then
                try again or type the address into Downloader on the Stick.
              </p>
            ) : null}
            <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs text-muted">
              <li>On the Stick, install the free Downloader app if Silk blocks the file.</li>
              <li>Enter the address above, download, then confirm Install.</li>
              <li>Sign in once with Keep me signed in — Willow stays current from the live site.</li>
            </ol>
          </section>
        </div>

        <section className="card mt-4 p-6 md:flex md:items-start md:gap-6">
          <Smartphone className="mt-1 shrink-0 text-pine" />
          <div>
            <h2 className="font-display text-2xl font-semibold">Phone or tablet</h2>
            <p className="mt-2 text-sm text-muted">
              This website is the live phone app. Add it to your Home Screen. Do not run the Windows launcher on a
              phone. You can also sideload the Fire Stick APK on Android.
            </p>
            {surface === 'android' && !installed ? (
              <Button className="mt-4" type="button" onClick={launchLiveApp}>
                Download & launch live app
              </Button>
            ) : null}
          </div>
        </section>

        <p className="mt-6 text-xs text-muted">
          Same Willow for everyone — directors, teachers, parents, and living-room TVs. Bookmark {LIVE_SITE} if you
          only want the website.
        </p>
      </main>
    </div>
  )
}
