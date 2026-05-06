const configManager = require('../config/manager');
const configureCommand = require('./configure');
const logger = require('../ui/logger');
const colors = require('../ui/colors');

async function initCommand() {
  logger.log('');
  logger.log(colors.primary('Initializing anyai-cli'));
  logger.separator();

  try {
    const config = configManager.read();

    if (!config.provider) {
      configManager.write({ provider: null, model: null });
      logger.success(`Configuration directory ready: ${configManager.getConfigDir()}`);
      logger.log('');
      logger.info('Let\'s configure your first provider:');
      logger.log('');
      await configureCommand();
    } else {
      logger.info(`Already configured with provider: ${colors.accent(config.provider)}`);
      logger.info('Run "anyai configure" to change provider.');
    }
  } catch (error) {
    logger.error(`Failed to initialize: ${error.message}`);
  }

  logger.log('');
}

module.exports = initCommand;
