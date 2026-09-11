import { LIVE_SITE } from './assets'

export type LauncherFile = {
  filename: string
  mime: string
  body: string
}

export function launcherFor(userAgent: string, liveUrl = LIVE_SITE): LauncherFile {
  const live = liveUrl.endsWith('/') ? liveUrl : `${liveUrl}/`
  if (/Mac OS X|Macintosh/i.test(userAgent) && !/iPhone|iPad|iPod/i.test(userAgent)) {
    return {
      filename: 'Willow-Live-App.command',
      mime: 'text/plain',
      body: [
        '#!/bin/bash',
        `LIVE="${live}"`,
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
        `set "LIVE=${live}"`,
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
  return {
    filename: 'Willow-Live-App.desktop',
    mime: 'text/plain',
    body: [
      '[Desktop Entry]',
      'Type=Application',
      'Name=Willow',
      `Exec=xdg-open ${live}`,
      'Terminal=false',
      '',
    ].join('\n'),
  }
}

export function downloadLiveLauncher(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Windows', liveUrl = LIVE_SITE) {
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

export function openLiveAppWindow(liveUrl = LIVE_SITE) {
  const features = 'popup=yes,noopener,noreferrer,width=1440,height=900'
  const opened = window.open(liveUrl, 'willow-live-app', features)
  return Boolean(opened)
}
