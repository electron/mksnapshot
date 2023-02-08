const fs = require('fs')
const path = require('path')
const { downloadArtifact } = require('@electron/get')
const extractZip = require('extract-zip')
const versionToDownload = require('./package').version
let archToDownload = process.env.npm_config_arch

// Refs https://github.com/electron/fiddle-core/blob/1ee2d2737f23fd1012917a249a9444b6db89f1d8/src/versions.ts#L47-L57
function compareVersions (a, b) {
  const l = a.compareMain(b)
  if (l) return l
  // Electron's approach is nightly -> other prerelease tags -> stable,
  // so force `nightly` to sort before other prerelease tags.
  const [prea] = a.prerelease
  const [preb] = b.prerelease
  if (prea === 'nightly' && preb !== 'nightly') return -1
  if (prea !== 'nightly' && preb === 'nightly') return 1
  return a.comparePre(b)
}

// Refs https://github.com/electron/fiddle-core/blob/1ee2d2737f23fd1012917a249a9444b6db89f1d8/src/versions.ts#L152-L160
function getLatestStable (releases) {
  const { parse: semverParse } = require('semver')
  const semvers = releases.map(({ version }) => semverParse(version)).filter((sem) => Boolean(sem))
  semvers.sort((a, b) => compareVersions(a, b))
  let stable
  for (const ver of semvers.values()) {
    if (ver.prerelease.length === 0) {
      stable = ver
    }
  }
  return stable
}

function download (version) {
  return downloadArtifact({
    version: version,
    artifactName: 'mksnapshot',
    platform: process.env.npm_config_platform,
    arch: archToDownload,
    rejectUnauthorized: process.env.npm_config_strict_ssl === 'true',
    quiet: ['info', 'verbose', 'silly', 'http'].indexOf(process.env.npm_config_loglevel) === -1
  })
}

async function attemptDownload (version) {
  // Fall back to latest stable if there is not a stamped version, for tests
  if (version === '0.0.0-development') {
    const fetch = require('node-fetch')
    const releases = await fetch('https://releases.electronjs.org/releases.json').then(response => response.json())
    version = getLatestStable(releases).version
  }

  if (process.arch.indexOf('arm') === 0 && process.platform !== 'darwin') {
    console.log(`WARNING: mksnapshot does not run on ${process.arch}. Download 
    https://github.com/electron/electron/releases/download/v${version}/mksnapshot-v${version}-${process.platform}-${process.arch}-x64.zip
    on a x64 ${process.platform} OS to generate ${archToDownload} snapshots.`)
    process.exit(1)
  }

  if (archToDownload && archToDownload.indexOf('arm') === 0 && process.platform !== 'darwin') {
    archToDownload += '-x64'
  }

  try {
    const targetFolder = path.join(__dirname, 'bin')
    const zipPath = await download(version)
    await extractZip(zipPath, { dir: targetFolder })
    const platform = process.env.npm_config_platform || process.platform
    if (platform !== 'win32') {
      const mksnapshotPath = path.join(__dirname, 'bin', 'mksnapshot')
      if (fs.existsSync(mksnapshotPath)) {
        fs.chmod(mksnapshotPath, '755', function (error) {
          if (error != null) throw error
        })
      }
    }
  } catch (err) {
    // attempt to fall back to semver minor
    const parts = version.split('.')
    const baseVersion = `${parts[0]}.${parts[1]}.0`

    // don't recurse infinitely
    if (baseVersion === version) {
      throw err
    } else {
      await attemptDownload(baseVersion)
    }
  }
}

attemptDownload(versionToDownload)
