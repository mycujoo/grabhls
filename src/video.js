const clierr = require('cli-error')
const define = clierr.define
const raise = clierr.raise
const errors = clierr.errors
const ffmpeg = require('fluent-ffmpeg')
const _ = require('lodash')
const events = require('events')

define('INVALIDoutput', 'Invalid M3U8 output')
define('NOOUTPUT', 'No video output given')
define('NOSRC', 'No source given')
define('retryCount', 'Maximum retry count reached')

class Video {
  constructor (options) {
    this.options = options
    this.retries = 0
    events.EventEmitter.prototype._maxListeners = this.options.retryCount * 10
    this.output = ffmpeg(this.options.source)
  }

  convert () {
    this.output
      .audioCodec('copy')
      .videoCodec('copy')

    // check if we need to create a chunk of the video
    if (this.options.startTime !== null) {
      this.output.seekInput(this.options.startTime)
    }

    if (this.options.duration !== null) {
      this.output.duration(this.options.duration)
    }

    if (!_.has(this.options, 'source')) {
      raise(errors.NOSRC)
    }

    // @todo fix fluent-ffmpeg memory leak when retry happens

    this.output
      .outputOptions([
        '-bsf:a aac_adtstoasc',
        '-movflags frag_keyframe+empty_moov',
      ])
      .format('mp4')
      .output(this.options.uploadModule.getStream())
      .on('start', (commandLine) => {
        console.log(`Spawned FFmpeg with command: ${commandLine}`)
      })
      .on('error', (err) => {
        console.error(`An error occurred: ${err.message}`)

        if (this.options.autoRetry === true) {
          if (this.retries === this.options.retryCount) {
            raise(errors.retryCount)
          } else {
            this.retries += 1
            setTimeout(() => {
              this.run()
            }, parseInt(this.options.retryTimeout) * 1000)
            console.log(`Auto retry  attempt ${this.retries}/${this.options.retryCount}`)
          }
        }
      })
      .on('end', () => {
        console.log(`Processing finished! Written ${this.options.output} using ${this.options.uploadModule.getName()}`)
      })

    this.run()
  }

  run (output) {
    this.output.run()
  }

  getOptions () {
    return this.options
  }

  getOutput () {
    return this.output
  }
}

module.exports = Video
