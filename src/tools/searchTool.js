// src/tools/searchTool.js
const path = require('path');
const fs = require('fs/promises');

async function grepFallback(pattern, cwd, glob) {
  async function walk(dir) {
    let results = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) results = results.concat(await walk(full));
      else results.push(full);
    }
    return results;
  }

  const files = await walk(cwd);
  const re = new RegExp(pattern, 'i');
  const matches = [];
  for (const file of files) {
    if (glob && !file.endsWith(glob.replace('*', ''))) continue;
    try {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (re.test(line)) matches.push(`${path.relative(cwd, file)}:${i + 1}: ${line.trim()}`);
      });
    } catch (_) {}
  }
  return matches;
}

const searchFiles = {
  schema: {
    name: 'search_files',
    description: 'Search file contents for a pattern. Returns matching lines with file:line references.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Search pattern (regex supported)' },
        glob: { type: 'string', description: 'Optional file extension filter e.g. "*.js"' }
      },
      required: ['pattern']
    }
  },
  async execute({ pattern, glob }) {
    const cwd = process.cwd();
    let re;
    try {
      re = new RegExp(pattern, 'i');
    } catch (err) {
      return { success: false, error: `Invalid regex: ${err.message}` };
    }
    try {
      const matches = await grepFallback(pattern, cwd, glob);
      if (matches.length === 0) return { success: true, matches: [], message: 'No matches found' };
      return { success: true, matches: matches.slice(0, 50) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

async function findFallback(globPattern, cwd) {
  async function walk(dir) {
    let results = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) results = results.concat(await walk(full));
      else results.push(path.relative(cwd, full));
    }
    return results;
  }
  const all = await walk(cwd);
  const ext = globPattern.replace(/\*/g, '');
  return all.filter(f => f.endsWith(ext));
}

const findFiles = {
  schema: {
    name: 'find_files',
    description: 'Find files by name pattern. Returns relative paths.',
    input_schema: {
      type: 'object',
      properties: {
        glob: { type: 'string', description: 'Glob pattern e.g. "*.js", "*.md"' }
      },
      required: ['glob']
    }
  },
  async execute({ glob }) {
    const cwd = process.cwd();
    try {
      const files = await findFallback(glob, cwd);
      return { success: true, files: files.slice(0, 100) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

module.exports = { searchFiles, findFiles };
