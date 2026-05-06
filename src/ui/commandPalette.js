const chalk = require('chalk');
const colors = require('./colors');
const readline = require('readline');

const COMMANDS = [
  { name: '/help', desc: 'Show available commands' },
  { name: '/clear', desc: 'Clear conversation history' },
  { name: '/model', desc: 'Change the current model' },
  { name: '/provider', desc: 'Switch AI provider' },
  { name: '/tokens', desc: 'Show exact token count of current context' },
  { name: '/cost', desc: 'Estimate cost of current session' },
  { name: '/stats', desc: 'Show lifetime usage stats' },
  { name: '/ping', desc: 'Check API latency for current provider' },
  { name: '/theme', desc: 'Cycle UI color themes' },
  { name: '/config', desc: 'Show current configuration' },
  { name: '/exit', desc: 'Quit anyai' },
];

function filterCommands(input) {
  const query = input.toLowerCase();
  if (query === '/') return COMMANDS;
  return COMMANDS.filter((c) => c.name.startsWith(query));
}

function renderList(matches, selectedIndex, input) {
  const lines = [];

  lines.push('');
  matches.forEach((cmd, i) => {
    const isSelected = i === selectedIndex;
    const name = cmd.name.padEnd(12);
    const desc = cmd.desc;

    if (isSelected) {
      lines.push(chalk.yellow('  > ') + colors.accent(name) + chalk.white(desc));
    } else {
      lines.push(chalk.gray('    ') + colors.secondary(name) + chalk.gray(desc));
    }
  });
  lines.push('');

  return lines;
}

function showCommandPalette(initialInput, prompt) {
  return new Promise((resolve) => {
    let input = initialInput || '/';
    let selectedIndex = 0;
    let matches = filterCommands(input);
    let renderedLines = 0;

    const stdin = process.stdin;
    const stdout = process.stdout;

    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();

    function render() {
      readline.cursorTo(stdout, 0);
      readline.clearScreenDown(stdout);

      const inputLine = prompt + input;
      stdout.write(inputLine);

      const listLines = renderList(matches, selectedIndex, input);
      listLines.forEach((l) => stdout.write('\n' + l));

      renderedLines = listLines.length;

      // Move cursor back up to the prompt line
      readline.moveCursor(stdout, 0, -renderedLines);

      // Move cursor to the end of the user input
      const visiblePromptLength = prompt.replace(/\x1B\[[0-9;]*m/g, '').length;
      readline.cursorTo(stdout, visiblePromptLength + input.length);
    }

    function cleanup() {
      stdin.removeListener('data', onData);
      stdin.setRawMode(wasRaw || false);

      readline.cursorTo(stdout, 0);
      readline.clearScreenDown(stdout);
    }

    function onData(buf) {
      const key = buf.toString();

      if (key === '\x1B' || key === '\x03') {
        cleanup();
        resolve(null);
        return;
      }

      if (key === '\r' || key === '\n') {
        const selected = matches[selectedIndex];
        cleanup();
        resolve(selected ? selected.name : input);
        return;
      }

      if (key === '\x1B[A') {
        selectedIndex = Math.max(0, selectedIndex - 1);
        render();
        return;
      }

      if (key === '\x1B[B') {
        selectedIndex = Math.min(matches.length - 1, selectedIndex + 1);
        render();
        return;
      }

      if (key === '\x7F' || key === '\b') {
        if (input.length > 1) {
          input = input.slice(0, -1);
          selectedIndex = 0;
          matches = filterCommands(input);
          render();
        } else {
          cleanup();
          resolve(null);
        }
        return;
      }

      if (key === '\x09') {
        if (matches.length > 0) {
          input = matches[selectedIndex].name;
          render();
        }
        return;
      }

      if (key.length === 1 && key.charCodeAt(0) >= 32) {
        input += key;
        selectedIndex = 0;
        matches = filterCommands(input);
        if (matches.length === 0) {
          matches = COMMANDS;
          selectedIndex = 0;
        }
        render();
        return;
      }
    }

    stdin.on('data', onData);
    render();
  });
}

module.exports = { showCommandPalette, COMMANDS };
