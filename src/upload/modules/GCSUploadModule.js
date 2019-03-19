const AbstractUploadModule = require('./AbstractUploadModule')
const { Storage } = require('@google-cloud/storage')
const _ = require('lodash')
const stream = require('stream')
const clierr = require('cli-error')
const { triggerHook } = require('./../../lib/webhook')
const logger = require('../../lib/logger')

const define = clierr.define
const raise = clierr.raise
const errors = clierr.errors
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
})

define('NOBUCKET', 'No GCS bucket specified')
define('UPLOADFAILED', 'Upload failed')

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

    bucket.exists()
      .then(([ exists ]) => {
        if (!exists) {
          throw errors.NOBUCKET
        }
      })
      .catch((err) => {
        logger.error(err)

        process.exit(1)
      })

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
        if (this.webhookOptions.fail) {
          triggerHook(this.options.webhookOptions.fail, this.webhookOptions.method, {
            bucket: this.moduleOptions.bucket,
            output: this.options.output,
            errStack: error,
          })
        }

        reject(error)
      })
      .on('finish', () => {
        if (this.webhookOptions.success) {
          triggerHook(this.webhookOptions.success, this.webhookOptions.method, {
            outputPath: `${this.moduleOptions.bucket}/${this.options.output}`,
            ...this.webhookOptions,
          })
        }

        resolve(`Closing stream for ${this.options.output}`)
      })
    }).catch((err) => {
      logger.error(err)

      process.exit(1)
    })

    return pass
  }

  getUpload () {
    return this.upload
  }
}

module.exports = GCSUploadModule
