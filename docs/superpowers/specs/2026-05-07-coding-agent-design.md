# anyai-cli: Coding Agent Design

**Date:** 2026-05-07  
**Status:** Approved

---

## Overview

Transform anyai-cli from a chatbot CLI into an autonomous coding agent. The agent uses native provider tool-calling (structured JSON) to execute file operations and shell commands in the user's workspace. Agent mode is the default; users can toggle to passive chat mode with `/chat` and back with `/agent`.

---

## Decisions

| Topic | Decision |
|-------|----------|
| Tool-calling approach | Structured JSON (Option A) — native provider tool-use API |
| Default mode | Agent mode |
| Mode switching | `/chat` → passive, `/agent` → agent |
| Workspace scan | Smart B — package.json, README (30 lines), top-level tree; on-demand file reads |
| Shell safety | Risk-tiered: safe auto-run, risky single-confirm, destructive double-confirm, blocked hard-stop |

---

## Architecture

```
anyai-cli
├── bin/anyai.js                      (unchanged)
├── src/
│   ├── commands/
│   │   └── interactive.js            (add agentMode flag, /agent /chat commands, --agent startup flag)
│   ├── agent/
│   │   ├── index.js                  (AgentLoop — orchestrates tool-call cycles)
│   │   ├── systemPrompt.js           (builds system prompt with tool schemas + workspace context)
│   │   └── context.js                (workspace snapshot: cwd, package.json, README, dir tree)
│   ├── tools/
│   │   ├── index.js                  (tool registry — exports all schemas + execute fns)
│   │   ├── fileTool.js               (read_file, write_file, edit_file, delete_file, list_dir)
│   │   ├── shellTool.js              (run_command)
│   │   └── searchTool.js             (search_files, find_files)
│   └── executor/
│       ├── index.js                  (dispatches tool calls to correct tool module)
│       └── safety.js                 (risk classification + confirmation prompts)
```

---

## Agent Loop (`agent/index.js`)

Max iterations: **10** (hard stop with user warning).

```
AgentLoop.run(userMessage, history)
  1. append { role: 'user', content: userMessage } to history
  2. call provider.chat(history, { tools: toolSchemas, system: systemPrompt })
  3. if stop_reason === 'tool_use':
       a. append { role: 'assistant', content: response.content } to history
          ↑ REQUIRED — contains tool_use blocks; Anthropic enforces strict alternation
       b. for each tool_call in response.content (type === 'tool_use'):
            - renderCommandBlock(tool_call.name, formatArgs(tool_call.input))
            - result = await executor.dispatch(tool_call.name, tool_call.input)
       c. append {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: tool_call.id,
                content: JSON.stringify(result)
              },
              // ...one entry per tool_call, all batched in single user message
            ]
          } to history
       d. loop → step 2
  4. if stop_reason === 'end_turn':
       render final text response to terminal
       return
```

### Anthropic tool_result payload structure

```javascript
// All results from one assistant turn batched into a SINGLE user message:
{
  role: 'user',
  content: [
    {
      type: 'tool_result',
      tool_use_id: 'toolu_abc123',      // matches tool_use block id
      content: '{"success":true}'        // string — JSON.stringify(result)
    },
    {
      type: 'tool_result',
      tool_use_id: 'toolu_def456',
      content: '{"success":false,"error":"File not found"}'
    }
  ]
}
```

---

## Tool System

All tools export `{ schema, execute }`. The registry (`tools/index.js`) aggregates schemas for injection into provider calls and maps names to execute functions.

### fileTool.js

| Tool | Required Args | Notes |
|------|--------------|-------|
| `read_file` | `path` | Returns file contents as string |
| `write_file` | `path`, `content` | Creates or overwrites |
| `edit_file` | `filepath`, `old_str`, `new_str` | Fuzzy whitespace-agnostic replacement (see below) |
| `delete_file` | `path` | Always risky tier |
| `list_dir` | `path?` | Defaults to cwd |

**`edit_file` fuzzy replacement algorithm:**

1. **Exact match** — fast path via `content.includes(old_str)`
2. **Fuzzy sliding window** — trim each line of `old_str` and file, find matching block
3. **`reindent()`** — strip `new_str`'s own base indent, apply file's detected indent at match position
4. Return `{ success: false }` if neither strategy finds a match (file unchanged)

The model does not need to match indentation exactly in `old_str` or `new_str`.

### shellTool.js

| Tool | Required Args | Notes |
|------|--------------|-------|
| `run_command` | `command` | Runs via `child_process.exec` in cwd |

### searchTool.js

| Tool | Required Args | Notes |
|------|--------------|-------|
| `search_files` | `pattern`, `glob?` | Content search (ripgrep-style) |
| `find_files` | `glob` | File name pattern match |

---

## Safety Layer (`executor/safety.js`)

### Risk tiers

| Tier | Examples | Behavior |
|------|----------|----------|
| `safe` | `mkdir`, `touch`, `cat`, `ls`, `echo`, `pwd`, `node`, `git status`, `git log` | Auto-execute, no prompt |
| `risky` | `rm <file>`, `git reset`, `git checkout`, `npm install`, `pip install`, `mv`, `cp` | Single confirm: `? Run: <command> (Y/n)` |
| `destructive` | `rm -rf`, `git reset --hard`, `git clean -f`, `DROP TABLE`, `truncate` | Double confirm: prompt → must type `yes` |
| `blocked` | `shutdown`, `reboot`, `mkfs`, `dd if=`, `curl \| bash`, `wget \| sh` | Hard block — print reason, do not execute |

`delete_file` tool always maps to `risky` regardless of path.

### Confirmation UX

```
# Risky — single confirm
? Run: rm old_file.txt (Y/n) › 

# Destructive — double confirm
⚠ Destructive: git reset --hard
? Are you sure? (Y/n) › y
? Type "yes" to confirm › yes

# Blocked
✖ Blocked: curl | bash — arbitrary remote code execution not permitted
```

---

## System Prompt (`agent/systemPrompt.js`)

```
You are AnyAI, an autonomous coding agent running in the user's terminal.
Working directory: {cwd}

Project context:
{context}

You have access to tools: read_file, write_file, edit_file, delete_file,
list_dir, run_command, search_files, find_files.

Rules:
- Always act. Create files, run commands, edit code — don't just explain.
- Before acting, state in one line what you're about to do.
- Read files before editing them.
- Use search_files before assuming a file doesn't exist.
- Use list_dir or find_files before guessing file paths.
- When using edit_file, make old_str unique enough to identify the exact block.
- Do not try to match indentation exactly in old_str or new_str — the system re-aligns automatically.
- Do NOT ask the user for permission before using tools. Use them. The system handles safety prompts.
```

---

## Workspace Context (`agent/context.js`)

Loaded once on session start, injected into system prompt:

1. `process.cwd()` — absolute path
2. `package.json` — name, version, scripts, main dependencies (if exists)
3. `README.md` — first 30 lines (if exists)
4. Top-level `fs.readdir(cwd)` — file/folder names, 1 level deep

Files mentioned by the user are read on-demand via `read_file` tool call.

---

## Mode Switching

`interactive.js` gains an `agentMode` boolean (default: `true`).

| Input | Effect |
|-------|--------|
| `anyai --agent` | Start in agent mode (already default, flag is explicit opt-in) |
| `/chat` | `agentMode = false` — passive chatbot, no tool calls |
| `/agent` | `agentMode = true` — restore agent behavior |

When `agentMode === false`: messages go directly to `provider.chat()` without tools injected. No tool parsing.

---

## UX Rendering

Reuses existing `renderCommandBlock` / `renderError` from `src/ui/renderers.js`.

```
────────────────────────────────────
> write_file
  ↳ hello.py — Python hello world script
────────────────────────────────────

✔ File created successfully
```

---

## Error Handling

- Tool execute errors → returned as `{ success: false, error: string }` → injected as `tool_result` so model can self-correct
- Provider API errors → caught in AgentLoop, rendered via `renderError`, loop exits
- Max iterations hit → print warning: `Agent stopped after 10 tool calls. Continue? (Y/n)`
- Safety block → `tool_result` contains blocked message so model knows to stop or try alternate approach

---

## Out of Scope

- Multi-file diff preview before applying edits
- Undo/revert of agent actions
- Plugin/custom tool system
- Non-Anthropic providers' tool-use differences (handled via provider abstraction layer in follow-up)
