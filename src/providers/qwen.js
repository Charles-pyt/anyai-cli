const axios = require('axios');
const Provider = require('./base');

class QwenProvider extends Provider {
  constructor() {
    super('qwen');
    this.baseUrl = 'https://dashscope.aliyuncs.com/api/v1';
    this.models = [
      'qwen-max',
      'qwen-plus',
      'qwen-turbo',
    ];
  }

  getDefaultModel() {
    return 'qwen-max';
  }

  getModels() {
    return this.models;
  }

  async validate() {
    if (!this.apiKey) {
      throw new Error('Qwen API key not set');
    }
    try {
      await axios.post(
        `${this.baseUrl}/services/aigc/text-generation/generation`,
        {
          model: this.getDefaultModel(),
          input: { messages: [{ role: 'user', content: 'test' }] },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return true;
    } catch (error) {
      throw new Error(`Qwen validation failed: ${error.message}`);
    }
  }

  async generate(prompt, options = {}) {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chat(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('Qwen API key not set');
    }

    const model = options.model || this.model || this.getDefaultModel();

    try {
      const response = await axios.post(
        `${this.baseUrl}/services/aigc/text-generation/generation`,
        {
          model,
          input: {
            messages,
          },
          parameters: {
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2048,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.output.text;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Qwen API key');
      }
      throw new Error(`Qwen API error: ${error.message}`);
    }
  }
}

module.exports = QwenProvider;
