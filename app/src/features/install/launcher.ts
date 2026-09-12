import { LIVE_APP_URL, LIVE_SITE, liveLaunchUrl } from './assets'
import { isDesktopMac, isDesktopWindows, isIosSafari, prefersApkInstall } from './detect'

export type LaunchPlan =
  | { kind: 'apk' }
  | { kind: 'homescreen' }
  | { kind: 'desktop'; file: LauncherFile; openWindow: true }

export type LauncherFile = {
  filename: string
  mime: string
  body: string
}

export function launcherFor(userAgent: string, liveUrl = LIVE_SITE): LauncherFile {
  const root = liveUrl.split('#')[0].split('?')[0]
  const live = root.endsWith('/') ? root : `${root}/`
  if (/Mac OS X|Macintosh/i.test(userAgent) && !/iPhone|iPad|iPod/i.test(userAgent)) {
    return {
      filename: 'Willow-Live-App.command',
      mime: 'text/plain',
      body: [
        '#!/bin/bash',
        `ROOT="${live}"`,
        'LIVE="${ROOT}?willow=$(date +%s)"',
        'open -na "Microsoft Edge" --args --app="$LIVE" 2>/dev/null \\',
        '  || open -na "Google Chrome" --args --app="$LIVE" 2>/dev/null \\',
        '  || open "$LIVE"',
        '',
      ].join('\n'),
    }
  }
  if (/Win/i.test(userAgent)) {
    return {
      filename: 'Willow-Live-App.cmd',
      mime: 'text/plain',
      body: [
        '@echo off',
        'setlocal',
        `set "ROOT=${live}"`,
        'for /f %%i in (\'powershell -NoProfile -Command "[int](Get-Date -UFormat %%s)"\') do set TS=%%i',
        'set "LIVE=%ROOT%?willow=%TS%"',
        'set "EDGE=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"',
        'if not exist "%EDGE%" set "EDGE=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"',
        'set "CHROME=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"',
        'if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"',
        'if exist "%EDGE%" (',
        '  start "" "%EDGE%" --app="%LIVE%"',
        '  powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([IO.Path]::Combine($env:APPDATA,\'Microsoft\\Windows\\Start Menu\\Programs\\Willow.lnk\')); $s.TargetPath=$env:EDGE; $s.Arguments=\'--app=\'+$env:LIVE; $s.Save()"',
        '  exit /b 0',
        ')',
        'if exist "%CHROME%" (',
        '  start "" "%CHROME%" --app="%LIVE%"',
        '  exit /b 0',
        ')',
        'start "" "%LIVE%"',
        '',
      ].join('\r\n'),
    }
  }
  throw new Error('Phones install willow.apk — Willow never downloads a .desktop file on Android')
}

export function launchPlan(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Windows'): LaunchPlan {
  if (prefersApkInstall(userAgent)) return { kind: 'apk' }
  if (isIosSafari() || /iPhone|iPad|iPod/i.test(userAgent)) return { kind: 'homescreen' }
  if (isDesktopWindows(userAgent) || isDesktopMac(userAgent)) {
    return { kind: 'desktop', file: launcherFor(userAgent), openWindow: true }
  }
  return { kind: 'apk' }
}

export function downloadLiveLauncher(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Windows', liveUrl = LIVE_APP_URL) {
  const file = launcherFor(userAgent, liveUrl)
  const blob = new Blob([file.body], { type: `${file.mime};charset=utf-8` })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = file.filename
  a.rel = 'noopener'
  a.dataset.testid = 'launcher-blob'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(href), 2500)
  return file.filename
}

export function openLiveAppWindow(liveUrl = liveLaunchUrl()) {
  const features = 'popup=yes,noopener,noreferrer,width=1440,height=900'
  const opened = window.open(liveUrl, 'willow-live-app', features)
  return Boolean(opened)
}
