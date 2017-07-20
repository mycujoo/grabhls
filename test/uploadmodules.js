const expect = require('chai').expect
const Writable = require('stream').Writable
const S3UploadModule = require('../src/upload/modules/S3UploadModule')
const LocalFileModule = require('../src/upload/modules/LocalFileModule')
const tempFile = require('tempy').file({ extension: '.mp4' })

const options = {
  s3: {
    uploadModuleOptions: [
      'acl=public-read',
      'bucket=test',
      'storage_class=REDUCED_REDUNDANCY',
      'content_type=video/mp4',
    ],
    output: tempFile,
  },
  local: {
    output: tempFile,
    uploadModuleOptions: [],
  },
}

describe('Upload modules', () => {
  describe('s3', () => {
    it('should return writeable stream', () => {
      const module = new S3UploadModule(options.s3)
      expect(module.getStream()).to.be.an.instanceof(Writable)
    })
    it('should return proper module options', () => {
      const module = new S3UploadModule(options.s3)

      const moduleOptions = module.getModuleOptions()

      expect(moduleOptions.acl).to.equal('public-read')
      expect(moduleOptions.bucket).to.equal('test')
      expect(moduleOptions.storage_class).to.equal('REDUCED_REDUNDANCY')
      expect(moduleOptions.content_type).to.equal('video/mp4')
    })
  })
  describe('local', () => {
    it('should return writeable stream', () => {
      const module = new LocalFileModule(options.local)

      expect(module.getStream()).to.be.an.instanceof(Writable)
    })
  })
})
