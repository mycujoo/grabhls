const AbstractUploadModule = require('./AbstractUploadModule')
const S3 = require('aws-sdk/clients/s3')
const _ = require('lodash')
const stream = require('stream')
const clierr = require('cli-error')
const { triggerHook } = require('./../../lib/webhook')

const define = clierr.define
const raise = clierr.raise
const errors = clierr.errors
const s3 = new S3()

define('NOBUCKET', 'No S3 bucket specified')
define('INVALIDSTORAGECLASS', 'Invalid storage class provided to module options')

const STORAGE_CLASSES = ['STANDARD', 'STANDARD_IA', 'REDUCED_REDUNDANCY']

class S3UploadModule extends AbstractUploadModule {
  constructor (options) {
    super(options)
    this.name = 'S3UploadModule'
  }

  getStream () {
    if (_.isEmpty(this.moduleOptions.bucket)) {
      raise(errors.NOBUCKET)
    }

    const storageClass = this.moduleOptions.storage_class || 'STANDARD_IA'

    if (STORAGE_CLASSES.indexOf(storageClass) === -1) {
      raise(errors.INVALIDSTORAGECLASS)
    }

    const pass = new stream.PassThrough()
    this.upload = s3.upload({
      Bucket: this.moduleOptions.bucket,
      Key: this.options.output,
      ACL: this.moduleOptions.acl || 'private',
      StorageClass: storageClass,
      ContentType: this.moduleOptions.content_type || 'video/mp4',
      Body: pass,
    }, {
      partSize: this.moduleOptions.max_part_size || 20971520,
    }).promise()
      .then(() => {
        if (this.webhookOptions.success) {
          triggerHook(this.webhookOptions.success, this.webhookOptions.method, {
            outputPath: `${this.moduleOptions.bucket}/${this.options.output}`,
            ...this.webhookOptions,
          })
        }
      })
      .catch((err) => {
        if (this.webhookOptions.fail) {
          triggerHook(this.options.webhookOptions.fail, this.webhookOptions.method, {
            bucket: this.moduleOptions.bucket,
            output: this.options.output,
            errStack: err,
          })
        }

        throw new Error(err)
      })

    return pass
  }

  getUpload () {
    return this.upload
  }
}

module.exports = S3UploadModule
