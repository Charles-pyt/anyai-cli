// src/executor/index.js
const { toolExecutors } = require('../tools/index');
const { checkSafety } = require('./safety');
const { renderCommandBlock, renderError } = require('../ui/renderers');
const colors = require('../ui/colors');

function formatArgs(toolName, input) {
  if (toolName === 'run_command') return input.command;
  if (toolName === 'write_file') return `${input.path}`;
  if (toolName === 'read_file') return `${input.path}`;
  if (toolName === 'edit_file') return `${input.filepath}`;
  if (toolName === 'delete_file') return `${input.path}`;
  if (toolName === 'list_dir') return input.path || '.';
  if (toolName === 'search_files') return `"${input.pattern}"${input.glob ? ` in ${input.glob}` : ''}`;
  if (toolName === 'find_files') return input.glob;
  return JSON.stringify(input);
}

async function dispatch(toolName, input) {
  const execute = toolExecutors[toolName];
  if (!execute) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  // Render what the agent is about to do
  renderCommandBlock(toolName, formatArgs(toolName, input));

  // Safety check
  const safety = await checkSafety(toolName, input);
  if (!safety.allowed) {
    process.stdout.write(colors.error(`  ✖ ${safety.reason}\n\n`));
    return { success: false, error: safety.reason, blocked: true };
  }

  try {
    const result = await execute(input);
    if (result.success) {
      process.stdout.write(colors.success('  ✔ Done\n\n'));
    } else {
      process.stdout.write(colors.error(`  ✖ ${result.error}\n\n`));
    }
    return result;
  } catch (err) {
    process.stdout.write(colors.error(`  ✖ ${err.message}\n\n`));
    return { success: false, error: err.message };
  }
}

module.exports = { dispatch };
