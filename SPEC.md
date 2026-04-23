# LLM Context Optimizer — SPEC

## 1. Concept & Vision

A CLI tool that exposes the hidden cost of "ghost tokens" in LLM chat exports — tokens that consume context window but never influence model output. Targets indie devs and hobbyists who pay per-token and want visibility + relief before paying for enterprise solutions.

**Tagline:** "Know what's burning your context window."

## 2. Design Language

- **Aesthetic:** Terminal-native, high-contrast dark mode. Inspired by `htop` / `nethack`.
- **Colors:** Green=good, yellow=warning, red=critical. Bold markers.
- **Typography:** Monospace only. No decorative fonts.
- **Motion:** Minimal — fast text output, progress bars only for long ops.
- **Icons:** ASCII/emoji markers (`✓`, `⚠`, `✗`, `→`).

## 3. Functionality

### Core Features

1. **Parse chat export (JSON)**
   - Support OpenAI chat format (`{"messages": [{"role": "user", "content": "..."}]}`)
   - Estimate token count using simple tokenizer (whitespace split + overhead)
   - Identify ghost tokens heuristically:
     - Repeated system prompts
     - Redundant context markers
     - Long fixed prefixes per message

2. **Ghost Token Detection**
   - Flag messages with >X% repeated prefix (configurable)
   - Calculate ghost token % per message and total
   - Show breakdown: which parts are "live" vs "waste"

3. **Semantic Compression (summary-based)**
   - For flagged messages, suggest a compressed version (deterministic shorten)
   - Estimate new token count post-compression
   - Show savings in tokens and estimated $

4. **Cost Estimation**
   - Based on GPT-4o pricing: $5/1M input tokens
   - Show $ saved per chat and projected monthly savings

5. **HTML Report (Markov-style)**
   - Single HTML file with:
     - Summary stats (total tokens, ghost %, cost waste)
     - Per-message breakdown table
     - Before/after compression suggestions
     - Color-coded severity
   - Auto-opens in browser via `open` command

### Data Flow

```
chat.json → Parser → TokenEstimator → GhostDetector → 
  → Compressor → CostCalculator → HTMLReporter → report.html
```

## 4. Technical Spec

- **Language:** Node.js (no external deps for core — use built-in `crypto`, `fs`)
- **Entry:** `npm run start -- chat.json` or `node src/index.js chat.json`
- **Output:** `report.html` in working directory
- **Pricing API:** Hardcoded GPT-4o rates (no network call)

### File Structure

```
llm-context-optimizer/
├── SPEC.md
├── README.md
├── package.json
├── src/
│   ├── index.js        # CLI entry
│   ├── parser.js       # JSON chat parser
│   ├── tokenizer.js    # Token estimator
│   ├── ghost.js        # Ghost detection logic
│   ├── compressor.js   # Semantic compression
│   ├── cost.js         # Cost calculator
│   └── reporter.js     # HTML generator
└── demo/
    └── sample-chat.json  # Demo chat export
```

## 5. Constraints

- No network calls (except optional `open` for report)
- No external npm dependencies
- Works offline
- Handles malformed JSON gracefully
- Minimum Node.js 18 (built-in `fetch` optional)

## 6. Success Metrics

- Detects ghost tokens in sample chat with >50% accuracy vs manual count
- HTML report renders in <1s
- Compression suggestions reduce context by >30% on typical chats