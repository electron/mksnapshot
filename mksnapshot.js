#!/usr/bin/env node

var ChildProcess = require('child_process')
var path = require('path')

var command = path.join(__dirname, 'bin', 'mksnapshot')
var args = process.argv.slice(2)
var options = {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit'
}

var mksnapshotProcess = ChildProcess.spawn(command, args, options)
mksnapshotProcess.on('exit', function (code, signal) {
  if (code == null && signal === 'SIGILL') {
    code = 1
  }
  process.exit(code)
})

var killMksnapshot = function () {
  try {
    mksnapshotProcess.kill()
  } catch (ignored) {
  }
}

process.on('exit', killMksnapshot)
process.on('SIGTERM', killMksnapshot)
