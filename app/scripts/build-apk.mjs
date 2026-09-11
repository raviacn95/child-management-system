import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const android = join(root, 'android')
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
const result = spawnSync(gradlew, ['assembleDebug', '--no-daemon'], {
  cwd: android,
  stdio: 'inherit',
  shell: true,
})
if (result.status !== 0) process.exit(result.status ?? 1)

const src = join(android, 'app/build/outputs/apk/debug/app-debug.apk')
if (!existsSync(src)) {
  console.error('APK not found at', src)
  process.exit(1)
}

for (const dir of [join(root, 'public/downloads'), join(root, 'dist/downloads')]) {
  mkdirSync(dir, { recursive: true })
  copyFileSync(src, join(dir, 'willow-movies.apk'))
}

console.log('Copied willow-movies.apk to public/downloads and dist/downloads')
