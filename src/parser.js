/**
 * Parser — Extract messages from chat export formats
 */

function parseChat(chat) {
  // OpenAI format: { "messages": [...] }
  if (Array.isArray(chat)) {
    return chat.map(normalizeMessage);
  }
  if (chat.messages && Array.isArray(chat.messages)) {
    return chat.messages.map(normalizeMessage);
  }
  if (chat.conversation && Array.isArray(chat.conversation)) {
    return chat.conversation.map(normalizeMessage);
  }
  throw new Error('Unrecognized chat format. Expected { messages: [...] } or array.');
}

function normalizeMessage(msg, index) {
  return {
    role: msg.role || 'user',
    content: msg.content || '',
    timestamp: msg.timestamp || null,
    index
  };
}

module.exports = { parseChat };