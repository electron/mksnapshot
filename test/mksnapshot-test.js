var assert = require('assert')
var ChildProcess = require('child_process')
var fs = require('fs')
var path = require('path')
var temp = require('temp').track()

var describe = global.describe
var it = global.it

describe('mksnapshot binary', function () {
  this.timeout(30000)

  it('creates a snapshot for a valid file', function (done) {
    var tempDir = temp.mkdirSync('mksnapshot-')
    var outputFile = path.join(tempDir, 'snapshot_blob.bin')
    var v8ContextFile = path.join(tempDir, 'v8_context_snapshot.bin')
    var args = [
      path.join(__dirname, '..', 'mksnapshot.js'),
      path.join(__dirname, 'fixtures', 'snapshot.js'),
      '--output_dir',
      tempDir
    ]
    var mksnapshot = ChildProcess.spawn(process.execPath, args)

    var output = ''
    mksnapshot.stdout.on('data', function (data) { output += data })
    mksnapshot.stderr.on('data', function (data) { process.stdout.write(data); output += data })

    mksnapshot.on('close', function (code) {
      assert.equal(typeof code, 'number', 'Exit code is a number')
      assert.equal(code, 0, 'Exit code is not zero')
      assert.equal(output.indexOf('Loading script for embedding'), 0, output, 'Output is correct')
      assert.equal(fs.existsSync(outputFile), true, 'Output file exists.')
      assert.equal(fs.existsSync(v8ContextFile), true, 'V8 context file exists.')
      done()
    })

    mksnapshot.on('error', done)
  })

  it('fails for invalid JavaScript files', function (done) {
    var tempDir = temp.mkdirSync('mksnapshot-')
    var outputFile = path.join(tempDir, 'snapshot_blob.bin')
    var v8ContextFile = path.join(tempDir, 'v8_context_snapshot.bin')
    var args = [
      path.join(__dirname, '..', 'mksnapshot.js'),
      path.join(__dirname, 'fixtures', 'invalid.js'),
      '--output_dir',
      tempDir
    ]
    var mksnapshot = ChildProcess.spawn(process.execPath, args)

    var output = ''
    mksnapshot.stdout.on('data', function (data) { output += data })
    mksnapshot.stderr.on('data', function (data) { output += data })

    mksnapshot.on('close', function (code) {
      console.log('Output is', output)
      assert.equal(typeof code, 'number', 'Exit code is a number')
      assert.notEqual(code, 0, 'Exit code is not zero')
      assert.notEqual(output.indexOf('Fatal error'), -1, 'Output has fatal error')
      assert.equal(fs.existsSync(outputFile), false, 'Output file does not exist.')
      assert.equal(fs.existsSync(v8ContextFile), false, 'V8 context file does not exist.')
      done()
    })

    mksnapshot.on('error', done)
  })
})
