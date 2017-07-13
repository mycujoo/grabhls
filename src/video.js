const clierr = require('cli-error')
const define = clierr.define
const raise = clierr.raise
const errors = clierr.errors
const ffmpeg = require('fluent-ffmpeg')
const _ = require('lodash')

define('INVALIDoutput', 'Invalid M3U8 output')
define('NOOUTPUT', 'No video output given')
define('NOSRC', 'No source given')

class Video {
  constructor (options) {
    this.options = options
  }

  convert () {
    const output = ffmpeg(this.options.source)
      .audioCodec('copy')
      .videoCodec('copy')

    // check if we need to create a chunk of the video
    if (!_.isEmpty(this.options, 'startTime')) {
      output.seekInput(this.options.startTime)
    }

    if (!_.isEmpty(this.options, 'duration')) {
      output.duration(this.options.duration)
    }

    if (!_.has(this.options, 'source')) {
      raise(errors.NOSRC)
    }

    const stream = this.options.uploadModule.getStream()

    output
      .on('start', (commandLine) => {
        console.log(`Spawned FFmpeg with command: ${commandLine}`)
      })
      .on('error', (err) => {
        console.error(`An error occurred: ${err.message}`)
      })
      .on('end', () => {
        console.log(`Processing finished! Written ${this.output} using upload module ${this.options.uploadModule.getName()}`)
      })
      .outputOptions([
        '-bsf:a aac_adtstoasc',
        '-movflags frag_keyframe+empty_moov',
      ])
      .format('mp4')
      .output(stream)
      .run()
  }
}

module.exports = Video
