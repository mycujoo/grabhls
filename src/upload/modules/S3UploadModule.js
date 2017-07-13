const AbstractUploadModule = require('./AbstractUploadModule')
const AWS = require('aws-sdk')
const s3Stream = require('s3-upload-stream')(new AWS.S3())
const _ = require('lodash')
// const cuid = require('cuid')
const clierr = require('cli-error')
const define = clierr.define
const raise = clierr.raise
const errors = clierr.errors

define('NOBUCKET', 'No S3 bucket specified')

class S3UploadModule extends AbstractUploadModule {
  constructor (options) {
    super(options)
    this.name = 'S3UploadModule'
    process.exit(1)
  }

  getStream () {
    if (_.isEmpty(this.moduleOptions.bucket)) {
      raise(errors.NOBUCKET)
    }

    const stream = s3Stream.upload({
      Bucket: this.moduleOptions.bucket,
      Key: this.options.output,
      ACL: this.options.acl || 'public-read',
      StorageClass: this.moduleOptions.storage_class || 'REDUCED_REDUNDANCY',
      ContentType: this.moduleOptions.content_type || 'video/mp4',
    })

    stream.maxPartSize(this.moduleOptions.max_part_size || 20971520)

    return stream
  }
}

module.exports = S3UploadModule
