# Electron mksnapshot

[![Test](https://github.com/electron/mksnapshot/actions/workflows/test.yml/badge.svg)](https://github.com/electron/mksnapshot/actions/workflows/test.yml)
[![npm:](https://img.shields.io/npm/v/electron-mksnapshot.svg)](https://www.npmjs.com/package/electron-mksnapshot)
<br>
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
[![license:mit](https://img.shields.io/badge/license-mit-blue.svg)](https://opensource.org/licenses/MIT)
<br>
[![dependencies:?](https://img.shields.io/npm/dm/electron-mksnapshot.svg)](https://www.npmjs.com/package/electron-mksnapshot)

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

## 32-bit targets (Electron <= 43 only)

Electron 44 dropped support for Windows 32-bit (ia32) and Linux 32-bit ARM (`armv7l`),
so no mksnapshot binaries are published for those targets on Electron >= 44 and
installing `electron-mksnapshot` for them will fail with an error. To generate
snapshots for 32-bit targets, use `electron-mksnapshot` <= 43 — 32-bit targets
remain supported until the Electron 43 line reaches end-of-life in January 2027.

## Generating snapshots for ARM hardware

If you need to generate snapshots for Linux on 32 bit ARM (Electron <= 43 only), Linux on ARM64, or Windows on ARM64 you will need to install a cross arch mksnapshot on an Intel x64 machine.  To do so, set the npm config `arch` to the proper arch and then run `npm install --save-dev electron-mksnapshot`.  For example:

### Linux on ARM64
From an Intel x64 Linux OS run:
```sh
npm config set arch arm64
npm install --save-dev electron-mksnapshot
```

### Linux on 32 bit ARM (Electron <= 43 only)
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
npm run mksnapshot ABSOLUTE_PATH_TO_FILE/file.js -- --output_dir ABSOLUTE_PATH_TO_OUTPUT_DIR
```
