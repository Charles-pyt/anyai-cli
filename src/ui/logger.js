const colors = require('./colors');

class Logger {
  success(message) {
    console.log(colors.success(`[✓] ${message}`));
  }

  error(message) {
    console.log(colors.error(`[err] ${message}`));
  }

  info(message) {
    console.log(colors.primary(`[i] ${message}`));
  }

  warning(message) {
    console.log(colors.warning(`[!] ${message}`));
  }

  log(message) {
    console.log(message);
  }

  debug(message) {
    if (process.env.DEBUG) {
      console.log(colors.secondary(`[DEBUG] ${message}`));
    }
  }

  clear() {
    console.clear();
  }

  separator() {
    console.log(colors.secondary('─'.repeat(60)));
  }
}

module.exports = new Logger();
