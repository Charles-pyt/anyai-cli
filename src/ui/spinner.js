const ora = require('ora');
const colors = require('./colors');

class Spinner {
  constructor() {
    this.spinner = null;
  }

  start(message = 'Loading...') {
    this.spinner = ora({
      text: colors.primary(message),
      color: 'cyan',
    }).start();
  }

  succeed(message = 'Done') {
    if (this.spinner) {
      this.spinner.succeed(colors.success(message));
      this.spinner = null;
    }
  }

  fail(message = 'Failed') {
    if (this.spinner) {
      this.spinner.fail(colors.error(message));
      this.spinner = null;
    }
  }

  warn(message = 'Warning') {
    if (this.spinner) {
      this.spinner.warn(colors.warning(message));
      this.spinner = null;
    }
  }

  info(message = 'Info') {
    if (this.spinner) {
      this.spinner.info(colors.info(message));
      this.spinner = null;
    }
  }

  stop() {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  update(message) {
    if (this.spinner) {
      this.spinner.text = colors.primary(message);
    }
  }
}

module.exports = new Spinner();
