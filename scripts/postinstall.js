#!/usr/bin/env node

const chalk = require('chalk');

const banner = `
${chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

  ${chalk.cyan.bold('anyai-cli')} installed successfully!

${chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

  ${chalk.white.bold('Get started:')}

  ${chalk.yellow('1.')} Configure your AI provider:
     ${chalk.gray('$ anyai configure')}

  ${chalk.yellow('2.')} Start chatting:
     ${chalk.gray('$ anyai')}

  ${chalk.yellow('3.')} Or send a one-shot question:
     ${chalk.gray('$ anyai ask "What is Node.js?"')}

${chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

  ${chalk.dim('Run')} ${chalk.white('anyai --help')} ${chalk.dim('for all commands.')}

`;

console.log(banner);
