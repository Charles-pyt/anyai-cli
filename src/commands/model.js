const inquirer = require('inquirer');
const configManager = require('../config/manager');
const { createProvider } = require('../providers');
const logger = require('../ui/logger');
const colors = require('../ui/colors');

async function modelCommand() {
  logger.log('');
  const config = configManager.read();

  if (!config.provider) {
    logger.error('No provider configured. Run "anyai configure" first.');
    logger.log('');
    return;
  }

  try {
    const provider = createProvider(config.provider);
    const models = provider.getModels();

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: `Select model for ${colors.accent(config.provider)}:`,
        choices: models,
        default: config.model || provider.getDefaultModel(),
      },
    ]);

    configManager.set('model', answers.model);
    logger.success(`Model changed to: ${answers.model}`);
  } catch (error) {
    logger.error(error.message);
  }

  logger.log('');
}

module.exports = modelCommand;
