#!/usr/bin/env node

'use strict'

/** @typedef { import('./types').ILogger } ILogger */

module.exports = {
  create
}

const path = require('path')

const pkg = require('../package.json')

const PROGRAM = pkg.name

/** @type {(fileName: string) => ILogger} */
function create (fileName) {
  const relFileName = path.relative(path.join(__dirname, '..'), fileName)
  return new Logger(relFileName)
}

class Logger {
  constructor (
    /** @type string */ fileName
  ) {
    this._fileName = fileName
  }

  /** @type {(message: string) => void} */
  log (message) {
    message = `${PROGRAM}: ${message}`
    console.error(message)
  }

  /** @type {(message: string) => void} */
  debug (message) {
    if (process.env.DEBUG == null) return

    this.log(`DEBUG: ${this._fileName}: ${message}`)
  }

  /** @type {(status: number, message: string) => void} */
  exit (status, message) {
    this.log(message)
    process.exit(status)
  }
}

// @ts-ignore
if (require.main === module) test()

function test () {
  const logger = create(__filename)

  logger.log('a logged message')
  logger.debug('a debug message that probably will not be printed')
  process.env.DEBUG = `true`
  logger.debug('a debug message that should be printed')
  logger.exit(1, 'exiting')
  logger.log('this should not be printed')
}
