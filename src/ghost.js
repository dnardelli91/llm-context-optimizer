/**
 * Ghost Token Detection
 * Identifies repeated prefixes and context waste
 */

const { estimateTokens, estimateTokensByChars } = require('./tokenizer');

function detectGhostTokens(messages, thresholdPct = 20) {
  const results = [];
  let totalGhostTokens = 0;

  // Find common prefixes across messages
  const prefixes = findCommonPrefixes(messages);
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const content = msg.content || '';
    
    if (!content.trim()) continue;

    // Check for repeated prefix
    let ghostTokens = 0;
    let matchedPrefix = null;
    
    for (const prefix of prefixes) {
      if (content.startsWith(prefix) && prefix.length > 10) {
        ghostTokens = estimateTokensByChars(prefix);
        matchedPrefix = prefix;
        break;
      }
    }

    // Check for system prompt repetition (common in exports)
    const sysPatterns = [
      /You are a helpful assistant/gi,
      /You are ChatGPT/gi,
      /You are Claude/gi,
      /Always respond with/gi,
      /Important:/gi
    ];

    for (const pattern of sysPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 1) {
        ghostTokens += matches.length * 12; // ~12 tokens per repeated phrase
        matchedPrefix = pattern.source;
      }
    }

    // Check for excessive whitespace/repetition
    const repWords = content.match(/(.+)(\s+\1){3,}/g);
    if (repWords) {
      ghostTokens += repWords.reduce((sum, w) => sum + estimateTokensByChars(w), 0);
    }

    const msgTokens = estimateTokens(content);
    const ghostPct = msgTokens > 0 ? (ghostTokens / msgTokens) * 100 : 0;

    results.push({
      index: i,
      role: msg.role,
      originalTokens: msgTokens,
      ghostTokens: Math.min(ghostTokens, msgTokens - 1), // Don't count full message
      ghostPct: Math.min(ghostPct, 100),
      prefix: matchedPrefix,
      flagged: ghostPct >= thresholdPct
    });

    totalGhostTokens += results[i].ghostTokens;
  }

  return {
    details: results,
    ghostTokens: totalGhostTokens,
    flaggedCount: results.filter(r => r.flagged).length
  };
}

function findCommonPrefixes(messages) {
  const prefixes = [];
  const contents = messages.map(m => m.content || '').filter(c => c.length > 20);
  
  if (contents.length < 2) return prefixes;

  // Check first 50 chars for commonalities
  const firstParts = contents.map(c => c.substring(0, Math.min(80, c.length)));
  
  // Find longest common prefix among all
  let common = firstParts[0];
  for (let i = 1; i < firstParts.length; i++) {
    common = longestCommonPrefix(common, firstParts[i]);
    if (common.length < 10) break;
  }
  
  if (common.length >= 15) {
    prefixes.push(common);
  }

  // Also check last 50 chars (trailing repetition)
  const lastParts = contents.map(c => c.substring(Math.max(0, c.length - 80)));
  let commonEnd = lastParts[0];
  for (let i = 1; i < lastParts.length; i++) {
    commonEnd = longestCommonPrefix(commonEnd, lastParts[i]);
  }
  if (commonEnd.length >= 15) {
    prefixes.push(commonEnd);
  }

  return prefixes;
}

function longestCommonPrefix(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return a.substring(0, i);
}

module.exports = { detectGhostTokens };
