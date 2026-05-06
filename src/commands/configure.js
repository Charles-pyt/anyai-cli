const inquirer = require('inquirer');
const apikeys = require('../config/apikeys');
const configManager = require('../config/manager');
const logger = require('../ui/logger');
const colors = require('../ui/colors');

async function configureCommand() {
  logger.log('');
  logger.log(colors.primary('🔧 Configuring anyai-cli'));
  logger.separator();

  const providerChoices = apikeys.getProviders();

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'provider',
      message: 'Select an AI provider:',
      choices: providerChoices,
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your API key:',
      mask: '*',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'API key cannot be empty';
        }
        return true;
      },
    },
  ]);

  try {
    const success = await apikeys.setApiKey(answers.provider, answers.apiKey);
    if (success) {
      configManager.set('provider', answers.provider);
      logger.success(`API key stored securely for ${answers.provider}`);
      logger.success('Configuration saved');
    } else {
      logger.error('Failed to store API key');
    }
  } catch (error) {
    logger.error(error.message);
  }

  logger.log('');
}

module.exports = configureCommand;
