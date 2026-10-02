/** Honest limits of the free Play on TV path, shown on the TV, the phone and in Settings. */
export function CastLimits({ className = '' }: { className?: string }) {
  return (
    <details className={`card p-4 text-sm ${className}`} data-testid="cast-limits">
      <summary className="cursor-pointer font-semibold">What Play on TV can and can’t do</summary>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        <li>Willow must be open on the TV. While Netflix or another app is on screen, Willow is in the background and can’t hear the phone.</li>
        <li>
          Once a movie is playing, Willow can’t pause or seek inside that app. Use the official Fire TV or Google TV remote app, or the
          service’s own phone app.
        </li>
        <li>Opening apps directly on Fire TV needs the newer Willow TV app (reinstall it from Get the app if a movie opens a web page).</li>
        <li>
          Messages go through the free public ntfy.sh relay, end-to-end encrypted. It has no uptime guarantee and limits how many
          messages a home can send, so remote presses are batched unless a direct link forms.
        </li>
        <li>Only the movie, app and remote keys are sent, never child names, PINs, notes or account details.</li>
      </ul>
    </details>
  )
}
