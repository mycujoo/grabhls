#!/usr/bin/env node
'use strict'
const args = require('args')
const clierr = require('cli-error')
const Video = require('./src/video')
const _ = require('lodash')
const cuid = require('cuid')
const S3UploadModule = require('./src/upload/modules/S3UploadModule')
const LocalFileModule = require('./src/upload/modules/LocalFileModule')

const define = clierr.define
const raise = clierr.raise
const errors = clierr.errors

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
  .option('auto-retry', 'Automatically retry conversion every 30 seconds if conversion fails', false)
  .option('retry-count', 'Maximum amount of retries', 5)
  .option('retry-timeout', 'Retry timeout (in seconds)', 30)
  .examples([
    {
      usage: 'grabhls  -s http://localhost/live/test.m3u8 -o testing/{random}-file.mp4 -M bucket=testbucket',
      description: 'To use the S3 upload module you need to specify additional params (and environmental variables for the SDK)',
    },
    {
      usage: 'grabhls  -s http://localhost/live/test.m3u8 -o testing/{random}-file.mp4 -d 10 -M bucket=testbucket',
      description: 'Same as the example above, but create a small 10 second clip',
    },
    {
      usage: 'grabhls  -s http://localhost/live/test.m3u8 -m local -o /tmp/{random}-file.mp4',
      description: 'Save an HLS VOD locally as an MP4',
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

  const options = {
    copy: true,
    uploadModule: null,
    uploadModuleOptions: [],
    source: encodeURI(flags.source),
    output: flags.output.replace('{random}', cuid()),
    startTime: flags.startTime || null,
    duration: flags.duration || null,
    autoRetry: !!flags.autoRetry,
    retryCount: flags.retryCount,
    retryTimeout: flags.retryTimeout,
  }

  console.log(`Using source: ${options.source}`)
  console.log(`Output: ${options.output}`)
  console.log(`Upload module: ${flags.module}`)

  if (!_.isEmpty(flags.moduleOptions)) {
    options.uploadModuleOptions = Array.isArray(flags.moduleOptions)
      ? [ ...flags.moduleOptions ]
      : [ flags.moduleOptions ]
  }

  const module = flags.module.toLowerCase()

  if (module === 's3') {
    options.uploadModule = new S3UploadModule(options)
  } else if (module === 'local') {
    options.uploadModule = new LocalFileModule(options)
  } else {
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
