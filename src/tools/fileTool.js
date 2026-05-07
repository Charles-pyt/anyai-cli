// src/tools/fileTool.js
const fs = require('fs/promises');
const path = require('path');

const readFile = {
  schema: {
    name: 'read_file',
    description: 'Read the contents of a file. Use this before editing.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the file (relative to cwd or absolute)' }
      },
      required: ['path']
    }
  },
  async execute({ path: filePath }) {
    const absPath = path.resolve(process.cwd(), filePath);
    try {
      const content = await fs.readFile(absPath, 'utf8');
      return { success: true, content };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

const writeFile = {
  schema: {
    name: 'write_file',
    description: 'Create or overwrite a file with given content.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the file' },
        content: { type: 'string', description: 'Content to write' }
      },
      required: ['path', 'content']
    }
  },
  async execute({ path: filePath, content }) {
    const absPath = path.resolve(process.cwd(), filePath);
    try {
      await fs.mkdir(path.dirname(absPath), { recursive: true });
      await fs.writeFile(absPath, content, 'utf8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

const listDir = {
  schema: {
    name: 'list_dir',
    description: 'List files and folders in a directory.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path (defaults to current working directory)' }
      },
      required: []
    }
  },
  async execute({ path: dirPath } = {}) {
    const absPath = path.resolve(process.cwd(), dirPath || '.');
    try {
      const entries = await fs.readdir(absPath, { withFileTypes: true });
      const items = entries.map(e => (e.isDirectory() ? `${e.name}/` : e.name));
      return { success: true, items };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

module.exports = { readFile, writeFile, listDir };
