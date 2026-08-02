import ChildProcess from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { getUnsupportedTargetError } from '../download-mksnapshot.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const downloadScript = path.join(__dirname, '..', 'download-mksnapshot.js')

// Marker unique to the fail-fast message printed by the unsupported-target
// check in download-mksnapshot.js
const failFastMarker = 'no longer publishes mksnapshot'

function runDownloadScript(env) {
  return new Promise((resolve) => {
    const child = ChildProcess.spawn(process.execPath, [downloadScript], {
      env: { ...process.env, ...env },
    })
    let output = ''
    child.stdout.on('data', (data) => {
      output += data
    })
    child.stderr.on('data', (data) => {
      output += data
    })
    child.on('close', (code) => {
      resolve({ code, output })
    })
  })
}

describe('getUnsupportedTargetError', () => {
  it('rejects Windows ia32 for Electron 44', () => {
    const error = getUnsupportedTargetError('44.0.0', 'win32', 'ia32')
    assert.ok(error, 'Expected an error message')
    assert.ok(error.includes(failFastMarker), error)
    assert.ok(error.includes('44.0.0'), error)
  })

  it('rejects Windows ia32 for the whole 44 prerelease line', () => {
    // v44.0.0-alpha.1 through alpha.3 did ship ia32/armv7l mksnapshot, but
    // for simplicity the whole 44 line is treated as unsupported
    const error = getUnsupportedTargetError('44.0.0-alpha.4', 'win32', 'ia32')
    assert.ok(error, 'Expected an error message')
  })

  it('rejects Linux armv7l for Electron 45 nightlies', () => {
    const error = getUnsupportedTargetError(
      '45.0.0-nightly.20260714',
      'linux',
      'armv7l',
    )
    assert.ok(error, 'Expected an error message')
    assert.ok(error.includes(failFastMarker), error)
  })

  it('rejects the arm alias for armv7l on Linux', () => {
    const error = getUnsupportedTargetError('44.1.0', 'linux', 'arm')
    assert.ok(error, 'Expected an error message')
  })

  it('handles a leading v in the version', () => {
    const error = getUnsupportedTargetError('v44.0.0', 'win32', 'ia32')
    assert.ok(error, 'Expected an error message')
  })

  it('allows Windows ia32 for Electron <= 43', () => {
    assert.strictEqual(
      getUnsupportedTargetError('43.1.4', 'win32', 'ia32'),
      null,
    )
    assert.strictEqual(
      getUnsupportedTargetError('9.0.0', 'win32', 'ia32'),
      null,
    )
  })

  it('allows Linux armv7l for Electron <= 43', () => {
    assert.strictEqual(
      getUnsupportedTargetError('43.0.0', 'linux', 'armv7l'),
      null,
    )
  })

  it('allows 64-bit targets for Electron >= 44', () => {
    assert.strictEqual(
      getUnsupportedTargetError('44.0.0', 'win32', 'x64'),
      null,
    )
    assert.strictEqual(
      getUnsupportedTargetError('45.0.0', 'linux', 'arm64'),
      null,
    )
    assert.strictEqual(
      getUnsupportedTargetError('44.0.0', 'darwin', 'arm64'),
      null,
    )
    assert.strictEqual(
      getUnsupportedTargetError('44.0.0', 'win32', 'arm64'),
      null,
    )
  })
})

describe('download-mksnapshot script', () => {
  it(
    'fails fast for Windows ia32 with ELECTRON_CUSTOM_VERSION >= 44',
    { timeout: 30000 },
    async () => {
      const { code, output } = await runDownloadScript({
        ELECTRON_CUSTOM_VERSION: '44.0.0',
        npm_config_platform: 'win32',
        npm_config_arch: 'ia32',
      })
      assert.strictEqual(code, 1, output)
      assert.ok(output.includes(failFastMarker), output)
    },
  )

  it(
    'fails fast for Linux armv7l with ELECTRON_CUSTOM_VERSION >= 44',
    { timeout: 30000 },
    async () => {
      const { code, output } = await runDownloadScript({
        ELECTRON_CUSTOM_VERSION: '45.0.0-nightly.20260714',
        npm_config_platform: 'linux',
        npm_config_arch: 'armv7l',
      })
      assert.strictEqual(code, 1, output)
      assert.ok(output.includes(failFastMarker), output)
    },
  )

  it(
    'still attempts the download for Windows ia32 with Electron <= 43',
    { timeout: 30000 },
    async () => {
      // Point the mirror at a port that refuses connections so the download
      // fails quickly without touching the network; the assertion only cares
      // that the failure is a download error, not the unsupported-target
      // fail-fast
      const { code, output } = await runDownloadScript({
        ELECTRON_CUSTOM_VERSION: '43.0.0',
        npm_config_platform: 'win32',
        npm_config_arch: 'ia32',
        ELECTRON_MIRROR: 'http://127.0.0.1:9/',
      })
      assert.ok(
        !output.includes(failFastMarker),
        `Guard must not trigger for Electron 43: ${output}`,
      )
      assert.notStrictEqual(code, 0, 'Download against a dead mirror fails')
    },
  )
})
