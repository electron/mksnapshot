const fs = require('fs')
const path = require('path')
const { downloadArtifact } = require('@electron/get')
const extractZip = require('extract-zip')
const versionToDownload = require('./package').version
let archToDownload = process.env.npm_config_arch

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
    if (!process.env.ELECTRON_MKSNAPSHOT_STABLE_FALLBACK) {
      console.log('WARNING: mksnapshot in development needs the environment variable ELECTRON_MKSNAPSHOT_STABLE_FALLBACK set')
      process.exit(1)
    }

    const { ElectronVersions } = require('@electron/fiddle-core')
    const versions = await ElectronVersions.create(undefined, { ignoreCache: true })
    version = versions.latestStable.version
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
