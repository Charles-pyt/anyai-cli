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
    const wasRaw = process.stdin.isRaw;
    if (wasRaw) process.stdin.setRawMode(false);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => {
      rl.close();
      if (wasRaw) process.stdin.setRawMode(true);
      resolve(answer.trim());
    });
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
