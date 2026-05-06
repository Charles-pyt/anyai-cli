require('dotenv').config();
const keystore = require('./keystore');
const logger = require('../ui/logger');

const PROVIDERS = ['openai', 'anthropic', 'mistral', 'gemini', 'qwen'];

class ApiKeyManager {
  getProviders() {
    return PROVIDERS;
  }

  getEnvVarName(provider) {
    return `ANYAI_${provider.toUpperCase()}_API_KEY`;
  }

  async getApiKey(provider) {
    if (!this.isValidProvider(provider)) {
      throw new Error(`Invalid provider: ${provider}`);
    }

    const envVar = this.getEnvVarName(provider);
    const envValue = process.env[envVar];

    if (envValue) {
      logger.debug(`Using API key from environment variable: ${envVar}`);
      return envValue;
    }

    const keyValue = await keystore.getApiKey(provider);
    if (keyValue) {
      logger.debug(`Using API key from keystore for ${provider}`);
      return keyValue;
    }

    return null;
  }

  async setApiKey(provider, apiKey) {
    if (!this.isValidProvider(provider)) {
      throw new Error(`Invalid provider: ${provider}`);
    }

    return await keystore.setApiKey(provider, apiKey);
  }

  async deleteApiKey(provider) {
    if (!this.isValidProvider(provider)) {
      throw new Error(`Invalid provider: ${provider}`);
    }

    return await keystore.deleteApiKey(provider);
  }

  isValidProvider(provider) {
    return PROVIDERS.includes(provider.toLowerCase());
  }

  async checkApiKey(provider) {
    const key = await this.getApiKey(provider);
    return !!key;
  }
}

module.exports = new ApiKeyManager();
