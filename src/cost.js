/**
 * Cost Calculator — GPT-4o pricing estimates
 */

const PRICING = {
  'gpt-4o': { input: 5, output: 15 },      // $5/1M input, $15/1M output
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'claude-3-5-sonnet': { input: 3, output: 15 },
  default: { input: 5, output: 15 }       // GPT-4o default
};

function calculateSavings(originalTokens, compressedTokens, model = 'gpt-4o') {
  const rates = PRICING[model] || PRICING.default;
  
  const originalCost = (originalTokens / 1_000_000) * rates.input;
  const compressedCost = (compressedTokens / 1_000_000) * rates.input;
  
  const tokenSaved = originalTokens - compressedTokens;
  const dollarSaved = originalCost - compressedCost;
  const pctReduced = ((tokenSaved / originalTokens) * 100).toFixed(1);

  return {
    originalTokens,
    compressedTokens,
    tokenSaved,
    dollarSaved: dollarSaved.toFixed(4),
    pctReduced,
    model,
    ratePerMillion: rates.input
  };
}

function formatCost(dollars) {
  if (dollars < 0.01) return `$${(dollars * 1000).toFixed(2)} per 1K tokens`;
  if (dollars < 1) return `$${dollars.toFixed(4)}`;
  return `$${dollars.toFixed(2)}`;
}

module.exports = { calculateSavings, formatCost, PRICING };