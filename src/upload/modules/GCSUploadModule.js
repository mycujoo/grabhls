const AbstractUploadModule = require('./AbstractUploadModule')
const { Storage } = require('@google-cloud/storage')
const _ = require('lodash')
const stream = require('stream')
const clierr = require('cli-error')
const define = clierr.define
const raise = clierr.raise
const errors = clierr.errors
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
})

define('NOBUCKET', 'No GCS bucket specified')

class GCSUploadModule extends AbstractUploadModule {
  constructor (options) {
    super(options)
    this.name = 'GCSUploadModule'
  }

  getStream () {
    if (_.isEmpty(this.moduleOptions.bucket)) {
      raise(errors.NOBUCKET)
    }

    const bucket = storage.bucket(this.moduleOptions.bucket)

    const bucketExists = bucket.exists()
      .then((exists) => exists)
      .catch((err) => raise(err))

    if (bucketExists[0]) {
      raise(errors.NOBUCKET)
    }

    const file = bucket.file(this.options.output)

    const pass = new stream.PassThrough()

    this.upload = new Promise((resolve, reject) => {
      pass.pipe(file.createWriteStream({
        predefinedAcl: this.moduleOptions.acl || 'private',
        validation: this.moduleOptions.validation || 'false',
        gzip: this.moduleOptions.gzip || true,
        metadata: {
          contentType: this.moduleOptions.content_type || 'video/mp4',
        },
      }))
      .on('error', (error) => {
        reject(error)
      })
      .on('finish', () => {
        resolve(`Closing stream for ${this.options.output}`)
      })
    })

    return pass
  }

  getUpload () {
    return this.upload
  }
}

module.exports = GCSUploadModule
