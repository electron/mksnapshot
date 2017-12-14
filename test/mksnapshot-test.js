var assert = require('assert')
var ChildProcess = require('child_process')
var fs = require('fs')
var path = require('path')
var temp = require('temp').track()

var describe = global.describe
var it = global.it

describe('mksnapshot binary', function () {
  this.timeout(10000)

  it('creates a snapshot for a valid file', function (done) {
    var outputFile = path.join(temp.mkdirSync('mksnapshot-'), 'snapshot_blob.bin')
    var args = [
      path.join(__dirname, '..', 'mksnapshot.js'),
      path.join(__dirname, 'fixtures', 'snapshot.js'),
      '--startup_blob',
      outputFile
    ]
    var mksnapshot = ChildProcess.spawn(process.execPath, args)

    var output = ''
    mksnapshot.stdout.on('data', function (data) { output += data })
    mksnapshot.stderr.on('data', function (data) { output += data })

    mksnapshot.on('close', function (code) {
      assert.equal(typeof code, 'number', 'Exit code is a number')
      assert.equal(code, 0, 'Exit code is not zero')
      assert.equal(output.indexOf('Loading script for embedding'), 0, output, 'Output is correct')
      assert.equal(fs.existsSync(outputFile), true, 'Output file exists.')
      done()
    })

    mksnapshot.on('error', done)
  })

  it('fails for invalid JavaScript files', function (done) {
    var outputFile = path.join(temp.mkdirSync('mksnapshot-'), 'snapshot_blob.bin')
    var args = [
      path.join(__dirname, '..', 'mksnapshot.js'),
      path.join(__dirname, 'fixtures', 'invalid.js'),
      '--startup_blob',
      outputFile
    ]
    var mksnapshot = ChildProcess.spawn(process.execPath, args)

    var output = ''
    mksnapshot.stdout.on('data', function (data) { output += data })
    mksnapshot.stderr.on('data', function (data) { output += data })

    mksnapshot.on('close', function (code) {
      assert.equal(typeof code, 'number', 'Exit code is a number')
      assert.notEqual(code, 0, 'Exit code is not zero')
      assert.notEqual(output.indexOf('Fatal error'), -1, 'Output has fatal error')
      assert.equal(fs.existsSync(outputFile), false, 'Output file does not exist.')
      done()
    })

    mksnapshot.on('error', done)
  })
})
