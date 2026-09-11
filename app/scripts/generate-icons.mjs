import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const publicDir = join(root, '../public')
const androidRes = join(root, '../android/app/src/main/res')
const svg = join(publicDir, 'favicon.svg')

mkdirSync(publicDir, { recursive: true })

const sizes = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
  ['play-icon-512.png', 512],
]

for (const [name, size] of sizes) {
  await sharp(svg).resize(size, size).png().toFile(join(publicDir, name))
}

await sharp(svg).resize(1024, 1024).png().toFile(join(publicDir, 'play-icon-1024.png'))

const androidSizes = [
  ['mipmap-mdpi', 48],
  ['mipmap-hdpi', 72],
  ['mipmap-xhdpi', 96],
  ['mipmap-xxhdpi', 144],
  ['mipmap-xxxhdpi', 192],
]

for (const [folder, size] of androidSizes) {
  const dir = join(androidRes, folder)
  mkdirSync(dir, { recursive: true })
  await sharp(svg).resize(size, size).png().toFile(join(dir, 'ic_launcher.png'))
  await sharp(svg).resize(size, size).png().toFile(join(dir, 'ic_launcher_round.png'))
  await sharp(svg).resize(size, size).png().toFile(join(dir, 'ic_launcher_foreground.png'))
}

console.log('Wrote PWA and Play Store icons')
