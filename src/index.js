#!/usr/bin/env node
/**
 * LLM Context Optimizer — Entry Point
 * Detects ghost tokens and optimizes chat context
 */

const fs = require('fs');
const path = require('path');
const { parseChat } = require('./parser');
const { estimateTokens } = require('./tokenizer');
const { detectGhostTokens } = require('./ghost');
const { compressMessages } = require('./compressor');
const { calculateSavings } = require('./cost');
const { generateReport } = require('./reporter');

function usage() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║          LLM Context Optimizer  v1.0.0                  ║
║          Ghost Token Detection & Compression             ║
╚══════════════════════════════════════════════════════════╝

Usage: node src/index.js <chat-export.json> [options]

Options:
  --threshold <N>     Ghost prefix threshold % (default: 20)
  --compress          Apply semantic compression
  --open              Open HTML report after generation
  --output <file>     Output HTML file (default: report.html)

Example:
  node src/index.js ./demo/sample-chat.json --compress --open

`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    usage();
    process.exit(0);
  }

  const inputFile = args[0];
  const threshold = parseInt(args.find(a => a === '--threshold') ? args[args.indexOf('--threshold') + 1] : '20', 10);
  const doCompress = args.includes('--compress');
  const doOpen = args.includes('--open');
  const outputFile = args.find(a => a.startsWith('--output='))?.split('=')[1] || 'report.html';

  if (!fs.existsSync(inputFile)) {
    console.error(`✗ File not found: ${inputFile}`);
    process.exit(1);
  }

  console.log('\n📋 LLM Context Optimizer');
  console.log('══════════════════════════════════════════\n');

  // Parse
  const raw = fs.readFileSync(inputFile, 'utf8');
  let chat;
  try {
    chat = JSON.parse(raw);
  } catch (e) {
    console.error(`✗ Failed to parse JSON: ${e.message}`);
    process.exit(1);
  }

  const messages = parseChat(chat);
  console.log(`✓ Parsed ${messages.length} messages`);

  // Token estimation
  const tokenCounts = messages.map(m => estimateTokens(m.content || ''));
  const totalTokens = tokenCounts.reduce((a, b) => a + b, 0);
  console.log(`✓ Total tokens: ${totalTokens.toLocaleString()}`);

  // Ghost detection
  const ghostData = detectGhostTokens(messages, threshold);
  const ghostPct = ((ghostData.ghostTokens / totalTokens) * 100).toFixed(1);
  console.log(`✓ Ghost tokens: ${ghostData.ghostTokens.toLocaleString()} (${ghostPct}%)`);

  // Compression
  let compressedMessages = null;
  let savings = null;
  if (doCompress) {
    compressedMessages = compressMessages(messages, ghostData);
    const compressedTokens = compressedMessages.map(m => estimateTokens(m.content || '')).reduce((a, b) => a + b, 0);
    savings = calculateSavings(totalTokens, compressedTokens);
    console.log(`✓ Compression applied. Tokens: ${totalTokens} → ${compressedTokens.toLocaleString()}`);
  }

  // Report
  const reportPath = path.resolve(outputFile);
  generateReport({
    messages,
    totalTokens,
    ghostData,
    compressedMessages,
    savings,
    threshold
  }, reportPath);

  console.log(`\n✓ Report: ${reportPath}`);
  
  if (doOpen) {
    const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    require('child_process').exec(`${openCmd} "${reportPath}"`);
    console.log('✓ Opening in browser...');
  }

  console.log('\n══════════════════════════════════════════\n');
}

main().catch(e => {
  console.error(`✗ Error: ${e.message}`);
  process.exit(1);
});