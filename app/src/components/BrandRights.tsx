import { COPYRIGHT_LINE } from '../brand'

export function BrandRights({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-relaxed text-muted ${className}`} data-testid="brand-rights">
      {COPYRIGHT_LINE} WhatsApp, Facebook, and other storefronts are used only as official share or watch links.
    </p>
  )
}
