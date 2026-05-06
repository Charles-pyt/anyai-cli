const chalk = require('chalk').default;

const colors = {
  primary: (str) => chalk.cyan(str),
  accent: (str) => chalk.magenta(str),
  success: (str) => chalk.green(str),
  error: (str) => chalk.red(str),
  warning: (str) => chalk.yellow(str),
  info: (str) => chalk.cyan(str),
  secondary: (str) => chalk.gray(str),
  muted: (str) => chalk.dim(str),
};

module.exports = colors;
