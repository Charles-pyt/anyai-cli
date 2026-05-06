const figlet = require('figlet');
const chalk = require('chalk');
const colors = require('./colors');
const pkg = require('../../package.json');

const border = chalk.yellow;

const TIPS = [
  'Type /help to see all available commands.',
  'Use anyai configure to switch providers anytime.',
  'Use anyai model to change the active model.',
  'Conversation history is kept during a chat session.',
  'Set ANYAI_<PROVIDER>_API_KEY env var to skip keystore.',
];

function randomTip() {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}

function drawBoxWithTip(lines, tip) {
  const allStripped = [...lines.map((l) => stripAnsi(l)), stripAnsi(tip)];
  const width = Math.max(...allStripped.map((l) => l.length)) + 4;

  const top = border('╭' + '─'.repeat(width - 2) + '╮');
  const bottom = border('╰' + '─'.repeat(width - 2) + '╯');
  const divider = border('├' + '─'.repeat(width - 2) + '┤');  // used below
  const empty = border('│') + ' '.repeat(width - 2) + border('│');

  const bodyRows = lines.map((l) => {
    const pad = width - 2 - stripAnsi(l).length;
    return border('│') + '  ' + l + ' '.repeat(pad - 2) + border('│');
  });

  const tipPad = width - 2 - stripAnsi(tip).length;
  const tipRow = border('│') + '  ' + tip + ' '.repeat(tipPad - 2) + border('│');

  return [top, empty, ...bodyRows, empty, divider, empty, tipRow, empty, bottom].join('\n');
}

function renderBanner() {
  const logo = figlet.textSync('anyai', {
    font: 'Standard',
    horizontalLayout: 'default',
  });

  const logoLines = logo.split('\n').filter((l) => l.trim()).map((l) => colors.primary(l));
  const desc = colors.accent('Universal AI CLI') + chalk.white(' — Interact with any AI provider');
  const version = colors.secondary('v' + pkg.version);

  const tip = chalk.yellow('Tip: ') + chalk.white(randomTip());

  const lines = [...logoLines, '', desc, version];

  console.log('');
  console.log(drawBoxWithTip(lines, tip));
  console.log('');
}

function renderQuickStart() {
  const tips = [
    colors.primary('Get started:'),
    '',
    colors.secondary('  1.') + ' Configure your AI provider:',
    colors.muted('     anyai configure'),
    '',
    colors.secondary('  2.') + ' Start chatting:',
    colors.muted('     anyai'),
    '',
    colors.secondary('  3.') + ' One-shot question:',
    colors.muted('     anyai ask "What is Node.js?"'),
  ].join('\n');

  console.log(tips);
  console.log('');
}

module.exports = {
  renderBanner,
  renderQuickStart,
};
