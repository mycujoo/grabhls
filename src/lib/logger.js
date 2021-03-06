'use strict'

const {
  createLogger,
  format,
  transports,
} = require('winston')
const {
  combine,
  timestamp,
  printf,
} = format
const env = process.env.NODE_ENV || 'production'
const winstonTransports = []

const customFormat = printf((info) => {
  return `${info.timestamp} ${info.level}: ${info.message}`
})

switch (env) {
case 'test':
  if (!process.env.LOGGER_WARN_SHOWN) {
    process.stderr.write('Logger redirected to test.log\r\n')
    process.env.LOGGER_WARN_SHOWN = '1'
  }
  winstonTransports.push(
      new transports.File({
        level: 'debug',
        filename: './test.log',
        format: combine(
          timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          customFormat
        ),
        handleExceptions: true,
        humanReadableUnhandledException: true,
        json: false,
        colorize: false,
        timestamp: (new Date()).toISOString(),
      })
    )
  break
case 'production':
  winstonTransports.push(
      new transports.Console({
        level: 'info',
        format: combine(
          timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          customFormat
        ),
        handleExceptions: true,
        humanReadableUnhandledException: true,
        json: false,
        colorize: false,
        timestamp: (new Date()).toISOString(),
      })
    )
  break
default:
  winstonTransports.push(
      new transports.Console({
        format: combine(
          timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          customFormat
        ),
        level: 'debug',
        handleExceptions: true,
        humanReadableUnhandledException: true,
        json: false,
        colorize: env === 'development',
        timestamp: (new Date()).toISOString(),
      })
    )
}

module.exports = createLogger({
  transports: winstonTransports,
  exitOnError: false,
})
