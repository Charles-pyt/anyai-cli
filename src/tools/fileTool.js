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

function findFuzzyBlock(contentLines, oldLines) {
  for (let i = 0; i <= contentLines.length - oldLines.length; i++) {
    let ok = true;
    for (let j = 0; j < oldLines.length; j++) {
      if (contentLines[i + j].trim() !== oldLines[j]) { ok = false; break; }
    }
    if (ok) return { start: i, end: i + oldLines.length - 1 };
  }
  return null;
}

function reindent(str, baseIndent) {
  const lines = str.split('\n');
  const minIndent = lines
    .filter(l => l.trim().length > 0)
    .reduce((min, l) => Math.min(min, l.match(/^(\s*)/)[1].length), Infinity);
  const strip = isFinite(minIndent) ? minIndent : 0;
  return lines.map(l => (l.trim() ? baseIndent + l.slice(strip) : l)).join('\n');
}

const editFile = {
  schema: {
    name: 'edit_file',
    description: 'Replace a unique string in a file. old_str must identify an exact block. Indentation is matched automatically.',
    input_schema: {
      type: 'object',
      properties: {
        filepath: { type: 'string', description: 'Path to the file' },
        old_str: { type: 'string', description: 'The exact block to replace (indentation-tolerant)' },
        new_str: { type: 'string', description: 'The replacement block' }
      },
      required: ['filepath', 'old_str', 'new_str']
    }
  },
  async execute({ filepath, old_str, new_str }) {
    const absPath = path.resolve(process.cwd(), filepath);
    let content;
    try {
      content = await fs.readFile(absPath, 'utf8');
    } catch (err) {
      return { success: false, error: `Cannot read file: ${err.message}` };
    }

    // Strategy 1: exact match
    if (content.includes(old_str)) {
      await fs.writeFile(absPath, content.replace(old_str, new_str), 'utf8');
      return { success: true, method: 'exact' };
    }

    // Strategy 2: fuzzy sliding window
    const contentLines = content.split('\n');
    const oldLines = old_str.split('\n').map(l => l.trim());
    const match = findFuzzyBlock(contentLines, oldLines);
    if (match !== null) {
      const baseIndent = contentLines[match.start].match(/^(\s*)/)[1];
      const indentedNew = reindent(new_str, baseIndent);
      const result = [
        ...contentLines.slice(0, match.start),
        ...indentedNew.split('\n'),
        ...contentLines.slice(match.end + 1),
      ].join('\n');
      await fs.writeFile(absPath, result, 'utf8');
      return { success: true, method: 'fuzzy' };
    }

    return { success: false, error: 'old_str not found (exact or fuzzy). File unchanged.' };
  }
};

module.exports = { readFile, writeFile, listDir, editFile };
