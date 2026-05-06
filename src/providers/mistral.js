const axios = require('axios');
const Provider = require('./base');

class MistralProvider extends Provider {
  constructor() {
    super('mistral');
    this.baseUrl = 'https://api.mistral.ai/v1';
    this.models = [
      'mistral-large-latest',
      'mistral-medium-latest',
      'mistral-small-latest',
    ];
  }

  getDefaultModel() {
    return 'mistral-large-latest';
  }

  getModels() {
    return this.models;
  }

  async validate() {
    if (!this.apiKey) {
      throw new Error('Mistral API key not set');
    }
    try {
      await axios.get(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return true;
    } catch (error) {
      throw new Error(`Mistral validation failed: ${error.message}`);
    }
  }

  async generate(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('Mistral API key not set');
    }

    const model = options.model || this.model || this.getDefaultModel();

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Mistral API key');
      }
      throw new Error(`Mistral API error: ${error.message}`);
    }
  }
}

module.exports = MistralProvider;
