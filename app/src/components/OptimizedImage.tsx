import type { ImgHTMLAttributes } from 'react'

export function OptimizedImage({ alt, loading = 'lazy', decoding = 'async', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return <img alt={alt ?? ''} loading={loading} decoding={decoding} {...props} />
}
