const AbstractUploadModule = require('./AbstractUploadModule')
const fs = require('fs')
const clierr = require('cli-error')
const define = clierr.define
const raise = clierr.raise
const errors = clierr.errors

define('PATHNOEXISTS', 'Output path doesn\'t exist')

class LocalFileModule extends AbstractUploadModule {
  constructor (options) {
    super(options)
    this.name = 'S3UploadModule'
  }

  getStream () {
    const path = this.options.output.match(/.*\//)

    if (path !== null && !fs.existsSync(path[0])) {
      raise(errors.PATHNOEXISTS)
    }

    return fs.createWriteStream(this.options.output)
  }
}

module.exports = LocalFileModule
