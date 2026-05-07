const figlet = require('figlet');
const chalk = require('chalk');
const colors = require('./colors');
const pkg = require('../../package.json');

// A dimmer border makes the bright text inside pop more
const border = chalk.dim.cyan;

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

// More robust ANSI stripper to ensure perfect box alignment
function stripAnsi(str) {
  return str.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  );
}

// Helper to center text within the box
function centerText(text, width) {
  const stripped = stripAnsi(text);
  const padding = width - stripped.length;
  const padLeft = Math.floor(padding / 2);
  const padRight = padding - padLeft;
  return ' '.repeat(padLeft) + text + ' '.repeat(padRight);
}

function drawPremiumBox(lines, tip) {
  const allStripped = [...lines.map(stripAnsi), stripAnsi(tip)];
  // Add wider padding (8 spaces total) for a cleaner, breathable look
  const contentWidth = Math.max(...allStripped.map((l) => l.length));
  const boxWidth = contentWidth + 8;

  const top = border('╭' + '─'.repeat(boxWidth - 2) + '╮');
  const bottom = border('╰' + '─'.repeat(boxWidth - 2) + '╯');
  const divider = border('├' + '─'.repeat(boxWidth - 2) + '┤');
  const empty = border('│') + ' '.repeat(boxWidth - 2) + border('│');

  const bodyRows = lines.map((l) => {
    return border('│') + centerText(l, boxWidth - 2) + border('│');
  });

  const tipRow = border('│') + centerText(tip, boxWidth - 2) + border('│');

  return [
    top,
    empty,
    ...bodyRows,
    empty,
    divider,
    empty,
    tipRow,
    empty,
    bottom
  ].join('\n');
}

function renderBanner() {
  // 'Slant' looks incredibly sleek for modern CLIs
  const logo = figlet.textSync('AnyAI', {
    font: 'Slant',
    horizontalLayout: 'fitted',
  });

  const logoLines = logo
    .split('\n')
    .filter((l) => l.trimRight()) // Removes trailing blank lines
    .map((l) => chalk.bold(colors.primary(l)));

  // Using a standard pipe character instead of bullets/icons
  const desc =
    chalk.bold(colors.accent('Universal AI CLI')) +
    chalk.dim(' | ') +
    chalk.white('Interact with any AI provider');

  const version = colors.secondary('v' + pkg.version);
  const tip = chalk.yellow('Tip: ') + chalk.white(randomTip());

  const lines = [...logoLines, '', desc, version];

  console.log('\n' + drawPremiumBox(lines, tip) + '\n');
}

function renderQuickStart() {
  const title = chalk.bold(colors.primary('Quick Start Guide:'));

  const steps = [
    `  ${chalk.cyan('1.')} ${chalk.bold('Configure your AI provider:')}`,
    `     ${chalk.dim('$')} ${colors.accent('anyai configure')}`,
    '',
    `  ${chalk.cyan('2.')} ${chalk.bold('Start an interactive chat:')}`,
    `     ${chalk.dim('$')} ${colors.accent('anyai')}`,
    '',
    `  ${chalk.cyan('3.')} ${chalk.bold('Ask a one-shot question:')}`,
    `     ${chalk.dim('$')} ${colors.accent('anyai ask "What is Node.js?"')}`,
  ].join('\n');

  console.log(title + '\n\n' + steps + '\n');
}

module.exports = {
  renderBanner,
  renderQuickStart,
};