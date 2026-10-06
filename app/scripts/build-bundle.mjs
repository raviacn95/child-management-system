import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const android = join(root, 'android')
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
const result = spawnSync(gradlew, ['bundleRelease', '--no-daemon'], { cwd: android, stdio: 'inherit', shell: true })
if (result.status !== 0) process.exit(result.status ?? 1)

const source = join(android, 'app/build/outputs/bundle/release/app-release.aab')
if (!existsSync(source)) {
  console.error('Release AAB not found at', source)
  process.exit(1)
}

const outputDir = join(root, 'dist/releases')
mkdirSync(outputDir, { recursive: true })
copyFileSync(source, join(outputDir, 'willow-release.aab'))
console.log('Wrote dist/releases/willow-release.aab')