import ChildProcess from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import tempModule from 'temp'

const temp = tempModule.track()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('mksnapshot binary', () => {
  it('creates a snapshot for a valid file', { timeout: 30000 }, () => {
    const tempDir = temp.mkdirSync('mksnapshot-')
    const outputFile = path.join(tempDir, 'snapshot_blob.bin')
    let v8ContextFileName = 'v8_context_snapshot.bin'
    if (process.platform === 'darwin') {
      const targetArch = process.env.npm_config_arch || process.arch
      if (targetArch === 'arm64') {
        v8ContextFileName = 'v8_context_snapshot.arm64.bin'
      } else {
        v8ContextFileName = 'v8_context_snapshot.x86_64.bin'
      }
    }
    const v8ContextFile = path.join(tempDir, v8ContextFileName)
    const args = [
      path.join(__dirname, '..', 'mksnapshot.js'),
      path.join(__dirname, 'fixtures', 'snapshot.js'),
      '--output_dir',
      tempDir,
    ]
    const mksnapshot = ChildProcess.spawn(process.execPath, args)

    let output = ''
    mksnapshot.stdout.on('data', (data) => {
      output += data
    })
    mksnapshot.stderr.on('data', (data) => {
      output += data
    })

    return new Promise((resolve) => {
      mksnapshot.on('close', (code) => {
        if (code !== 0) {
          console.log('Error calling mksnapshot', output)
        }
        assert.strictEqual(typeof code, 'number', 'Exit code is a number')
        assert.strictEqual(code, 0, 'Exit code is not zero')
        assert.strictEqual(
          output.indexOf('Loading script for embedding'),
          0,
          output,
        )
        assert.strictEqual(
          fs.existsSync(outputFile),
          true,
          'Output file exists.',
        )
        assert.strictEqual(
          fs.existsSync(v8ContextFile),
          true,
          'V8 context file exists.',
        )
        resolve()
      })

      mksnapshot.on('error', () => {
        console.log('error Output is', output)
        resolve()
      })
    })
  })

  it('fails for invalid JavaScript files', { timeout: 30000 }, () => {
    const tempDir = temp.mkdirSync('mksnapshot-')
    const outputFile = path.join(tempDir, 'snapshot_blob.bin')
    const v8ContextFile = path.join(tempDir, 'v8_context_snapshot.bin')
    const args = [
      path.join(__dirname, '..', 'mksnapshot.js'),
      path.join(__dirname, 'fixtures', 'invalid.js'),
      '--output_dir',
      tempDir,
    ]
    const mksnapshot = ChildProcess.spawn(process.execPath, args)

    let output = ''
    mksnapshot.stdout.on('data', (data) => {
      output += data
    })
    mksnapshot.stderr.on('data', (data) => {
      output += data
    })

    return new Promise((resolve) => {
      mksnapshot.on('close', (code) => {
        assert.strictEqual(typeof code, 'number', 'Exit code is a number')
        assert.notStrictEqual(code, 0, 'Exit code is not zero')
        assert.notStrictEqual(
          output.indexOf('Error running mksnapshot.'),
          -1,
          'Output has error message',
        )
        assert.strictEqual(
          fs.existsSync(outputFile),
          false,
          'Output file does not exist.',
        )
        assert.strictEqual(
          fs.existsSync(v8ContextFile),
          false,
          'V8 context file does not exist.',
        )
        resolve()
      })

      mksnapshot.on('error', () => {
        console.log('error Output is', output)
        resolve()
      })
    })
  })
})
