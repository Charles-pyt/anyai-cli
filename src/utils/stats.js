const configManager = require('../config/manager');

// Approximate blended price (input + output) per 1000 tokens
const PRICING = {
  'gpt-4o': 0.01,
  'gpt-4-turbo': 0.02,
  'gpt-4': 0.045,
  'gpt-3.5-turbo': 0.001,
  'claude-3-5-sonnet-20241022': 0.009,
  'claude-3-opus-20250219': 0.045,
  'mistral-large-latest': 0.006,
  'gemini-1.5-pro': 0.007,
  'gemini-1.5-flash': 0.0005,
  'qwen-max': 0.008,
};
const DEFAULT_PRICE = 0.01; // $0.01 per 1k tokens as generic fallback

function estimateTokens(text) {
  if (!text) return 0;
  // Simple heuristic: 1 token ≈ 4 characters in English
  return Math.ceil(text.length / 4);
}

function estimateCost(tokens, model) {
  const pricePer1k = PRICING[model] || DEFAULT_PRICE;
  return (tokens / 1000) * pricePer1k;
}

function getLifetimeStats() {
  const config = configManager.read();
  return config.stats || {
    totalTokens: 0,
    totalCost: 0,
    modelsUsed: {}
  };
}

function updateLifetimeStats(model, newTokens, newCost) {
  const stats = getLifetimeStats();
  stats.totalTokens += newTokens;
  stats.totalCost += newCost;
  
  if (!stats.modelsUsed[model]) {
    stats.modelsUsed[model] = 0;
  }
  stats.modelsUsed[model] += newTokens;
  
  configManager.set('stats', stats);
  return stats;
}

module.exports = {
  estimateTokens,
  estimateCost,
  getLifetimeStats,
  updateLifetimeStats
};
