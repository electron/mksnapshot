# Electron mksnapshot

[![Travis Build Status](https://travis-ci.org/electron/mksnapshot.svg?branch=master)](https://travis-ci.org/electron/mksnapshot)
[![AppVeyor Build Status](https://ci.appveyor.com/api/projects/status/o767qj8y9cxhpf36?svg=true)](https://ci.appveyor.com/project/Atom/mksnapshot)
<br>
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)
[![devDependencies:?](https://img.shields.io/david/electron/mksnapshot.svg)](https://david-dm.org/electron/mksnapshot)
<br>
[![license:mit](https://img.shields.io/badge/license-mit-blue.svg)](https://opensource.org/licenses/MIT)
[![npm:](https://img.shields.io/npm/v/electron-mksnapshot.svg)](https://www.npmjs.com/packages/electron-mksnapshot)
[![dependencies:?](https://img.shields.io/npm/dm/electron-mksnapshot.svg)](https://www.npmjs.com/packages/electron-mksnapshot)

Simple node module to download the `mksnapshot` binaries compatible with
Electron for creating v8 snapshots.

This minor version of this library tracks the minor version of the Electron
versions released. So if you are using Electron `1.4.x` you would want to use
an `electron-mksnapshot` dependency of `~1.4.0` in your `package.json` file.

## Using

```sh
npm install --save-dev electron-mksnapshot
mksnapshot --help
```

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
