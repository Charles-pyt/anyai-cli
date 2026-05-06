const axios = require('axios');
const Provider = require('./base');

class AnthropicProvider extends Provider {
  constructor() {
    super('anthropic');
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.models = [
      'claude-sonnet-4-6',
      'claude-haiku-4-5-20251001',
      'claude-opus-4-7',
    ];
  }

  getDefaultModel() {
    return 'claude-sonnet-4-6';
  }

  getModels() {
    return this.models;
  }

  async validate() {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not set');
    }
    try {
      await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: this.getDefaultModel(),
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );
      return true;
    } catch (error) {
      throw new Error(`Anthropic validation failed: ${error.message}`);
    }
  }

  async generate(prompt, options = {}) {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chat(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not set');
    }

    const model = options.model || this.model || this.getDefaultModel();

    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model,
          max_tokens: options.maxTokens || 2048,
          messages,
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Anthropic API key');
      }
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }
}

module.exports = AnthropicProvider;
