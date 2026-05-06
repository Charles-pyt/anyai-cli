const OpenAIProvider = require('./openai');
const AnthropicProvider = require('./anthropic');
const MistralProvider = require('./mistral');
const GeminiProvider = require('./gemini');
const QwenProvider = require('./qwen');

const PROVIDERS = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  mistral: MistralProvider,
  gemini: GeminiProvider,
  qwen: QwenProvider,
};

function getProviderClass(name) {
  const ProviderClass = PROVIDERS[name.toLowerCase()];
  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${name}`);
  }
  return ProviderClass;
}

function createProvider(name, apiKey) {
  const ProviderClass = getProviderClass(name);
  const provider = new ProviderClass();
  if (apiKey) {
    provider.setApiKey(apiKey);
  }
  return provider;
}

function getAvailableProviders() {
  return Object.keys(PROVIDERS);
}

module.exports = {
  getProviderClass,
  createProvider,
  getAvailableProviders,
  PROVIDERS,
};
