import ChildProcess from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import tempModule from 'temp'
import { describe, it, expect } from 'vitest'

const temp = tempModule.track()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('mksnapshot binary', function () {
  it('creates a snapshot for a valid file', function () {
    var tempDir = temp.mkdirSync('mksnapshot-')
    var outputFile = path.join(tempDir, 'snapshot_blob.bin')
    let v8ContextFileName = 'v8_context_snapshot.bin'
    if (process.platform === 'darwin') {
      const targetArch = process.env.npm_config_arch || process.arch
      if (targetArch === 'arm64') {
        v8ContextFileName = 'v8_context_snapshot.arm64.bin'
      } else {
        v8ContextFileName = 'v8_context_snapshot.x86_64.bin'
      }
    }
    var v8ContextFile = path.join(tempDir, v8ContextFileName)
    var args = [
      path.join(__dirname, '..', 'mksnapshot.js'),
      path.join(__dirname, 'fixtures', 'snapshot.js'),
      '--output_dir',
      tempDir,
    ]
    var mksnapshot = ChildProcess.spawn(process.execPath, args)

    var output = ''
    mksnapshot.stdout.on('data', function (data) {
      output += data
    })
    mksnapshot.stderr.on('data', function (data) {
      output += data
    })

    return new Promise(function (resolve) {
      mksnapshot.on('close', function (code) {
        if (code !== 0) {
          console.log('Error calling mksnapshot', output)
        }
        expect(typeof code, 'Exit code is a number').toBe('number')
        expect(code, 'Exit code is not zero').toBe(0)
        expect(output.indexOf('Loading script for embedding'), output).toBe(0)
        expect(fs.existsSync(outputFile), 'Output file exists.').toBe(true)
        expect(fs.existsSync(v8ContextFile), 'V8 context file exists.').toBe(
          true,
        )
        resolve()
      })

      mksnapshot.on('error', function (code) {
        console.log('error Output is', output)
        resolve()
      })
    })
  }, 30000)

  it('fails for invalid JavaScript files', function () {
    var tempDir = temp.mkdirSync('mksnapshot-')
    var outputFile = path.join(tempDir, 'snapshot_blob.bin')
    var v8ContextFile = path.join(tempDir, 'v8_context_snapshot.bin')
    var args = [
      path.join(__dirname, '..', 'mksnapshot.js'),
      path.join(__dirname, 'fixtures', 'invalid.js'),
      '--output_dir',
      tempDir,
    ]
    var mksnapshot = ChildProcess.spawn(process.execPath, args)

    var output = ''
    mksnapshot.stdout.on('data', function (data) {
      output += data
    })
    mksnapshot.stderr.on('data', function (data) {
      output += data
    })

    return new Promise(function (resolve) {
      mksnapshot.on('close', function (code) {
        expect(typeof code, 'Exit code is a number').toBe('number')
        expect(code, 'Exit code is not zero').not.toBe(0)
        expect(
          output.indexOf('Error running mksnapshot.'),
          'Output has error message',
        ).not.toBe(-1)
        expect(fs.existsSync(outputFile), 'Output file does not exist.').toBe(
          false,
        )
        expect(
          fs.existsSync(v8ContextFile),
          'V8 context file does not exist.',
        ).toBe(false)
        resolve()
      })

      mksnapshot.on('error', function (code) {
        console.log('error Output is', output)
        resolve()
      })
    })
  }, 30000)
})
