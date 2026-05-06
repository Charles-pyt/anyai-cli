const keytar = require('keytar');
const logger = require('../ui/logger');

const SERVICE = 'anyai-cli';

class KeyStore {
  async getApiKey(provider) {
    try {
      const key = await keytar.getPassword(SERVICE, provider);
      return key || null;
    } catch (error) {
      logger.debug(`Failed to retrieve API key from keytar: ${error.message}`);
      return null;
    }
  }

  async setApiKey(provider, apiKey) {
    try {
      await keytar.setPassword(SERVICE, provider, apiKey);
      return true;
    } catch (error) {
      logger.error(`Failed to store API key: ${error.message}`);
      return false;
    }
  }

  async deleteApiKey(provider) {
    try {
      await keytar.deletePassword(SERVICE, provider);
      return true;
    } catch (error) {
      logger.debug(`Failed to delete API key: ${error.message}`);
      return false;
    }
  }

  async hasApiKey(provider) {
    const key = await this.getApiKey(provider);
    return !!key;
  }
}

module.exports = new KeyStore();
