const inquirer = require('inquirer');
const configManager = require('../config/manager');
const apikeys = require('../config/apikeys');
const { createProvider } = require('../providers');
const spinner = require('../ui/spinner');
const logger = require('../ui/logger');
const colors = require('../ui/colors');

async function chatCommand() {
  logger.log('');
  logger.log(colors.primary('💬 Interactive Chat Mode'));
  logger.separator();

  const config = configManager.read();

  if (!config.provider) {
    logger.error('No provider configured. Run "anyai configure" first.');
    logger.log('');
    return;
  }

  try {
    const apiKey = await apikeys.getApiKey(config.provider);
    if (!apiKey) {
      logger.error(`No API key configured for ${config.provider}`);
      logger.log('');
      return;
    }

    const provider = createProvider(config.provider, apiKey);
    provider.setModel(config.model);

    logger.info(
      `Provider: ${colors.accent(config.provider)} | Model: ${colors.accent(config.model || provider.getDefaultModel())}`
    );
    logger.info('Type "exit" or "quit" to end the conversation');
    logger.separator();

    const messages = [];

    while (true) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'prompt',
          message: colors.primary('You:'),
        },
      ]);

      const prompt = answers.prompt.trim();

      if (prompt.toLowerCase() === 'exit' || prompt.toLowerCase() === 'quit') {
        logger.log(colors.secondary('Goodbye!'));
        logger.log('');
        break;
      }

      if (!prompt) {
        continue;
      }

      messages.push({ role: 'user', content: prompt });

      try {
        spinner.start('Thinking...');

        const response = await provider.generate(prompt, {
          model: config.model,
        });

        spinner.succeed('');
        messages.push({ role: 'assistant', content: response });

        console.log(`\n${colors.accent('AI:')} ${response}\n`);
      } catch (error) {
        spinner.fail(error.message);
      }
    }
  } catch (error) {
    logger.error(error.message);
  }
}

module.exports = chatCommand;
