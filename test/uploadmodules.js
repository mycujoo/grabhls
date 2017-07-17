const expect = require('chai').expect
const Writable = require('stream').Writable
const S3UploadModule = require('../src/upload/modules/S3UploadModule')
const LocalFileModule = require('../src/upload/modules/LocalFileModule')

describe('Upload modules', () => {
  describe('s3', () => {
    it('should return writeable stream', () => {
      const options = {
        uploadModuleOptions: [
          'acl=public-read',
          'bucket=test',
          'storage_class=REDUCED_REDUNDANCY',
          'content_type=video/mp4',
        ],
        output: 'some/test.mp4',
      }

      const module = new S3UploadModule(options)
      expect(module.getStream()).to.be.an.instanceof(Writable)
    })
  })
  describe('local', () => {
    it('should return writeable stream', () => {
      const options = {
        output: 'test/file',
        uploadModuleOptions: [],
      }
      const module = new LocalFileModule(options)

      expect(module.getStream()).to.be.an.instanceof(Writable)
    })
  })
})
