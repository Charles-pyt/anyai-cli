const axios = require('axios');
const Provider = require('./base');

class OpenAIProvider extends Provider {
  constructor() {
    super('openai');
    this.baseUrl = 'https://api.openai.com/v1';
    this.models = [
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
    ];
  }

  getDefaultModel() {
    return 'gpt-4o';
  }

  getModels() {
    return this.models;
  }

  async validate() {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not set');
    }
    try {
      await axios.get(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return true;
    } catch (error) {
      throw new Error(`OpenAI validation failed: ${error.message}`);
    }
  }

  async generate(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not set');
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
        throw new Error('Invalid OpenAI API key');
      }
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}

module.exports = OpenAIProvider;
