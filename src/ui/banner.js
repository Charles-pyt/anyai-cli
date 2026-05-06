const boxen = require('boxen').default;
const figlet = require('figlet');
const chalk = require('chalk').default;
const colors = require('./colors');
const pkg = require('../../package.json');

function renderBanner() {
  const logo = figlet.textSync('anyai', {
    font: 'Standard',
    horizontalLayout: 'default',
  });

  const title = colors.primary(logo);
  
  const description = `${colors.accent('Universal AI CLI')} — Interact with any AI provider

${colors.secondary('v' + pkg.version)}`;

  const box = boxen(title + '\n\n' + description, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    backgroundColor: undefined,
  });

  console.log(box);
}

function renderQuickStart() {
  const tips = [
    colors.primary('Get started:'),
    '',
    colors.secondary('  1.') + ' Initialize your config:',
    colors.muted('     anyai init'),
    '',
    colors.secondary('  2.') + ' Configure your API key:',
    colors.muted('     anyai configure'),
    '',
    colors.secondary('  3.') + ' Try an AI provider:',
    colors.muted('     anyai ask "What is Node.js?"'),
  ].join('\n');

  console.log(tips);
  console.log('');
}

module.exports = {
  renderBanner,
  renderQuickStart,
};
