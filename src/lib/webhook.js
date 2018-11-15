const got = require('got')

const logger = require('./logger')

const triggerHook = (endpoint, method, body = {}) => {
  logger.info(`Trigger ${method} on ${endpoint}`)

  return got(endpoint, {
    method,
    json: true,
    timeout: 10000,
    retries: 3,
    body,
  })
    .then((response) => response.body)
    .catch((error) => {
      throw new Error(error)
    })
}

module.exports = {
  triggerHook,
}
