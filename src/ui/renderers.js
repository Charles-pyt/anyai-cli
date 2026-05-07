const chalk = require('chalk');
const colors = require('./colors');

/**
 * Gets the current terminal width, defaulting to 60 if not available
 */
function getTerminalWidth() {
  return process.stdout.columns || 60;
}

/**
 * Renders a full-width horizontal divider line
 */
function renderDivider() {
  const width = getTerminalWidth();
  process.stdout.write(chalk.gray('─'.repeat(width)) + '\n');
}

/**
 * Renders a clean command block UI
 * 
 * @param {string} command The command that was run (e.g., '/ping')
 * @param {string|string[]} response The response line(s) to show
 */
function renderCommandBlock(command, response) {
  const lines = Array.isArray(response) ? response : [response];
  
  renderDivider();
  process.stdout.write(chalk.gray('> ') + colors.accent(command) + '\n');
  
  lines.forEach(line => {
    process.stdout.write(chalk.gray('  ↳ ') + chalk.white(line) + '\n');
  });
  
  renderDivider();
  process.stdout.write('\n');
}

/**
 * Renders an informational block
 */
function renderInfo(command, infoStr) {
  renderCommandBlock(command, infoStr);
}

/**
 * Renders an error block
 */
function renderError(command, errorStr) {
  renderDivider();
  process.stdout.write(chalk.gray('> ') + colors.accent(command) + '\n');
  process.stdout.write(chalk.gray('  ↳ ') + colors.error(errorStr) + '\n');
  renderDivider();
  process.stdout.write('\n');
}

module.exports = {
  renderCommandBlock,
  renderInfo,
  renderError,
  renderDivider
};
