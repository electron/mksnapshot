const { promises: fs } = require('fs')
const path = require('path')

const versionFormat = /^(\d+\.)(\d+\.)(\d+)$/

async function updateVersion () {
  const version = process.argv[2]
  if (!versionFormat.test(version)) {
    throw new Error(`Invalid version ${version}`)
  }

  const PJ_PATH = path.join(__dirname, '..', 'package.json')
  const pj = require(PJ_PATH)

  const PJLOCK_PATH = path.join(__dirname, '..', 'package-lock.json')
  const pjLock = require(PJLOCK_PATH)

  try {
    pj.version = version
    await fs.writeFile(PJ_PATH, JSON.stringify(pj, null, 2))
    console.log(`Updated package.json version to ${version}`)

    pjLock.version = version
    await fs.writeFile(PJLOCK_PATH, JSON.stringify(pjLock, null, 2))
    console.log(`Updated package-lock.json version to ${version}`)
  } catch (e) {
    console.error('Failed to update mksnapshot version: ', e)
  }
}

updateVersion()
