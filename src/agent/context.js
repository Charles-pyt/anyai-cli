// src/agent/context.js
const fs = require('fs/promises');
const path = require('path');

async function loadContext() {
  const cwd = process.cwd();
  const parts = [`Working directory: ${cwd}`];

  // package.json
  try {
    const raw = await fs.readFile(path.join(cwd, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw);
    const deps = Object.keys(pkg.dependencies || {}).slice(0, 15).join(', ');
    const scripts = Object.keys(pkg.scripts || {}).join(', ');
    parts.push(`package.json: name=${pkg.name}, version=${pkg.version}, scripts=[${scripts}], deps=[${deps}]`);
  } catch (_) {}

  // README.md — first 30 lines
  try {
    const raw = await fs.readFile(path.join(cwd, 'README.md'), 'utf8');
    const lines = raw.split('\n').slice(0, 30).join('\n');
    parts.push(`README (first 30 lines):\n${lines}`);
  } catch (_) {}

  // Top-level directory listing
  try {
    const entries = await fs.readdir(cwd, { withFileTypes: true });
    const items = entries
      .filter(e => !e.name.startsWith('.'))
      .map(e => (e.isDirectory() ? `${e.name}/` : e.name));
    parts.push(`Top-level files: ${items.join(', ')}`);
  } catch (_) {}

  return parts.join('\n\n');
}

module.exports = { loadContext };
