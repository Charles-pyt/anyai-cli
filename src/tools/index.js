// src/tools/index.js
const { readFile, writeFile, listDir, editFile, deleteFile } = require('./fileTool');
const { runCommand } = require('./shellTool');
const { searchFiles, findFiles } = require('./searchTool');

const ALL_TOOLS = [readFile, writeFile, listDir, editFile, deleteFile, runCommand, searchFiles, findFiles];

// Array of Anthropic-format tool schemas
const toolSchemas = ALL_TOOLS.map(t => t.schema);

// Map: tool name → execute function
const toolExecutors = Object.fromEntries(ALL_TOOLS.map(t => [t.schema.name, t.execute.bind(t)]));

module.exports = { toolSchemas, toolExecutors };
