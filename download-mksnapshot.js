var fs = require('fs')
var path = require('path')
var electronDownload = require('electron-download')
var extractZip = require('extract-zip')
var versionToDownload = require('./package').version
var archToDownload = process.env.npm_config_arch

if (process.arch.indexOf('arm') === 0) {
  console.log(`WARNING: mksnapshot does not run on ${process.arch}. Download 
  https://github.com/electron/electron/releases/download/v${versionToDownload}/mksnapshot-v${versionToDownload}-${process.platform}-${process.arch}-x64.zip
  on a x64 ${process.platform} OS to generate ${archToDownload} snapshots.`)
  process.exit(1)
}

if (archToDownload && archToDownload.indexOf('arm') === 0) {
  if (process.platform !== 'darwin') {
    archToDownload += '-x64'
  } else {
    console.log(`WARNING: mksnapshot for ${archToDownload} is not available on macOS. Download 
    https://github.com/electron/electron/releases/download/v${versionToDownload}/mksnapshot-v${versionToDownload}-linux-${archToDownload}-x64.zip
    on a x64 Linux OS to generate ${archToDownload} snapshots.`)
    process.exit(1)
  }
}

function download (version, callback) {
  electronDownload({
    version: version,
    mksnapshot: true,
    platform: process.env.npm_config_platform,
    arch: archToDownload,
    strictSSL: process.env.npm_config_strict_ssl === 'true',
    quiet: ['info', 'verbose', 'silly', 'http'].indexOf(process.env.npm_config_loglevel) === -1
  }, callback)
}

function processDownload (err, zipPath) {
  if (err != null) throw err
  extractZip(zipPath, { dir: path.join(__dirname, 'bin') }, function (error) {
    if (error != null) throw error
    if (process.platform !== 'win32') {
      var mksnapshotPath = path.join(__dirname, 'bin', 'mksnapshot')
      if (fs.existsSync(mksnapshotPath)) {
        fs.chmod(path.join(__dirname, 'bin', 'mksnapshot'), '755', function (error) {
          if (error != null) throw error
        })
      }
    }
  })
}

download(versionToDownload, function (err, zipPath) {
  if (err) {
    var versionSegments = versionToDownload.split('.')
    var baseVersion = versionSegments[0] + '.' + versionSegments[1] + '.0'
    download(baseVersion, processDownload)
  } else {
    processDownload(err, zipPath)
  }
})
