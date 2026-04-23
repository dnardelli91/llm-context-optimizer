/**
 * Compressor — Semantic shortening suggestions
 * Deterministic compression without LLM calls
 */

function compressMessages(messages, ghostData) {
  return messages.map((msg, i) => {
    const ghost = ghostData.details[i];
    const content = msg.content || '';
    
    if (!ghost || !ghost.flagged || !content.trim()) {
      return { ...msg, compressed: null };
    }

    const compressed = compressContent(content, ghost);
    return {
      ...msg,
      compressed,
      savedTokens: estimateTokens(content) - estimateTokens(compressed)
    };
  });
}

function compressContent(content, ghost) {
  let result = content;

  // 1. Remove repeated prefix
  if (ghost.prefix && content.startsWith(ghost.prefix)) {
    // Skip the prefix, keep rest
    result = content.substring(ghost.prefix.length).trim();
  }

  // 2. Collapse excessive whitespace
  result = result.replace(/\s{3,}/g, '\n\n');
  result = result.replace(/([^\n])\n{3,}([^\n])/g, '$1\n\n$2');

  // 3. Shorten common filler patterns
  const fillers = [
    [/\bSure,?\s*/gi, ''],
    [/\bOf course,?\s*/gi, ''],
    [/\bCertainly,?\s*/gi, ''],
    [/\bLet me think about this\.\s*/gi, ''],
    [/\bHere's the thing:\s*/gi, ''],
    [/\bTo be honest,?\s*/gi, ''],
    [/\bActually,?\s*/gi, ''],
    [/\bIn other words,?\s*/gi, 'i.e., '],
    [/\bThat said,?\s*/gi, 'but '],
    [/\bSo basically,?\s*/gi, 'basically, '],
  ];

  for (const [pattern, replacement] of fillers) {
    result = result.replace(pattern, replacement);
  }

  // 4. Collapse repeated phrases
  const repPhrase = /(.+)\s+\1\s+\1/;
  while (repPhrase.test(result)) {
    result = result.replace(repPhrase, '$1');
  }

  // 5. Truncate very long messages (>2000 chars)
  if (result.length > 2000) {
    const words = result.split(/\s+/);
    let truncated = '';
    let tokens = 0;
    for (const word of words) {
      tokens += word.length / 4 + 0.4;
      if (tokens > 500) break; // ~500 tokens max
      truncated += word + ' ';
    }
    result = truncated.trim() + '... [truncated]';
  }

  return result.trim();
}

function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return Math.ceil(words.length * 1.4 + 4);
}

module.exports = { compressMessages };