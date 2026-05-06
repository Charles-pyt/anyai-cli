const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('../ui/logger');

const CONFIG_DIR = path.join(os.homedir(), '.anyai');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

class ConfigManager {
  constructor() {
    this.ensureConfigDir();
  }

  ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
  }

  getConfigPath() {
    return CONFIG_FILE;
  }

  getConfigDir() {
    return CONFIG_DIR;
  }

  read() {
    try {
      if (!fs.existsSync(CONFIG_FILE)) {
        return {
          provider: null,
          model: null,
          providerModels: {},
        };
      }

      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      logger.error(`Failed to read config: ${error.message}`);
      return {
        provider: null,
        model: null,
        providerModels: {},
      };
    }
  }

  write(config) {
    try {
      this.ensureConfigDir();
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
      return true;
    } catch (error) {
      logger.error(`Failed to write config: ${error.message}`);
      return false;
    }
  }

  update(fields) {
    const current = this.read();
    const updated = { ...current, ...fields };
    return this.write(updated);
  }

  get(key) {
    const config = this.read();
    return config[key] || null;
  }

  set(key, value) {
    return this.update({ [key]: value });
  }

  reset() {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
    return true;
  }
}

module.exports = new ConfigManager();
