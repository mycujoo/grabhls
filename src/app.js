const args = require('args')
const clierr = require('cli-error')
const Video = require('./video')
const _ = require('lodash')
const cuid = require('cuid')
const S3UploadModule = require('./upload/modules/S3UploadModule')
const LocalFileModule = require('./upload/modules/LocalFileModule')
const GCSUploadModule = require('./upload/modules/GCSUploadModule')
const which = require('which')
const { execFileSync } = require('child_process')
const nodeCleanup = require('node-cleanup')
const logger = require('./lib/logger')

const define = clierr.define
const raise = clierr.raise
const errors = clierr.errors

require('dotenv').load({ silent: false })

define('FFMPEGNOTFOUND', 'Cannot find ffmpeg executable on this system')
define('FFPROBENOTFOUND', 'Cannot find ffprobe executable on this system')
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
  .option('auto-retry', 'Automatically retry conversion every 30 seconds if conversion fails', false, Boolean)
  .option('temp-file', 'Upload using a temporary file instead of a direct stream upload', false, Boolean)
  .option('retry-count', 'Maximum amount of retries', 5)
  .option('retry-timeout', 'Retry timeout (in seconds)', 30)
  .option('webhook-options', 'Webhook specific options')
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
  if (_.isEmpty(flags.output)) {
    raise(errors.INVALIDOUTPUT)
  }

  const options = {
    copy: true, // only support copy mode for now
    uploadModule: null,
    uploadModuleOptions: [],
    source: encodeURI(flags.source),
    output: flags.output.replace('{random}', cuid()),
    startTime: flags.startTime || null,
    duration: flags.duration || null,
    autoRetry: !!flags.autoRetry,
    retryCount: flags.retryCount,
    retryTimeout: flags.retryTimeout,
    tempFile: (flags.tempFile ? require('tempy').file({ extension: '.mp4' }) : null),
    webhookOptions: [],
  }

  if (options.tempFile !== null) {
    logger.info(`Using temporary file: ${options.tempFile}`)
  }

  logger.info(`Using source: ${options.source}`)
  logger.info(`Output: ${options.output}`)
  logger.info(`Upload module: ${flags.module}`)

  if (!_.isEmpty(flags.moduleOptions)) {
    options.uploadModuleOptions = Array.isArray(flags.moduleOptions)
      ? [ ...flags.moduleOptions ]
      : [ flags.moduleOptions ]
  }

  if (!_.isEmpty(flags.webhookOptions)) {
    options.webhookOptions = Array.isArray(flags.webhookOptions)
      ? [ ...flags.webhookOptions ]
      : [ flags.webhookOptions ]
  }

  const module = flags.module.toLowerCase()

  if (module === 's3') {
    options.uploadModule = new S3UploadModule(options)
  } else if (module === 'local') {
    options.uploadModule = new LocalFileModule(options)
  } else if (module === 'gcs') {
    options.uploadModule = new GCSUploadModule(options)
  } else {
    raise(errors.UNKNOWNMODULE)
  }

  const ffprobeBin = which.sync('ffprobe', {nothrow: true})

  if (!ffprobeBin) {
    raise(errors.FFPROBENOTFOUND)
  }

  // probe the video prior to grabbing
  execFileSync(ffprobeBin, ['-loglevel', 'error', '-i', options.source, '-rw_timeout', '2000000'])

  const video = new Video(options)
  video.convert()

  nodeCleanup((exitCode, signal) => {
    if (signal) {
      logger.info('Forced exit detected, attempting clean shutdown')
      video.getOutput().kill('SIGTERM')
      // attempt to finish the upload before shutdown
      if (module === 's3' || module === 'gcs') {
        if (options.tempFile !== null) {
          video.localUpload()
        }
        logger.info(`Waiting for upload to finish to ${module}...`)
        options.uploadModule.getUpload().then((result) => {
          logger.info('FINISHED')
          logger.info(JSON.stringify(result))
          process.kill(process.pid, signal)
          nodeCleanup.uninstall()
        })
      } else {
        process.kill(process.pid, signal)
        nodeCleanup.uninstall()
      }

      return false
    }
  })
} catch (e) {
  if (typeof e.error === 'function') {
    e.error()
    args.showHelp()
    e.exit()
  } else {
    if (e.stack) {
      process.stderr.write(e.stack)
    } else {
      logger.error(e)
    }
    args.showHelp()
    process.exit(1)
  }
}
