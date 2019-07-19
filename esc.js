#!/usr/bin/env node

'use strict'

module.exports = {
  main
}

const EventEmitter = require('events')

const meow = require('meow')
const open = require('open')
const sloppyJSON = require('sloppy-json')
const { Client } = require('@elastic/elasticsearch')

const pkg = require('./package.json')
const logger = require('./lib/logger').create(__filename)

const PROGRAM = pkg.name

const DEFAULT_URL_BASE = 'http://elastic:changeme@localhost:9220'

// @ts-ignore
if (require.main === module) main()

// main cli function
async function main () {
  const args = parseArgs()
  const { input: [command, params, options], flags } = args
  const urlBase = flags.urlBase.replace(/\/+$/, '')

  const client = new Client({ node: urlBase })

  if (flags.help) args.showHelp()
  if (flags.version) args.showVersion()
  if (command === 'apis') printApis(client)
  if (command == null || params == null) args.showHelp()

  if (command === 'apis') printApis(client)
  if (!isApiValid(client, command)) {
    logger.exit(1, `invalid api "${command}"`)
  }

  if (params === 'help') {
    const api = command.replace(/\./g, '_').toLowerCase()
    const url = `https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#_${api}`
    open(url)
    logger.exit(0, `opening url: ${url}`)
  }

  let paramsObject = null
  let optionsObject = null

  if (params != null) {
    try {
      paramsObject = sloppyJSON.parse(params)
    } catch (err) {
      logger.exit(1, `error parsing params JSON: ${err.message}`)
    }
  }

  if (options != null) {
    try {
      optionsObject = sloppyJSON.parse(options)
    } catch (err) {
      logger.exit(1, `error parsing options JSON: ${err.message}`)
    }
  }

  const clientFunction = getClientFunction(client, command)

  let result
  try {
    result = await clientFunction(paramsObject, optionsObject)
  } catch (err) {
    logger.exit(1, `error invoking api: ${err.message}`)
  }

  console.log(JSON.stringify(result, null, 4))
}

/** @type {(client: Client, api: string) => (params: any, options: any) => any} */
function getClientFunction (client, api) {
  const parts = api.split(/\./g)

  /** @type {any} */
  let result = client
  for (let part of parts) {
    result = result[part]
  }

  return result
}

/** @type {() => meow.Result} */
function parseArgs () {
  const defaultUrlBase = process.env.ES_URLBASE || DEFAULT_URL_BASE

  /** @type meow.Options */
  const meowOptions = {
    help: getHelpText(),
    flags: {
      help: { type: 'boolean', alias: 'v' },
      version: { type: 'boolean', alias: 'v' },
      urlBase: { type: 'string', alias: 'u', default: defaultUrlBase }
    }
  }

  return meow(meowOptions)
}

/** @type {(client: Client, api: string) => boolean} */
function isApiValid (client, api) {
  const apis = getApis(client)
  return new Set(apis).has(api)
}

/** @type {(client: Client) => void} */
function printApis (client) {
  const apis = getApis(client)
  console.log(apis.join('\n'))
  process.exit(0)
}

/** @type {(client: Client) => string[]} */
function getApis (client) {
  const result = []

  const ee = new EventEmitter()
  const eeKeys = new Set(Object.keys(Object.getPrototypeOf(ee)))
  const esKeys = Object.keys(client).sort()

  for (let esKey of esKeys) {
    if (eeKeys.has(esKey)) continue
    if (esKey === 'name') continue
    if (esKey.indexOf('_') !== -1) continue

    const val = client[esKey]
    if (typeof val === 'function') {
      result.push(esKey)
      continue
    }

    const subKeys = Object.keys(val).sort()
    for (let subKey of subKeys) {
      if (subKey.indexOf('_') !== -1) continue
      result.push(`${esKey}.${subKey}`)
    }
  }

  return result
}

/** @type {() => string} */
function getHelpText () {
  return `
usage:

  ${PROGRAM} <api> <esParams> <esOptions>
      make an http request with the specified API, params and options
  ${PROGRAM} <api> help
      get help on an api
  ${PROGRAM} apis
      list the apis

<api> is an elasticsearch api like "index" and "indices.analyze".

<esParams> and <esOptions> are sloppy JSON strings (presumable enclosed in
single quotes), as described in https://github.com/pmuellr/sloppy-json

The following options can also be used
  -h --help             print this help
  -v --version          print the version of the program
  -u --urlBase <url>    elasticsearch base URL; default: ${DEFAULT_URL_BASE}

You can also set the env var ES_URLBASE as the elasticsearch base URL.

Set the DEBUG environment variable to any string for additional diagnostics.

For authenticated elasticsearch access, the url should include the
userid/password, for example "http://elastic:changeme@localhost:9220"
`
}
