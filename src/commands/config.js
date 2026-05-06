const configManager = require('../config/manager');
const logger = require('../ui/logger');
const colors = require('../ui/colors');
const boxen = require('boxen').default;

async function configCommand() {
  logger.log('');
  const config = configManager.read();

  const content = [
    colors.primary('Current Configuration:'),
    '',
    `${colors.secondary('Provider:')} ${config.provider || colors.error('not set')}`,
    `${colors.secondary('Model:')} ${config.model || colors.muted('default')}`,
    `${colors.secondary('Config File:')} ${colors.muted(configManager.getConfigPath())}`,
  ].join('\n');

  const box = boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
  });

  console.log(box);

  if (!config.provider) {
    logger.warning('No provider configured. Run "anyai configure" to set up.');
  }

  logger.log('');
}

module.exports = configCommand;
