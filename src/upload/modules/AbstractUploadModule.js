const clierr = require('cli-error')
const define = clierr.define
const raise = clierr.raise
const errors = clierr.errors
const _ = require('lodash')

define('NONAME', 'No module name given')
define('NOSRC', 'No source passed')
define('NOGETSTREAM', 'No getStream method defined')
define('NOOUTPUT', 'No output file name specified')
define('NOABSTRACT', 'Can\'t instantiate abstract class!')
define('INVALIDMODULEOPTS', 'Invalid module options specified (key=value)')
define('INVALIDWEBHOOKOPTS', 'Invalid webhook options specified (key=value)')

class AbstractUploadModule {
  constructor (options) {
    if (this.constructor === AbstractUploadModule) {
      raise(errors.NOABSTRACT)
    }

    if (_.isEmpty(options.output)) {
      raise(errors.NOOUTPUT)
    }

    this.name = this.constructor.name
    this.options = options
    this.moduleOptions = this.getDetailedOptions('uploadModuleOptions')
    this.webhookOptions = this.webhookOptions ? this.getDetailedOptions('webhookOptions') : []
  }

  getDetailedOptions (type) {
    const error = type === 'uploadModuleOptions'
      ? errors.INVALIDMODULEOPTS
      : errors.INVALIDWEBHOOKOPTS

    return this.options[type].reduce((acc, current, idx) => {
      if (/\w+=\w+/.test(current)) {
        const option = current.split('=')
        acc[option[0]] = option[1]
      } else {
        raise(error)
      }

      return acc
    }, [])
  }

  getStream () {
    raise(errors.NOGETSTREAM)
  }

  getName () {
    return this.constructor.name
  }
}

module.exports = AbstractUploadModule
