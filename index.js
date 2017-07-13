#!/usr/bin/env node
'use strict'
const args = require('args')
const clierr = require('cli-error')
const define = clierr.define
const raise = clierr.raise
const errors = clierr.errors
const Video = require('./src/video')
const _ = require('lodash')
const S3UploadModule = require('./src/upload/modules/S3UploadModule')

require('dotenv').load({ silent: false })

define('FFMPEGNOTFOUND', 'Cannot find ffmpeg executable on this system')
define('INVALIDSRC', 'Source is not a valid m3u8 url')
define('INVALIDOUTPUT', 'Output file path is not valid')
define('UNKNOWNMODULE', 'Unknown output module')
define('UNKNOWN', 'Unknown error')

args
  .option('source', 'HLS source URL')
  .option('output', 'Output file path')
  .option('start-time', 'Specify a time to start the video at')
  .option('duration', 'Duration of the output video')
  .option('module', 'Upload module to use (default: S3)', 's3')
  .option('module-options', 'Upload module specific options')
  .examples([
    {
      usage: 'hls2s3  -s http://localhost/live/test.m3u8 -o testing/{random}-file.mp4 -M bucket=testbucket',
      description: 'To use the S3 upload module you need to specify additional params (and environmental variables for the SDK)',
    },
  ])

const flags = args.parse(process.argv)

try {
  if (/^(http|https.*\.m3u8.*)$/.test(flags.source) !== true) {
    raise(errors.INVALIDSRC)
  }

  if (_.isEmpty(flags.output)) {
    raise(errors.INVALIDOUTPUT)
  }

  console.log(`Using source: ${flags.source}`)
  console.log(`Output: ${flags.output}`)

  const options = {
    copy: true,
    uploadModule: null,
    uploadModuleOptions: [],
    source: flags.source,
    output: flags.output,
    startTime: flags.startTime || null,
    duration: flags.duration || null,
  }

  if (!_.isEmpty(flags.moduleOptions)) {
    options.uploadModuleOptions = Array.isArray(flags.moduleOptions)
      ? [ ...flags.moduleOptions ]
      : [ flags.moduleOptions ]
  }

  if (flags.copy === false) {
    Object.assign({
      copy: true,
    }, options)
  }

  switch (flags.module.toLowerCase()) {
  case 's3':
    options.uploadModule = new S3UploadModule(options)
    break
  default:
    raise(errors.UNKNOWNMODULE)
  }

  const video = new Video(options)
  video.convert()
} catch (e) {
  if (typeof e.error === 'function') {
    e.error()
    args.showHelp()
    e.exit()
  } else {
    console.error(e)
    args.showHelp()
    process.exit(1)
  }
}
