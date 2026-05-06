#!/usr/bin/env node

const path = require('path');
const { program } = require('commander');
const { renderBanner, renderQuickStart } = require(path.join(__dirname, '../src/ui/banner'));
const initCommand = require(path.join(__dirname, '../src/commands/init'));
const configureCommand = require(path.join(__dirname, '../src/commands/configure'));
const configCommand = require(path.join(__dirname, '../src/commands/config'));
const modelCommand = require(path.join(__dirname, '../src/commands/model'));
const askCommand = require(path.join(__dirname, '../src/commands/ask'));
const chatCommand = require(path.join(__dirname, '../src/commands/chat'));
const pkg = require(path.join(__dirname, '../package.json'));

// Show banner on startup if no args or only help requested
if (process.argv.length === 2) {
  renderBanner();
  renderQuickStart();
  process.exit(0);
}

program.version(pkg.version, '-v, --version', 'Output the version number');

program
  .name('anyai')
  .description('Universal AI CLI - interact with multiple AI providers')
  .on('--help', () => {
    console.log('');
  });

program
  .command('init')
  .description('Initialize anyai-cli configuration')
  .action(() => {
    initCommand();
  });

program
  .command('configure')
  .description('Configure API keys and settings')
  .action(() => {
    configureCommand();
  });

program
  .command('config')
  .description('Display current configuration')
  .action(() => {
    configCommand();
  });

program
  .command('model')
  .description('Select or change the active model')
  .action(() => {
    modelCommand();
  });

program
  .command('ask <prompt>')
  .description('Send a one-shot query to the AI')
  .action((prompt) => {
    askCommand(prompt);
  });

program
  .command('chat')
  .description('Start an interactive chat session')
  .action(() => {
    chatCommand();
  });

program
  .command('help')
  .description('Show help message')
  .action(() => {
    program.outputHelp();
  });

program.parse(process.argv);
