import { useMemo } from 'react'
import { Ecc, QrCode } from './qrcodegen'

const QUIET_ZONE = 4

/** Black on white whatever the theme, with the standard 4-module quiet zone, so phone cameras read it. */
export function QrSvg({ text, label, size = 280 }: { text: string; label: string; size?: number }) {
  const { dim, path } = useMemo(() => {
    const qr = QrCode.encodeText(text, Ecc.MEDIUM)
    let d = ''
    for (let y = 0; y < qr.size; y++) {
      for (let x = 0; x < qr.size; x++) if (qr.getModule(x, y)) d += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`
    }
    return { dim: qr.size + QUIET_ZONE * 2, path: d }
  }, [text])
  return (
    <svg viewBox={`0 0 ${dim} ${dim}`} width={size} height={size} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width={dim} height={dim} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  )
}
