const clierr = require('cli-error')
const define = clierr.define
const raise = clierr.raise
const errors = clierr.errors
const ffmpeg = require('fluent-ffmpeg')
const _ = require('lodash')
const events = require('events')
const fs = require('fs')

define('INVALIDoutput', 'Invalid M3U8 output')
define('NOOUTPUT', 'No video output given')
define('NOSRC', 'No source given')
define('retryCount', 'Maximum retry count reached')

class Video {
  constructor (options) {
    this.options = options
    this.retries = 0
    events.EventEmitter.prototype._maxListeners = this.options.retryCount * 10
    this.output = ffmpeg(this.options.source).inputOptions(['-loglevel fatal'])
  }

  convert () {
    // todo support transcoding mode
    if (this.options.copy === true) {
      this.output
        .audioCodec('copy')
        .videoCodec('copy')
    } else {
      this.output
        .audioCodec('aac')
        .videoCodec('libx264')
        .audioBitrate('128k')
        .videoBitrate('3000k', true)
    }

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

    if (this.options.copy === true && this.options.tempFile !== null) {
      this.output.outputOptions(['-movflags +faststart'])
    } else if (this.options.copy === true && this.options.tempFile === null) {
      this.output.outputOptions([
        '-movflags separate_moof+faststart+empty_moov+frag_keyframe',
        '-bsf:a aac_adtstoasc',
      ])
    } else if (this.options.copy === false) {
      this.output.outputOptions([
        '-movflags +empty_moov+frag_keyframe+faststart',
        '-preset medium',
      ])
    }

    // @todo fix fluent-ffmpeg memory leak when retry happens

    if (this.options.tempFile === null) {
      this.output.output(this.options.uploadModule.getStream())
    }

    this.output
      .format('mp4')
      .on('start', (commandLine) => {
        console.log(`ffmpeg spawned: ${commandLine}`)
      })
      .on('stderr', (stderrLine) => {
        console.log('stderr: ' + stderrLine)
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
        console.log(`Processing finished!`)

        if (this.options.tempFile !== null) {
          console.log(`Uploading temporary file ${this.options.tempFile}`)

          const tempFileStream = fs.createReadStream(this.options.tempFile)
          tempFileStream.pipe(this.options.uploadModule.getStream())
        } else {
          console.log(`Written ${this.options.output} using ${this.options.uploadModule.getName()}`)
        }
      })

    this.run()
  }

  run () {
    if (this.options.tempFile !== null) {
      this.output.save(this.options.tempFile)
    } else {
      this.output.run()
    }
  }

  getOptions () {
    return this.options
  }

  getOutput () {
    return this.output
  }
}

module.exports = Video
