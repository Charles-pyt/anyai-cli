const chalk = require('chalk');

const themes = {
  default: chalk.hex('#d97757'),
  ocean: chalk.cyan,
  forest: chalk.green,
  neon: chalk.magenta,
  monochrome: chalk.white,
};

function getBrand() {
  const configManager = require('../config/manager');
  const config = configManager.read();
  const theme = config.theme || 'default';
  return themes[theme] || themes.default;
}

const colors = {
  primary: (str) => getBrand()(str),
  accent: (str) => getBrand().bold(str),
  success: (str) => chalk.green(str),
  error: (str) => chalk.red(str),
  warning: (str) => chalk.yellow(str),
  info: (str) => getBrand()(str),
  secondary: (str) => chalk.gray(str),
  muted: (str) => chalk.dim(str),

  getThemes: () => Object.keys(themes),
  cycleTheme: () => {
    const configManager = require('../config/manager');
    const config = configManager.read();
    const current = config.theme || 'default';
    const keys = Object.keys(themes);
    const nextIdx = (keys.indexOf(current) + 1) % keys.length;
    const nextTheme = keys[nextIdx];
    configManager.set('theme', nextTheme);
    return nextTheme;
  }
};

module.exports = colors;
