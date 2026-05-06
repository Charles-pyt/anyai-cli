const axios = require('axios');
const Provider = require('./base');

class GeminiProvider extends Provider {
  constructor() {
    super('gemini');
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.models = [
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ];
  }

  getDefaultModel() {
    return 'gemini-2.0-flash';
  }

  getModels() {
    return this.models;
  }

  async validate() {
    if (!this.apiKey) {
      throw new Error('Gemini API key not set');
    }
    try {
      await axios.post(
        `${this.baseUrl}/models/${this.getDefaultModel()}:generateContent?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: 'test' }] }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return true;
    } catch (error) {
      throw new Error(`Gemini validation failed: ${error.message}`);
    }
  }

  async generate(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not set');
    }

    const model = options.model || this.model || this.getDefaultModel();

    try {
      const response = await axios.post(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 1000,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid Gemini API key');
      }
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }
}

module.exports = GeminiProvider;
