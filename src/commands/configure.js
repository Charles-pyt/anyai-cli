const apikeys = require('../config/apikeys');
const configManager = require('../config/manager');
const logger = require('../ui/logger');
const colors = require('../ui/colors');
const { promptWithEscape, CANCELLED } = require('../utils/prompt');

async function configureCommand() {
  logger.log('');
  logger.log(colors.primary('Configuring anyai-cli'));
  logger.separator();
  logger.info(colors.muted('Press Escape at any time to go back'));
  logger.log('');

  const provider = await selectProvider();
  if (!provider) return done();

  const existingKey = await apikeys.getApiKey(provider);
  let apiKey = existingKey;

  if (existingKey) {
    const action = await promptWithEscape([
      {
        type: 'list',
        name: 'choice',
        message: `An API key is already configured for ${colors.accent(provider)}. What would you like to do?`,
        choices: [
          { name: 'Use existing key', value: 'use_existing' },
          { name: 'Update key', value: 'update' }
        ]
      }
    ]);

    if (action === CANCELLED) return configureCommand();

    if (action.choice === 'update') {
      apiKey = await enterApiKey(provider);
      if (!apiKey) return configureCommand();
    }
  } else {
    apiKey = await enterApiKey(provider);
    if (!apiKey) return configureCommand();
  }

  try {
    if (apiKey !== existingKey) {
      const success = await apikeys.setApiKey(provider, apiKey);
      if (success) {
        logger.success(`API key stored securely for ${provider}`);
      } else {
        logger.error('Failed to store API key');
        return done();
      }
    } else {
      logger.success(`Using existing API key for ${provider}`);
    }

    configManager.set('provider', provider);
    const config = configManager.read();
    
    if (config.providerModels && config.providerModels[provider]) {
      configManager.set('model', config.providerModels[provider]);
    } else {
      configManager.set('model', null);
    }
    
    logger.success('Configuration saved');
  } catch (error) {
    logger.error(error.message);
  }

  done();
}

async function selectProvider() {
  const providerChoices = apikeys.getProviders();

  const result = await promptWithEscape([
    {
      type: 'list',
      name: 'provider',
      message: 'Select an AI provider:',
      choices: providerChoices,
    },
  ]);

  if (result === CANCELLED) return null;
  return result.provider;
}

async function enterApiKey(provider) {
  const result = await promptWithEscape([
    {
      type: 'password',
      name: 'apiKey',
      message: `Enter your API key for ${colors.accent(provider)}:`,
      mask: '*',
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return 'API key cannot be empty';
        }
        return true;
      },
    },
  ]);

  if (result === CANCELLED) return null;
  return result.apiKey.trim();
}

function done() {
  logger.log('');
}

module.exports = configureCommand;
