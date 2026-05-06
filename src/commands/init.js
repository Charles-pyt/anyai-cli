const configManager = require('../config/manager');
const logger = require('../ui/logger');
const colors = require('../ui/colors');

async function initCommand() {
  logger.log('');
  logger.log(colors.primary('📦 Initializing anyai-cli'));
  logger.separator();

  try {
    const config = {
      provider: null,
      model: null,
    };

    configManager.write(config);
    logger.success(`Configuration directory created at: ${configManager.getConfigDir()}`);
    logger.info('Next: Run "anyai configure" to set up your API key');
  } catch (error) {
    logger.error(`Failed to initialize: ${error.message}`);
  }

  logger.log('');
}

module.exports = initCommand;
