// const assert = require('assert')
const Video = require('../src/video')
const expect = require('chai').expect
const Writable = require('stream').Writable

const options = [
  {
    copy: false,
    startTime: 1,
    duration: 1,
    source: 'https://localhost/master.m3u8',
    uploadModule: {
      getStream: () => {
        return new Writable()
      },
    },
  },
  {
    startTime: 1,
    duration: 1,
    copy: true,
    source: 'https://localhost/master.m3u8',
    uploadModule: {
      getStream: () => {
        return new Writable()
      },
    },
  },
]

const expects = [
  [
    '-loglevel',
    'error',
    '-protocol_whitelist',
    'file,rtmp,http,https,tcp,tls',
    '-ss',
    1,
    '-i',
    'https://localhost/master.m3u8',
    '-acodec',
    'aac',
    '-b:a',
    '128k',
    '-vcodec',
    'libx264',
    '-b:v',
    '3000k',
    '-maxrate',
    '3000k',
    '-minrate',
    '3000k',
    '-bufsize',
    '3M',
    '-t',
    1,
    '-movflags',
    '+empty_moov+frag_keyframe+faststart',
    '-preset',
    'medium',
    '-f',
    'mp4',
  ],
  [
    '-loglevel',
    'error',
    '-protocol_whitelist',
    'file,rtmp,http,https,tcp,tls',
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
    '-movflags',
    '+faststart',
    '-bsf:a',
    'aac_adtstoasc',
    '-f',
    'mp4',
  ],
]

describe('Video', () => {
  describe('constructor', () => {
    it('should set proper variables', () => {
      const video = new Video(options[0])
      expect(video.getOptions()).to.equal(options[0])
    })
  })

  options.map((item, idx) => {
    const count = idx + 1
    describe(`convert run #${count}`, () => {
      it('should run ffmpeg with proper values', () => {
        const video = new Video(item)

        // override the video/run function
        video.run = () => {
          const output = video.getOutput()
          const args = output._getArguments()

          expect(expects[idx]).to.deep.equal(args)
        }
        video.convert()
      })
    })
  })
})
