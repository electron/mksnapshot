const fs = require('fs')
const path = require('path')
const { downloadArtifact } = require('@electron/get')
const extractZip = require('extract-zip')
const versionToDownload = require('./package').version
let archToDownload = process.env.npm_config_arch

// Electron dropped Windows 32-bit (ia32) and Linux 32-bit ARM (armv7l)
// support in Electron 44, so no mksnapshot artifacts are published for those
// targets on the 44 line or later. semver is a devDependency and is not
// available when this script runs at consumer install time, so parse the
// major with a plain parseInt — only plain versions reach this check (a
// stable X.Y.Z stamped into the package at publish time, or the value of
// ELECTRON_CUSTOM_VERSION).
function getUnsupportedTargetError(version, platform, arch) {
  const major = parseInt(String(version).replace(/^v/, ''), 10)
  if (Number.isNaN(major) || major < 44) {
    return null
  }
  const isWindowsIa32 = platform === 'win32' && arch === 'ia32'
  const isLinuxArm32 =
    platform === 'linux' && (arch === 'armv7l' || arch === 'arm')
  if (!isWindowsIa32 && !isLinuxArm32) {
    return null
  }
  return (
    `Electron >= 44 no longer publishes mksnapshot binaries for Windows ia32 or Linux armv7l, ` +
    `so mksnapshot for Electron ${version} (${platform}-${arch}) cannot be downloaded.\n` +
    `Use electron-mksnapshot <= 43 instead; 32-bit targets remain supported ` +
    `until the Electron 43 line reaches end-of-life in January 2027.`
  )
}

function download(version) {
  return downloadArtifact({
    version: version,
    artifactName: 'mksnapshot',
    platform: process.env.npm_config_platform,
    arch: archToDownload,
    rejectUnauthorized: process.env.npm_config_strict_ssl === 'true',
    quiet:
      ['info', 'verbose', 'silly', 'http'].indexOf(
        process.env.npm_config_loglevel,
      ) === -1,
  })
}

async function attemptDownload(version) {
  // Fall back to latest stable if there is not a stamped version, for tests.
  // Skipped when ELECTRON_CUSTOM_VERSION is set since @electron/get uses the
  // custom version regardless of the version passed to it.
  if (version === '0.0.0-development' && !process.env.ELECTRON_CUSTOM_VERSION) {
    if (!process.env.ELECTRON_MKSNAPSHOT_STABLE_FALLBACK) {
      console.log(
        'WARNING: mksnapshot in development needs the environment variable ELECTRON_MKSNAPSHOT_STABLE_FALLBACK set',
      )
      process.exit(1)
    }

    const { ElectronVersions } = require('@electron/fiddle-core')
    const versions = await ElectronVersions.create(undefined, {
      ignoreCache: true,
    })
    version = versions.latestStable.version
  }

  // Fail fast before attempting any download (including the X.Y.0 fallback
  // below) when the effective version no longer publishes mksnapshot for the
  // requested target.
  const effectiveVersion = process.env.ELECTRON_CUSTOM_VERSION || version
  const unsupportedTargetError = getUnsupportedTargetError(
    effectiveVersion,
    process.env.npm_config_platform || process.platform,
    process.env.npm_config_arch || process.arch,
  )
  if (unsupportedTargetError) {
    console.error(`ERROR: ${unsupportedTargetError}`)
    process.exit(1)
  }

  if (process.arch.indexOf('arm') === 0 && process.platform !== 'darwin') {
    // The unsupported-target check above already exited for 32-bit ARM
    // targets on Electron >= 44, so this URL is only ever printed for
    // versions that actually publish it.
    const targetArch = archToDownload || process.arch
    console.log(`WARNING: mksnapshot does not run on ${process.arch}. Download
    https://github.com/electron/electron/releases/download/v${effectiveVersion}/mksnapshot-v${effectiveVersion}-${process.platform}-${targetArch}-x64.zip
    on a x64 ${process.platform} OS to generate ${targetArch} snapshots.`)
    process.exit(1)
  }

  if (
    archToDownload &&
    archToDownload.indexOf('arm') === 0 &&
    process.platform !== 'darwin'
  ) {
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

if (require.main === module) {
  attemptDownload(versionToDownload)
}

module.exports = { getUnsupportedTargetError }
