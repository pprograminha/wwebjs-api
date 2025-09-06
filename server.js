// Load environment variables first
require('dotenv').config({ path: process.env.ENV_PATH || '.env' })

const app = require('./src/app')
const { baseWebhookURL, enableWebHook, enableWebSocket, autoStartSessions } = require('./src/config')
const { logger } = require('./src/logger')
const { handleUpgrade } = require('./src/websocket')
const { restoreSessions } = require('./src/sessions')

// Start the server
const port = process.env.PORT || 3000

// Check if BASE_WEBHOOK_URL environment variable is available when WebHook is enabled
if (!baseWebhookURL && enableWebHook) {
  logger.error('BASE_WEBHOOK_URL environment variable is not set. Exiting...')
  process.exit(1) // Terminate the application with an error code
}

const server = app.listen(port, () => {
  logger.info(`Server running on port ${port}`)
  logger.debug({ configuration: require('./src/config') }, 'Service configuration')
  if (autoStartSessions) {
    logger.info('Starting all sessions')
    restoreSessions()
  }
})

if (enableWebSocket) {
  server.on('upgrade', (request, socket, head) => {
    handleUpgrade(request, socket, head)
  })
}

// puppeteer uses subscriptions to SIGINT, SIGTERM, and SIGHUP to know when to close browser instances
// this disables the warnings when you starts more than 10 browser instances
process.setMaxListeners(0)
