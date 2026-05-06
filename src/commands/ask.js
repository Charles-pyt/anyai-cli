const configManager = require('../config/manager');
const apikeys = require('../config/apikeys');
const { createProvider } = require('../providers');
const spinner = require('../ui/spinner');
const logger = require('../ui/logger');
const colors = require('../ui/colors');

async function askCommand(prompt) {
  logger.log('');

  if (!prompt || prompt.trim().length === 0) {
    logger.error('Prompt cannot be empty');
    logger.log('');
    return;
  }

  const config = configManager.read();

  if (!config.provider) {
    logger.error('No provider configured. Run "anyai configure" first.');
    logger.log('');
    return;
  }

  try {
    spinner.start(`Querying ${colors.accent(config.provider)}...`);

    const apiKey = await apikeys.getApiKey(config.provider);
    if (!apiKey) {
      spinner.fail('API key not found');
      logger.error(`No API key configured for ${config.provider}`);
      logger.log('');
      return;
    }

    const provider = createProvider(config.provider, apiKey);
    provider.setModel(config.model);

    const response = await provider.generate(prompt, {
      model: config.model,
    });

    spinner.succeed('Response received');
    logger.separator();
    console.log(colors.primary(response));
    logger.separator();
  } catch (error) {
    spinner.fail(error.message);
  }

  logger.log('');
}

module.exports = askCommand;
