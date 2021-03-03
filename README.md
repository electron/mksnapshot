# Electron mksnapshot

[![AppVeyor Build status](https://ci.appveyor.com/api/projects/status/ugparq4awqbf4fq5/branch/master?svg=true)](https://ci.appveyor.com/project/electron-bot/mksnapshot/branch/master)
[![Linux and Mac Build Status](https://circleci.com/gh/electron/mksnapshot/tree/master.svg?style=shield)](https://circleci.com/gh/electron/mksnapshot/tree/master)
<br>
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
[![devDependencies:?](https://img.shields.io/david/electron/mksnapshot.svg)](https://david-dm.org/electron/mksnapshot)
<br>
[![license:mit](https://img.shields.io/badge/license-mit-blue.svg)](https://opensource.org/licenses/MIT)
[![npm:](https://img.shields.io/npm/v/electron-mksnapshot.svg)](https://www.npmjs.com/packages/electron-mksnapshot)
[![dependencies:?](https://img.shields.io/npm/dm/electron-mksnapshot.svg)](https://www.npmjs.com/packages/electron-mksnapshot)

Simple node module to download the `mksnapshot` binaries compatible with
Electron for creating v8 snapshots.

The major version of this library tracks the major version of the Electron
versions released. So if you are using Electron `2.0.x` you would want to use
an `electron-mksnapshot` dependency of `~2.0.0` in your `package.json` file.

## Using

```sh
npm install --save-dev electron-mksnapshot
mksnapshot.js file.js (--output_dir OUTPUT_DIR).
```
Running mksnapshot.js will generate both a snapshot_blob.bin and v8_context_snapshot.bin files which
are needed to use custom snapshots in Electron.
If an output directory isn't specified, the current directory will be used.
(Additional mksnapshot args except for --startup_blob are supported, run mksnapshot --help to see options)

## Custom Mirror

You can set the `ELECTRON_MIRROR` or [`NPM_CONFIG_ELECTRON_MIRROR`](https://docs.npmjs.com/misc/config#environment-variables)
environment variables to use a custom base URL for downloading mksnapshot zips.

```sh
# Electron mirror for China
ELECTRON_MIRROR="https://npm.taobao.org/mirrors/electron/"

# Local mirror
# Example of requested URL: http://localhost:8080/1.2.0/mksnapshot-v1.2.0-darwin-x64.zip
ELECTRON_MIRROR="http://localhost:8080/"
```

## Overriding the version downloaded

The version downloaded can be overriden by setting the `ELECTRON_CUSTOM_VERSION` environment variable.

```sh
# Install mksnapshot for Electron v8.3.0
ELECTRON_CUSTOM_VERSION=8.3.0 npm install
```

## Generating snapshots for ARM hardware

If you need to generate snapshots for Linux on 32 bit ARM, Linux on ARM64, or Windows on ARM64 you will need to install a cross arch mksnapshot on an Intel x64 machine.  To do so, set the npm config `arch` to the proper arch and then run `npm install --save-dev electron-mksnapshot`.  For example:

### Linux on ARM64
From an Intel x64 Linux OS run:
```sh
npm config set arch arm64
npm install --save-dev electron-mksnapshot
```

### Linux on 32 bit ARM 
From an Intel x64 Linux OS run:
```sh
npm config set arch armv7l
npm install --save-dev electron-mksnapshot
```

### Windows on ARM (64-bit)
From an Intel x64 Windows OS run:
```sh
npm config set arch arm64
npm install --save-dev electron-mksnapshot
```

### macOS on ARM64
On macOS you can either run the cross arch mksnapshot directly on arm64 hardware or if you wish you can generate the snapshot on an Intel X64 macOS hardware via the following:
```sh
npm config set arch arm64
npm install --save-dev electron-mksnapshot
```
