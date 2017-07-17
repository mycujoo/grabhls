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

    const storageClass = this.moduleOptions.storage_class || 'REDUCED_REDUNDANCY'

    if (STORAGE_CLASSES.indexOf(storageClass) === -1) {
      raise(errors.INVALIDSTORAGECLASS)
    }

    const stream = s3Stream.upload({
      Bucket: this.moduleOptions.bucket,
      Key: this.options.output,
      ACL: this.moduleOptions.acl || 'private',
      StorageClass: storageClass,
      ContentType: this.moduleOptions.content_type || 'video/mp4',
    })

    stream.maxPartSize(this.moduleOptions.max_part_size || 20971520)

    return stream
  }
}

module.exports = S3UploadModule
