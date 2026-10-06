import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const required = [
  'public/play-icon-512.png',
  'public/play-icon-1024.png',
  'public/privacy.html',
  'android/app/src/main/AndroidManifest.xml',
  'android/app/build.gradle',
]

const failures = []
for (const path of required) {
  try {
    await access(join(root, path))
  } catch {
    failures.push(`Missing ${path}`)
  }
}

const gradle = await readFile(join(root, 'android/app/build.gradle'), 'utf8')
const manifest = await readFile(join(root, 'android/app/src/main/AndroidManifest.xml'), 'utf8')
const privacy = await readFile(join(root, 'public/privacy.html'), 'utf8')

for (const [label, value, expected] of [
  ['application id', gradle, 'care.willow.childcare'],
  ['target SDK', await readFile(join(root, 'android/variables.gradle'), 'utf8'), 'targetSdkVersion = 36'],
  ['launcher icon', manifest, '@mipmap/ic_launcher'],
]) {
  if (!value.includes(expected)) failures.push(`Missing ${label}: ${expected}`)
}

if (!privacy.toLowerCase().includes('privacy')) failures.push('Privacy policy is missing privacy content')
if (!process.env.WILLOW_VERSION_CODE && !process.env.WILLOW_VERSION_NAME) {
  console.warn('Using Gradle fallback version 3 / 1.2. Set WILLOW_VERSION_CODE and WILLOW_VERSION_NAME for each Play release.')
}
if (!process.env.WILLOW_KEYSTORE_FILE) {
  console.warn('No signing keystore configured. Release AAB will be unsigned and cannot be uploaded until signed.')
}

if (failures.length) {
  console.error('Willow Android release preflight failed:\n- ' + failures.join('\n- '))
  process.exit(1)
}

console.log('Willow Android release preflight passed')