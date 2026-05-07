const readline = require('readline');
const configManager = require('../config/manager');
const apikeys = require('../config/apikeys');
const { createProvider } = require('../providers');
const spinner = require('../ui/spinner');
const logger = require('../ui/logger');
const colors = require('../ui/colors');
const { renderBanner } = require('../ui/banner');
const { showCommandPalette, COMMANDS } = require('../ui/commandPalette');
const { estimateTokens, estimateCost, getLifetimeStats, updateLifetimeStats } = require('../utils/stats');
const { renderCommandBlock, renderError } = require('../ui/renderers');
const agentLoop = require('../agent/index');

async function interactiveCommand() {
  renderBanner();

  const config = configManager.read();

  if (!config.provider) {
    logger.log('');
    logger.error('No provider configured.');
    logger.info('Run "anyai configure" to set up your API key.');
    logger.log('');
    process.exit(1);
  }

  const apiKey = await apikeys.getApiKey(config.provider);
  if (!apiKey) {
    logger.error(`No API key found for ${config.provider}`);
    logger.info('Run "anyai configure" to set up your API key.');
    logger.log('');
    process.exit(1);
  }

  const provider = createProvider(config.provider, apiKey);
  provider.setModel(config.model);

  const modelName = config.model || provider.getDefaultModel();
  logger.log('');
  logger.info(`${colors.accent(config.provider)} / ${colors.accent(modelName)}`);
  logger.info('Agent mode active. Type a message or / for commands. Tab to autocomplete.');
  logger.separator();
  logger.log('');

  const messages = [];
  const prompt = colors.primary('> ');
  const promptLen = 2;

  startInputLoop(provider, config, modelName, messages, prompt, promptLen);
}

function startInputLoop(provider, config, modelName, messages, prompt, promptLen) {
  const stdin = process.stdin;
  const stdout = process.stdout;

  let inputBuffer = '';
  let paletteActive = false;
  let sessionTokens = 0;
  let sessionCost = 0;
  let agentMode = true;

  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  writePrompt();

  function writePrompt() {
    stdout.write(prompt);
  }

  function redrawInput() {
    stdout.write('\x1B[G\x1B[2K' + prompt + inputBuffer);
  }

  async function handleCommand(cmd) {
    if (cmd === '/exit' || cmd === '/quit') {
      logger.log(colors.secondary('\nGoodbye!'));
      process.exit(0);
    }

    if (cmd === '/clear') {
      messages.length = 0;
      console.clear();
      renderBanner();
      logger.info('Conversation cleared.');
      logger.log('');
      writePrompt();
      return;
    }

    if (cmd === '/help') {
      logger.log('');
      logger.log(colors.primary('Commands:'));
      COMMANDS.forEach((c) => {
        logger.log(`  ${colors.accent(c.name.padEnd(12))} ${c.desc}`);
      });
      logger.log('');
      writePrompt();
      return;
    }

    if (cmd === '/model') {
      stdin.removeListener('data', onKeypress);
      stdin.setRawMode(false);

      const modelCommand = require('./model');
      await modelCommand();

      config = configManager.read();
      modelName = config.model || provider.getDefaultModel();
      provider.setModel(modelName);

      stdin.setRawMode(true);
      stdin.resume();
      stdin.on('data', onKeypress);

      writePrompt();
      return;
    }

    if (cmd === '/provider') {
      stdin.removeListener('data', onKeypress);
      stdin.setRawMode(false);

      const configureCommand = require('./configure');
      await configureCommand();

      config = configManager.read();
      if (config.provider) {
        const apiKey = await apikeys.getApiKey(config.provider);
        if (apiKey) {
          provider = createProvider(config.provider, apiKey);
          modelName = config.model || provider.getDefaultModel();
          provider.setModel(modelName);
        } else {
          logger.error(`No API key found for ${config.provider}`);
        }
      }

      stdin.setRawMode(true);
      stdin.resume();
      stdin.on('data', onKeypress);

      writePrompt();
      return;
    }

    if (cmd === '/config') {
      logger.info(`Provider: ${config.provider}`);
      logger.info(`Model: ${modelName}`);
      logger.info(`Config: ${configManager.getConfigPath()}`);
      logger.log('');
      writePrompt();
      return;
    }

    if (cmd === '/tokens') {
      const currentContext = messages.map(m => m.content).join('\n');
      const currentContextTokens = estimateTokens(currentContext);
      logger.info(`Session Tokens: ${sessionTokens}`);
      logger.info(`Current Context: ~${currentContextTokens} tokens`);
      logger.log('');
      writePrompt();
      return;
    }

    if (cmd === '/cost') {
      logger.info(`Session Cost: ~$${sessionCost.toFixed(4)}`);
      logger.log('');
      writePrompt();
      return;
    }

    if (cmd === '/stats') {
      const stats = getLifetimeStats();
      logger.info(`Lifetime Tokens: ${stats.totalTokens}`);
      logger.info(`Lifetime Cost: ~$${stats.totalCost.toFixed(4)}`);
      if (stats.modelsUsed) {
        logger.info(`Models used:`);
        for (const [model, count] of Object.entries(stats.modelsUsed)) {
          logger.info(`  - ${model}: ${count} tokens`);
        }
      }
      logger.log('');
      writePrompt();
      return;
    }

    if (cmd === '/ping') {
      spinner.start(`Pinging ${config.provider}...`);
      const start = Date.now();
      try {
        if (typeof provider.validate === 'function') {
          await provider.validate();
        }
        const ms = Date.now() - start;
        spinner.stop();
        logger.success(`Response time: ${ms}ms`);
      } catch (err) {
        spinner.stop();
        logger.error(`Ping failed: ${err.message}`);
      }
      logger.log('');
      writePrompt();
      return;
    }

    if (cmd === '/theme') {
      const newTheme = colors.cycleTheme();
      logger.success(`Theme changed to: ${newTheme}`);
      logger.log('');
      writePrompt();
      return;
    }

    if (cmd === '/agent') {
      agentMode = true;
      renderCommandBlock('/agent', 'Agent mode enabled');
      writePrompt();
      return;
    }

    if (cmd === '/chat') {
      agentMode = false;
      renderCommandBlock('/chat', 'Chat mode enabled — no tools');
      writePrompt();
      return;
    }

    stdout.write('\n');
    logger.error(`Unknown command: ${cmd}`);
    logger.log('');
    writePrompt();
  }

  async function handleMessage(input) {
    stdout.write('\n');

    if (agentMode) {
      try {
        await agentLoop.run(input, messages, provider, config);
      } catch (error) {
        renderError('agent', error.message);
      }
    } else {
      messages.push({ role: 'user', content: input });
      spinner.start('Thinking...');
      try {
        const response = await provider.chat(messages, { model: config.model });
        spinner.stop();
        messages.push({ role: 'assistant', content: response });
        const contextText = messages.map(m => typeof m.content === 'string' ? m.content : '').join('\n');
        const responseTokens = estimateTokens(response);
        const inputTokens = estimateTokens(contextText) - responseTokens;
        const totalTokens = inputTokens + responseTokens;
        const activeModel = config.model || provider.getDefaultModel();
        const cost = estimateCost(totalTokens, activeModel);
        sessionTokens += totalTokens;
        sessionCost += cost;
        updateLifetimeStats(activeModel, totalTokens, cost);
        logger.log('');
        console.log(colors.accent('AI: ') + response);
        logger.log('');
      } catch (error) {
        spinner.fail(error.message);
        messages.pop();
        logger.log('');
      }
    }

    writePrompt();
  }

  async function openPalette() {
    paletteActive = true;
    stdin.removeListener('data', onKeypress);

    const result = await showCommandPalette('/', prompt);

    paletteActive = false;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onKeypress);

    if (result) {
      inputBuffer = '';
      stdout.write('\x1B[G\x1B[2K');
      await handleCommand(result);
    } else {
      inputBuffer = '';
      stdout.write('\x1B[G\x1B[2K');
      writePrompt();
    }
  }

  function onKeypress(data) {
    const key = data.toString();

    if (key === '\x03') {
      logger.log(colors.secondary('\nGoodbye!'));
      process.exit(0);
    }

    if (key === '\r' || key === '\n') {
      const input = inputBuffer.trim();
      inputBuffer = '';

      if (!input) {
        stdout.write('\n');
        writePrompt();
        return;
      }

      if (input.startsWith('/')) {
        stdout.write('\n');
        handleCommand(input);
        return;
      }

      handleMessage(input);
      return;
    }

    if (key === '\x7F' || key === '\b') {
      if (inputBuffer.length > 0) {
        inputBuffer = inputBuffer.slice(0, -1);
        redrawInput();
      }
      return;
    }

    if (key === '\x1B[A' || key === '\x1B[B' || key === '\x1B[C' || key === '\x1B[D') {
      return;
    }

    if (key === '\x1B') {
      return;
    }

    if (key.length === 1 && key.charCodeAt(0) >= 32) {
      inputBuffer += key;

      if (inputBuffer === '/') {
        openPalette();
        return;
      }

      redrawInput();
      return;
    }
  }

  stdin.on('data', onKeypress);
}

module.exports = interactiveCommand;
