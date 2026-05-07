# Coding Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform anyai-cli into an autonomous coding agent that uses structured JSON tool-calling to create/edit/delete files and run shell commands in the user's workspace.

**Architecture:** An `AgentLoop` orchestrates multi-turn provider calls with tool schemas injected. A `safety.js` risk-tiers every shell command before execution. `interactive.js` defaults to agent mode with `/chat` and `/agent` toggles.

**Tech Stack:** Node.js (fs/promises, child_process), chalk, inquirer, existing axios-based provider layer.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/tools/fileTool.js` | read_file, write_file, edit_file (fuzzy), delete_file, list_dir |
| Create | `src/tools/shellTool.js` | run_command schema + execute |
| Create | `src/tools/searchTool.js` | search_files, find_files |
| Create | `src/tools/index.js` | Tool registry — aggregates schemas + dispatch map |
| Create | `src/executor/safety.js` | Risk classification + confirmation prompts |
| Create | `src/executor/index.js` | Dispatches tool calls → correct tool.execute() |
| Create | `src/agent/context.js` | Workspace snapshot (cwd, package.json, README, dir tree) |
| Create | `src/agent/systemPrompt.js` | Builds system prompt string with context + rules |
| Create | `src/agent/index.js` | AgentLoop.run() — multi-turn tool-call orchestration |
| Modify | `src/providers/anthropic.js` | Add tool-use support to chat() method |
| Modify | `src/commands/interactive.js` | Add agentMode flag, /agent /chat handlers, wire AgentLoop |
| Modify | `src/ui/commandPalette.js` | Add /agent and /chat to COMMANDS list |

---

## Task 1: fileTool.js — read_file, write_file, list_dir

**Files:**
- Create: `src/tools/fileTool.js`

- [ ] **Step 1: Create the file with read_file, write_file, list_dir**

```javascript
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
```

- [ ] **Step 2: Smoke-test manually**

```bash
node -e "
const { readFile, writeFile, listDir } = require('./src/tools/fileTool');
writeFile.execute({ path: 'tmp_test.txt', content: 'hello' })
  .then(() => readFile.execute({ path: 'tmp_test.txt' }))
  .then(r => console.log('read:', r))
  .then(() => listDir.execute({}))
  .then(r => console.log('list:', r.items.slice(0,5)))
"
```

Expected output:
```
read: { success: true, content: 'hello' }
list: [ ... top-level files ... ]
```

- [ ] **Step 3: Cleanup temp file**

```bash
node -e "require('fs').unlinkSync('tmp_test.txt')"
```

- [ ] **Step 4: Commit**

```bash
git add src/tools/fileTool.js
git commit -m "feat: add fileTool read_file, write_file, list_dir"
```

---

## Task 2: fileTool.js — edit_file (fuzzy replacement)

**Files:**
- Modify: `src/tools/fileTool.js`

- [ ] **Step 1: Add helper functions and editFile tool to fileTool.js**

Add after the `listDir` export block, before `module.exports`:

```javascript
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
```

- [ ] **Step 2: Update module.exports**

Replace `module.exports = { readFile, writeFile, listDir };` with:

```javascript
module.exports = { readFile, writeFile, listDir, editFile };
```

- [ ] **Step 3: Smoke-test fuzzy replacement**

```bash
node -e "
const { writeFile, editFile, readFile } = require('./src/tools/fileTool');
writeFile.execute({ path: 'tmp_edit.js', content: 'function hello() {\n  return 1;\n}\n' })
  .then(() => editFile.execute({ filepath: 'tmp_edit.js', old_str: 'function hello() {\n  return 1;\n}', new_str: 'function hello() {\n  return 42;\n}' }))
  .then(r => console.log('edit result:', r))
  .then(() => readFile.execute({ path: 'tmp_edit.js' }))
  .then(r => console.log('content:', r.content))
"
```

Expected:
```
edit result: { success: true, method: 'exact' }
content: function hello() {
  return 42;
}
```

- [ ] **Step 4: Cleanup and commit**

```bash
node -e "require('fs').unlinkSync('tmp_edit.js')"
git add src/tools/fileTool.js
git commit -m "feat: add edit_file with fuzzy whitespace-agnostic replacement"
```

---

## Task 3: fileTool.js — delete_file

**Files:**
- Modify: `src/tools/fileTool.js`

- [ ] **Step 1: Add deleteFile tool**

Add before `module.exports`, after `editFile`:

```javascript
const deleteFile = {
  schema: {
    name: 'delete_file',
    description: 'Delete a file. Will prompt for confirmation before executing.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to the file to delete' }
      },
      required: ['path']
    }
  },
  async execute({ path: filePath }) {
    const absPath = path.resolve(process.cwd(), filePath);
    try {
      await fs.unlink(absPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
```

- [ ] **Step 2: Update module.exports**

```javascript
module.exports = { readFile, writeFile, listDir, editFile, deleteFile };
```

- [ ] **Step 3: Commit**

```bash
git add src/tools/fileTool.js
git commit -m "feat: add delete_file tool"
```

---

## Task 4: shellTool.js

**Files:**
- Create: `src/tools/shellTool.js`

- [ ] **Step 1: Create shellTool.js**

```javascript
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
```

- [ ] **Step 2: Smoke-test**

```bash
node -e "
const { runCommand } = require('./src/tools/shellTool');
runCommand.execute({ command: 'echo hello from shell' }).then(r => console.log(r));
"
```

Expected:
```
{ success: true, stdout: 'hello from shell', stderr: '' }
```

- [ ] **Step 3: Commit**

```bash
git add src/tools/shellTool.js
git commit -m "feat: add shellTool run_command"
```

---

## Task 5: searchTool.js

**Files:**
- Create: `src/tools/searchTool.js`

- [ ] **Step 1: Create searchTool.js**

```javascript
// src/tools/searchTool.js
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs/promises');

async function grepFallback(pattern, cwd, glob) {
  // Pure Node.js fallback: walk files and grep with RegExp
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
    const matches = await grepFallback(pattern, cwd, glob);
    if (matches.length === 0) return { success: true, matches: [], message: 'No matches found' };
    return { success: true, matches: matches.slice(0, 50) };
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
```

- [ ] **Step 2: Smoke-test**

```bash
node -e "
const { findFiles, searchFiles } = require('./src/tools/searchTool');
findFiles.execute({ glob: '*.js' }).then(r => console.log('js files:', r.files.slice(0,3)));
searchFiles.execute({ pattern: 'module.exports' }).then(r => console.log('matches:', r.matches.slice(0,2)));
"
```

Expected: lists `.js` files and lines containing `module.exports`.

- [ ] **Step 3: Commit**

```bash
git add src/tools/searchTool.js
git commit -m "feat: add searchTool search_files and find_files"
```

---

## Task 6: Tool Registry (tools/index.js)

**Files:**
- Create: `src/tools/index.js`

- [ ] **Step 1: Create tools/index.js**

```javascript
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
```

- [ ] **Step 2: Smoke-test**

```bash
node -e "
const { toolSchemas, toolExecutors } = require('./src/tools/index');
console.log('schemas:', toolSchemas.map(s => s.name));
console.log('executors:', Object.keys(toolExecutors));
"
```

Expected:
```
schemas: ['read_file', 'write_file', 'list_dir', 'edit_file', 'delete_file', 'run_command', 'search_files', 'find_files']
executors: ['read_file', 'write_file', 'list_dir', 'edit_file', 'delete_file', 'run_command', 'search_files', 'find_files']
```

- [ ] **Step 3: Commit**

```bash
git add src/tools/index.js
git commit -m "feat: add tool registry"
```

---

## Task 7: Safety Layer (executor/safety.js)

**Files:**
- Create: `src/executor/safety.js`

- [ ] **Step 1: Create executor/safety.js**

```javascript
// src/executor/safety.js
const readline = require('readline');

// Patterns checked in order. First match wins.
const BLOCKED = [
  /shutdown/i, /reboot/i, /mkfs/i, /\bdd\s+if=/i,
  /curl\s+.*\|\s*(bash|sh)/i, /wget\s+.*\|\s*(bash|sh)/i,
  /format\s+[a-z]:/i
];

const DESTRUCTIVE = [
  /rm\s+-rf/i, /rm\s+-fr/i,
  /git\s+reset\s+--hard/i, /git\s+clean\s+-f/i,
  /drop\s+table/i, /truncate\s+table/i
];

const RISKY = [
  /\brm\b/i, /git\s+reset/i, /git\s+checkout/i,
  /npm\s+install/i, /npm\s+ci/i, /yarn\s+install/i,
  /pip\s+install/i, /\bmv\b/i, /\bcp\b/i,
  /git\s+push/i, /git\s+rebase/i
];

function classify(command) {
  if (BLOCKED.some(r => r.test(command))) return 'blocked';
  if (DESTRUCTIVE.some(r => r.test(command))) return 'destructive';
  if (RISKY.some(r => r.test(command))) return 'risky';
  return 'safe';
}

function askQuestion(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => { rl.close(); resolve(answer.trim()); });
  });
}

async function checkSafety(toolName, args) {
  // delete_file is always risky
  if (toolName === 'delete_file') {
    const answer = await askQuestion(`? Delete file: ${args.path} (Y/n) › `);
    if (answer.toLowerCase() === 'n') return { allowed: false, reason: 'User declined delete' };
    return { allowed: true };
  }

  if (toolName !== 'run_command') return { allowed: true };

  const { command } = args;
  const tier = classify(command);

  if (tier === 'blocked') {
    return { allowed: false, reason: `Blocked: ${command} — potentially destructive system command` };
  }

  if (tier === 'destructive') {
    process.stdout.write(`\n⚠  Destructive: ${command}\n`);
    const first = await askQuestion('? Are you sure? (Y/n) › ');
    if (first.toLowerCase() === 'n') return { allowed: false, reason: 'User declined' };
    const second = await askQuestion('? Type "yes" to confirm › ');
    if (second !== 'yes') return { allowed: false, reason: 'User did not confirm' };
    return { allowed: true };
  }

  if (tier === 'risky') {
    const answer = await askQuestion(`? Run: ${command} (Y/n) › `);
    if (answer.toLowerCase() === 'n') return { allowed: false, reason: 'User declined' };
    return { allowed: true };
  }

  return { allowed: true };
}

module.exports = { checkSafety, classify };
```

- [ ] **Step 2: Smoke-test classify function**

```bash
node -e "
const { classify } = require('./src/executor/safety');
console.log(classify('ls -la'));           // safe
console.log(classify('npm install'));      // risky
console.log(classify('rm -rf /'));         // destructive
console.log(classify('curl x | bash'));    // blocked
"
```

Expected:
```
safe
risky
destructive
blocked
```

- [ ] **Step 3: Commit**

```bash
git add src/executor/safety.js
git commit -m "feat: add safety layer with risk-tiered command classification"
```

---

## Task 8: Executor (executor/index.js)

**Files:**
- Create: `src/executor/index.js`

- [ ] **Step 1: Create executor/index.js**

```javascript
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
```

- [ ] **Step 2: Smoke-test dispatch with a safe command**

```bash
node -e "
const { dispatch } = require('./src/executor/index');
dispatch('list_dir', {}).then(r => console.log('result:', r.success));
"
```

Expected: renders a command block, prints `✔ Done`, logs `result: true`.

- [ ] **Step 3: Commit**

```bash
git add src/executor/index.js
git commit -m "feat: add executor dispatcher with safety integration"
```

---

## Task 9: Workspace Context (agent/context.js)

**Files:**
- Create: `src/agent/context.js`

- [ ] **Step 1: Create agent/context.js**

```javascript
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
```

- [ ] **Step 2: Smoke-test**

```bash
node -e "
const { loadContext } = require('./src/agent/context');
loadContext().then(ctx => console.log(ctx.slice(0, 300)));
"
```

Expected: prints cwd, package.json summary, top-level files.

- [ ] **Step 3: Commit**

```bash
git add src/agent/context.js
git commit -m "feat: add workspace context loader"
```

---

## Task 10: System Prompt (agent/systemPrompt.js)

**Files:**
- Create: `src/agent/systemPrompt.js`

- [ ] **Step 1: Create agent/systemPrompt.js**

```javascript
// src/agent/systemPrompt.js
function buildSystemPrompt(context) {
  return `You are AnyAI, an autonomous coding agent running in the user's terminal.

${context}

You have access to these tools: read_file, write_file, edit_file, delete_file, list_dir, run_command, search_files, find_files.

Rules:
- Always act. Create files, run commands, edit code — don't just explain.
- Before acting, state in one line what you're about to do.
- Read files before editing them.
- Use search_files before assuming a file doesn't exist.
- Use list_dir or find_files before guessing file paths.
- When using edit_file, make old_str long enough to be unique in the file.
- Do not try to match indentation exactly in old_str or new_str — the system re-aligns automatically.
- Do NOT ask the user for permission before using tools. Use them. The system handles safety prompts.`;
}

module.exports = { buildSystemPrompt };
```

- [ ] **Step 2: Smoke-test**

```bash
node -e "
const { buildSystemPrompt } = require('./src/agent/systemPrompt');
console.log(buildSystemPrompt('Working directory: /tmp').slice(0, 200));
"
```

Expected: prints start of system prompt with the context injected.

- [ ] **Step 3: Commit**

```bash
git add src/agent/systemPrompt.js
git commit -m "feat: add agent system prompt builder"
```

---

## Task 11: Anthropic provider — tool-use support

**Files:**
- Modify: `src/providers/anthropic.js`

The current `chat()` sends messages and returns `response.data.content[0].text`. We need it to handle tool-use responses and accept a `tools` option and `system` prompt.

- [ ] **Step 1: Update chat() in anthropic.js**

Replace the entire `chat(messages, options = {})` method (lines 53–84) with:

```javascript
async chat(messages, options = {}) {
  if (!this.apiKey) {
    throw new Error('Anthropic API key not set');
  }

  const model = options.model || this.model || this.getDefaultModel();

  const body = {
    model,
    max_tokens: options.maxTokens || 4096,
    messages,
  };

  if (options.system) body.system = options.system;
  if (options.tools && options.tools.length > 0) body.tools = options.tools;

  try {
    const response = await axios.post(
      `${this.baseUrl}/messages`,
      body,
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;

    // Return full response object when tools are involved
    if (options.tools && options.tools.length > 0) {
      return {
        stop_reason: data.stop_reason,
        content: data.content,
        // Convenience: extract plain text if present
        text: data.content.find(b => b.type === 'text')?.text || null,
      };
    }

    // Legacy path: plain chat — return text string as before
    return data.content[0].text;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Invalid Anthropic API key');
    }
    throw new Error(`Anthropic API error: ${error.message}`);
  }
}
```

- [ ] **Step 2: Verify syntax**

```bash
node -e "require('./src/providers/anthropic')" && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add src/providers/anthropic.js
git commit -m "feat: add tool-use and system prompt support to Anthropic provider"
```

---

## Task 12: AgentLoop (agent/index.js)

**Files:**
- Create: `src/agent/index.js`

- [ ] **Step 1: Create agent/index.js**

```javascript
// src/agent/index.js
const { toolSchemas } = require('../tools/index');
const { dispatch } = require('../executor/index');
const { buildSystemPrompt } = require('./systemPrompt');
const { loadContext } = require('./context');
const { renderError } = require('../ui/renderers');
const colors = require('../ui/colors');
const spinner = require('../ui/spinner');

const MAX_ITERATIONS = 10;

async function run(userMessage, history, provider, config) {
  const context = await loadContext();
  const systemPrompt = buildSystemPrompt(context);

  history.push({ role: 'user', content: userMessage });

  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    spinner.start('Thinking...');

    let response;
    try {
      response = await provider.chat(history, {
        model: config.model,
        system: systemPrompt,
        tools: toolSchemas,
      });
    } catch (err) {
      spinner.stop();
      renderError('agent', err.message);
      return;
    }

    spinner.stop();

    if (response.stop_reason === 'tool_use') {
      // Append assistant message FIRST (required for Anthropic alternation)
      history.push({ role: 'assistant', content: response.content });

      // Print any text the model included before tool calls
      if (response.text) {
        process.stdout.write('\n' + colors.accent('AI: ') + response.text + '\n\n');
      }

      // Execute all tool calls and collect results
      const toolResults = [];
      const toolCalls = response.content.filter(b => b.type === 'tool_use');

      for (const toolCall of toolCalls) {
        const result = await dispatch(toolCall.name, toolCall.input);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Batch all results into single user message
      history.push({ role: 'user', content: toolResults });

      // Continue loop
      continue;
    }

    // stop_reason === 'end_turn' — final response
    const text = typeof response === 'string' ? response : response.text;
    if (text) {
      process.stdout.write('\n' + colors.accent('AI: ') + text + '\n\n');
    }
    return;
  }

  // Max iterations reached
  process.stdout.write(colors.warning(`\nAgent stopped after ${MAX_ITERATIONS} tool calls.\n\n`));
}

module.exports = { run };
```

- [ ] **Step 2: Verify syntax**

```bash
node -e "require('./src/agent/index')" && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add src/agent/index.js
git commit -m "feat: add AgentLoop with multi-turn tool-call orchestration"
```

---

## Task 13: Wire interactive.js — agent mode + /agent /chat commands

**Files:**
- Modify: `src/commands/interactive.js`
- Modify: `src/ui/commandPalette.js`

- [ ] **Step 1: Add /agent and /chat to commandPalette.js COMMANDS array**

In `src/ui/commandPalette.js`, find:
```javascript
  { name: '/exit', desc: 'Quit anyai' },
```

Replace with:
```javascript
  { name: '/agent', desc: 'Switch to agent mode (default)' },
  { name: '/chat', desc: 'Switch to passive chat mode' },
  { name: '/exit', desc: 'Quit anyai' },
```

- [ ] **Step 2: Add agentMode + agent import to interactive.js**

At the top of `src/commands/interactive.js`, add after the existing requires:

```javascript
const agentLoop = require('../agent/index');
```

In `startInputLoop`, add `agentMode` to the local state variables (after `let sessionCost = 0;`):

```javascript
let agentMode = true;
```

- [ ] **Step 3: Add /agent and /chat handlers in handleCommand**

In `handleCommand`, add before the final `renderError(cmd, ...)` fallback:

```javascript
    if (cmd === '/agent') {
      agentMode = true;
      renderCommandBlock('/agent', 'Agent mode enabled');
      writePrompt();
      return;
    }

    if (cmd === '/chat') {
      agentMode = false;
      renderCommandBlock('/chat', 'Chat mode enabled — no tools');
      writePrompt();
      return;
    }
```

- [ ] **Step 4: Update handleMessage to branch on agentMode**

Replace the entire `handleMessage` function with:

```javascript
  async function handleMessage(input) {
    stdout.write('\n');

    if (agentMode) {
      try {
        await agentLoop.run(input, messages, provider, config);
      } catch (error) {
        renderError('agent', error.message);
      }
    } else {
      messages.push({ role: 'user', content: input });
      spinner.start('Thinking...');
      try {
        const response = await provider.chat(messages, { model: config.model });
        spinner.stop();
        messages.push({ role: 'assistant', content: response });
        const contextText = messages.map(m => typeof m.content === 'string' ? m.content : '').join('\n');
        const responseTokens = estimateTokens(response);
        const inputTokens = estimateTokens(contextText) - responseTokens;
        const totalTokens = inputTokens + responseTokens;
        const activeModel = config.model || provider.getDefaultModel();
        const cost = estimateCost(totalTokens, activeModel);
        sessionTokens += totalTokens;
        sessionCost += cost;
        updateLifetimeStats(activeModel, totalTokens, cost);
        logger.log('');
        console.log(colors.accent('AI: ') + response);
        logger.log('');
      } catch (error) {
        spinner.fail(error.message);
        messages.pop();
        logger.log('');
      }
    }

    writePrompt();
  }
```

- [ ] **Step 5: Update the startup info message to reflect agent mode default**

In `interactiveCommand()`, find:
```javascript
  logger.info('Type a message or / for commands. Tab to autocomplete.');
```
Replace with:
```javascript
  logger.info('Agent mode active. Type a message or / for commands. Tab to autocomplete.');
```

- [ ] **Step 6: Verify syntax**

```bash
node -e "require('./src/commands/interactive')" && echo "OK"
node -e "require('./src/ui/commandPalette')" && echo "OK"
```

Expected: `OK` twice.

- [ ] **Step 7: Commit**

```bash
git add src/commands/interactive.js src/ui/commandPalette.js
git commit -m "feat: wire agent mode into interactive session with /agent /chat toggles"
```

---

## Task 14: End-to-end smoke test

- [ ] **Step 1: Create a test workspace**

```bash
mkdir -p /tmp/agent-test && cd /tmp/agent-test
```

- [ ] **Step 2: Run anyai and verify agent responds with tool calls**

Start the CLI:
```bash
node /path/to/anyai-cli/bin/anyai.js
```

Type: `create a file called hello.py that prints Hello World`

Expected behavior:
1. Spinner shows "Thinking..."
2. Command block renders: `> write_file` / `↳ hello.py`
3. `✔ Done` printed
4. AI responds: "I created hello.py ..."

- [ ] **Step 3: Verify the file was actually created**

```bash
cat /tmp/agent-test/hello.py
```

Expected: Python hello world script.

- [ ] **Step 4: Test /chat toggle**

Type `/chat` — verify command block shows "Chat mode enabled".
Send a message — verify no tool calls are made, plain AI response returns.

Type `/agent` — verify agent mode restored.

- [ ] **Step 5: Test safety — risky command**

Ask agent: `run npm install`
Expected: prompt appears `? Run: npm install (Y/n) ›`
Type `n` — verify execution is skipped, AI notified via tool_result.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: coding agent MVP complete"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Workspace awareness — `agent/context.js` Task 9
- ✅ File operations — `fileTool.js` Tasks 1–3
- ✅ Shell commands — `shellTool.js` Task 4
- ✅ search/find — `searchTool.js` Task 5
- ✅ Tool registry — Task 6
- ✅ Safety layer (all 4 tiers) — Task 7
- ✅ Executor dispatcher — Task 8
- ✅ System prompt with all rules — Task 10
- ✅ Anthropic tool-use API — Task 11
- ✅ AgentLoop with history chain fix — Task 12
- ✅ Mode switching /agent /chat — Task 13
- ✅ UX uses existing renderCommandBlock — executor/index.js Task 8

**Type/name consistency check:**
- `agentLoop.run(input, messages, provider, config)` — matches `agent/index.js` export signature ✅
- `dispatch(toolName, input)` — matches executor/index.js ✅
- `checkSafety(toolName, args)` — matches safety.js ✅
- `toolSchemas` / `toolExecutors` — matches tools/index.js ✅
- `loadContext()` / `buildSystemPrompt(context)` — chain matches Tasks 9→10→12 ✅
