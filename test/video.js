// const assert = require('assert')
const Video = require('../src/video')
const expect = require('chai').expect
const Writable = require('stream').Writable

const options = {
  startTime: 1,
  duration: 1,
  source: 'https://localhost/master.m3u8',
  uploadModule: {
    getStream: () => {
      return new Writable()
    },
  },
}

describe('Video', () => {
  describe('constructor', () => {
    it('should set proper variables', () => {
      const video = new Video(options)
      expect(video.getOptions()).to.equal(options)
    })
  })

  describe('convert', () => {
    it('should run ffmpeg with proper values', () => {
      const video = new Video(options)

      // override the video/run function
      video.run = () => {
        const output = video.getOutput()
        const args = output._getArguments()

        expect([
          '-ss',
          1,
          '-i',
          'https://localhost/master.m3u8',
          '-acodec',
          'copy',
          '-vcodec',
          'copy',
          '-t',
          1,
          '-bsf:a',
          'aac_adtstoasc',
          '-movflags',
          'frag_keyframe+empty_moov',
          '-f',
          'mp4',
          'pipe:1',
        ]).to.deep.equal(args)
      }
      video.convert()
    })
  })
})
