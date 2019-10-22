#!/usr/bin/env node

const fs = require('fs-extra')
const { spawnSync } = require('child_process')
const path = require('path')
const temp = require('temp').track()
const workingDir = temp.mkdirSync('mksnapshot-workdir')

function getBinaryPath (binary, binaryPath) {
  if (process.platform === 'win32') {
    return path.join(binaryPath, `${binary}.exe`)
  } else {
    return path.join(binaryPath, binary)
  }
}

const args = process.argv.slice(2)
if (args.length === 0 || args.includes('--help')) {
  console.log('Usage: mksnapshot file.js (--output_dir OUTPUT_DIR).  ' +
    'Additional mksnapshot args except for --startup_blob are supported:')
  args.push('--help')
}
const outDirIdx = args.indexOf('--output_dir')
let outputDir = process.cwd()
let mksnapshotArgs = args
if (outDirIdx > -1) {
  mksnapshotArgs = args.slice(0, outDirIdx)
  if (args.length >= (outDirIdx + 2)) {
    outputDir = args[(outDirIdx + 1)]
    if (args.length > (outDirIdx + 2)) {
      mksnapshotArgs = mksnapshotArgs.concat(args.slice(outDirIdx + 2))
    }
  } else {
    console.log('Error! Output directory argument given but directory not specified.')
    process.exit(1)
  }
}
if (args.includes('--startup_blob')) {
  console.log('--startup_blob argument not supported. Use --output_dir to specify where to output snapshot_blob.bin')
  process.exit(1)
} else {
  mksnapshotArgs = mksnapshotArgs.concat(['--startup_blob', 'snapshot_blob.bin'])
}
if (!mksnapshotArgs.includes('--turbo_instruction_scheduling')) {
  mksnapshotArgs.push('--turbo_instruction_scheduling')
}

const mksnapshotDir = path.join(__dirname, 'bin')

// Copy mksnapshot files to temporary working directory because
// v8_context_snapshot_generator expects to run everything from the same
// directory.
fs.copySync(mksnapshotDir, workingDir)

const options = {
  cwd: workingDir,
  env: process.env,
  stdio: 'inherit'
}

const mksnapshotCommand = getBinaryPath('mksnapshot', workingDir)
const mksnapshotProcess = spawnSync(mksnapshotCommand, mksnapshotArgs, options)
if (mksnapshotProcess.status !== 0) {
  let code = mksnapshotProcess.status
  if (code == null && mksnapshotProcess.signal === 'SIGILL') {
    code = 1
  }
  console.log('Error running mksnapshot.')
  process.exit(code)
}
if (args.includes('--help')) {
  process.exit(0)
}

fs.copyFileSync(path.join(workingDir, 'snapshot_blob.bin'),
  path.join(outputDir, 'snapshot_blob.bin'))

const v8ContextGenCommand = getBinaryPath('v8_context_snapshot_generator', workingDir)
const v8ContextGenArgs = [
  `--output_file=${path.join(outputDir, 'v8_context_snapshot.bin')}`
]

const v8ContextGenOptions = {
  cwd: mksnapshotDir,
  env: process.env,
  stdio: 'inherit'
}
const v8ContextGenProcess = spawnSync(v8ContextGenCommand, v8ContextGenArgs, v8ContextGenOptions)
if (v8ContextGenProcess.status !== 0) {
  console.log('Error running the v8 context snapshot generator.', v8ContextGenProcess)
  process.exit(v8ContextGenProcess.status)
}
process.exit(0)
