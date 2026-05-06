const inquirer = require('inquirer');

const CANCELLED = Symbol('CANCELLED');

function promptWithEscape(questions) {
  return new Promise((resolve) => {
    const prompt = inquirer.prompt(questions);
    const rl = prompt.ui.rl;

    const onKeypress = (_, key) => {
      if (key && key.name === 'escape') {
        rl.close();
        resolve(CANCELLED);
      }
    };

    process.stdin.on('keypress', onKeypress);

    prompt.then((answers) => {
      process.stdin.removeListener('keypress', onKeypress);
      resolve(answers);
    }).catch(() => {
      process.stdin.removeListener('keypress', onKeypress);
      resolve(CANCELLED);
    });
  });
}

module.exports = { promptWithEscape, CANCELLED };
