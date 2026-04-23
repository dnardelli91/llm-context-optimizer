/**
 * Tokenizer — Simple token estimator
 * Uses word-based approximation with overhead factor
 */

function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  
  // Strip markdown/code blocks
  const cleaned = text
    .replace(/```[\s\S]*?```/g, '[CODE]')
    .replace(/`[^`]+`/g, '[CODE]');
  
  // Split into words (whitespace + punctuation)
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  
  // Average tokens per word varies by language
  // English: ~1.3 tokens/word, code: ~1.5
  // Add ~4 tokens overhead per message (role, separators)
  const wordEstimate = words.length * 1.4;
  const overhead = 4;
  
  return Math.ceil(wordEstimate + overhead);
}

// Character-based quick estimate (used for ghost detection)
function estimateTokensByChars(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4); // ~4 chars per token average
}

module.exports = { estimateTokens, estimateTokensByChars };