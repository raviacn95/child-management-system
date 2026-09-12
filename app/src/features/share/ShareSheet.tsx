import { useEffect, useState } from 'react'
import { COPYRIGHT_LINE, TRADEMARK_NOTICE } from '../../brand'
import { copyShareLink, nativeShare, SHARE_CHANNELS, shareHref } from './share'

export function openShareSheet() {
  window.dispatchEvent(new Event('willow-share'))
}

export function ShareSheet() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function onOpen() {
      setOpen(true)
      setCopied(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('willow-share', onOpen)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('willow-share', onOpen)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  if (!open) return null

  return (
    <div className="command-palette" data-testid="share-sheet" role="dialog" aria-label="Share Willow">
      <button type="button" className="command-palette-backdrop" aria-label="Close share" onClick={() => setOpen(false)} />
      <div className="card command-palette-panel p-5">
        <h2 className="font-display text-2xl">Share Willow™</h2>
        <p className="mt-1 text-sm text-muted">Your card. Your mark. Official channels only — no child names leave this device.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {typeof navigator.share === 'function' ? (
            <button
              type="button"
              className="rounded-xl border border-line px-3 py-3 text-sm font-semibold"
              onClick={() => void nativeShare()}
            >
              Device share
            </button>
          ) : null}
          {SHARE_CHANNELS.map((channel) =>
            channel.id === 'copy' ? (
              <button
                key={channel.id}
                type="button"
                className="rounded-xl border border-line px-3 py-3 text-sm font-semibold"
                data-testid="share-copy"
                onClick={() => {
                  void copyShareLink().then(() => setCopied(true))
                }}
              >
                {copied ? 'Copied' : channel.label}
              </button>
            ) : (
              <a
                key={channel.id}
                className="rounded-xl border border-line px-3 py-3 text-center text-sm font-semibold"
                data-testid={`share-${channel.id}`}
                href={shareHref(channel.id)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {channel.label}
              </a>
            ),
          )}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-muted">{COPYRIGHT_LINE}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-muted">{TRADEMARK_NOTICE}</p>
      </div>
    </div>
  )
}

export function ShareButton({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      className={`rounded-xl border border-line bg-paper px-2.5 py-1.5 text-xs font-semibold ${className}`}
      data-testid="open-share"
      onClick={openShareSheet}
    >
      Share
    </button>
  )
}
