// src/tools/shellTool.js
const { exec } = require('child_process');

const runCommand = {
  schema: {
    name: 'run_command',
    description: 'Run a shell command in the current working directory. Safe commands run automatically. Risky commands prompt for confirmation.',
    input_schema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The shell command to execute' }
      },
      required: ['command']
    }
  },
  async execute({ command }) {
    return new Promise((resolve) => {
      exec(command, { cwd: process.cwd() }, (err, stdout, stderr) => {
        if (err) {
          resolve({ success: false, error: err.message, stderr });
        } else {
          resolve({ success: true, stdout: stdout.trim(), stderr: stderr.trim() });
        }
      });
    });
  }
};

module.exports = { runCommand };
