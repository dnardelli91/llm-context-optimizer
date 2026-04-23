# LLM Context Optimizer 🧪⚙️

> Know what's burning your context window.

A CLI tool that detects **ghost tokens** — tokens that consume your context window but never influence model output. Targets indie devs and hobbyists who pay per-token.

## Quick Start

```bash
# Clone
git clone https://github.com/dnardelli91/llm-context-optimizer.git
cd llm-context-optimizer

# Run with demo chat
node src/index.js demo/sample-chat.json --compress --open
```

## Features

- **Ghost Token Detection** — Identify repeated prefixes and context waste
- **Semantic Compression** — Deterministic shortening without LLM calls
- **Cost Estimation** — Shows savings in tokens and dollars (GPT-4o pricing)
- **HTML Report** — Color-coded breakdown with before/after comparison

## Usage

```bash
node src/index.js <chat-export.json> [options]

Options:
  --threshold <N>     Ghost prefix threshold % (default: 20)
  --compress          Apply semantic compression
  --open              Open HTML report after generation
  --output <file>     Output HTML file (default: report.html)
```

### Example

```bash
# Analyze a chat export
node src/index.js ./my-chat.json

# With compression
node src/index.js ./my-chat.json --compress

# Open report automatically
node src/index.js ./my-chat.json --compress --open
```

## Chat Format

Supports OpenAI export format:

```json
{
  "messages": [
    {"role": "system", "content": "You are helpful."},
    {"role": "user", "content": "Hello!"},
    {"role": "assistant", "content": "Hi there!"}
  ]
}
```

Also supports raw message arrays.

## Demo Report

![LLM Context Optimizer Report](demo/report-preview.png)

The included demo chat (`demo/sample-chat.json`) contains 9 messages with ghost tokens from repeated "You are a helpful assistant" prefixes.

**Demo output:**
- Total tokens: 338
- Ghost tokens: 2 (0.6%)
- Severity: OK

Run it yourself:
```bash
node src/index.js demo/sample-chat.json --compress --open
```

## How Ghost Tokens Work

LLMs process the entire conversation context on every request. When system prompts or long prefixes are repeated verbatim in every message, they waste tokens without contributing to the conversation.

**Example waste:**
```
Message 1: "You are helpful. [actual content]"
Message 2: "You are helpful. [different content]"  ← "You are helpful." = ghost
Message 3: "You are helpful. [more content]"        ← "You are helpful." = ghost
```

**Before KVTC (KV Cache Transform Coding):** These get re-processed every turn.
**After:** Compress the context to remove redundancy.

This tool helps you identify and remove ghost tokens before they burn your budget.

## Architecture

```
chat.json → Parser → TokenEstimator → GhostDetector → 
  → Compressor → CostCalculator → HTMLReporter → report.html
```

**Modules:**
- `src/parser.js` — JSON chat parsing
- `src/tokenizer.js` — Token estimation (word-based)
- `src/ghost.js` — Ghost token detection
- `src/compressor.js` — Semantic compression
- `src/cost.js` — Cost calculation
- `src/reporter.js` — HTML report generation

## Tech

- **Language:** Node.js (no external dependencies)
- **Pricing:** Hardcoded GPT-4o rates ($5/1M input)
- **Offline:** No network calls
- **Format:** Single HTML report

## Related

- [KVTC (KV Cache Transform Coding)](https://arxiv.org/) — ICLR 2026: 20x compression
- [TurboQuant](https://turboquant.ai) — 6x KV-cache compression
- [headroom](https://github.com/headroom-ai) — GitHub context optimizer

## License

MIT — dnardelli91