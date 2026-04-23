/**
 * Reporter — HTML Report Generator
 * Markov-style: high information density, dark terminal aesthetic
 */

function generateReport(data, outputPath) {
  const { messages, totalTokens, ghostData, compressedMessages, savings, threshold } = data;
  const fs = require('fs');
  
  const ghostPct = ((ghostData.ghostTokens / totalTokens) * 100).toFixed(1);
  const severity = ghostPct > 30 ? 'CRITICAL' : ghostPct > 15 ? 'WARNING' : 'OK';
  const severityColor = severity === 'CRITICAL' ? '#ff3b3b' : severity === 'WARNING' ? '#ffcc00' : '#00ff88';

  const rows = ghostData.details.map((g, i) => {
    const msg = messages[i];
    const compressed = compressedMessages ? compressedMessages[i] : null;
    const isCompressed = compressed && compressed.compressed;
    
    const flagIcon = g.flagged ? '⚠' : '✓';
    const flagColor = g.flagged ? '#ffcc00' : '#00ff88';
    
    const originalHtml = escapeHtml(msg.content || '');
    const compressedHtml = isCompressed ? escapeHtml(compressed.compressed) : null;
    
    return `
    <tr class="${g.flagged ? 'flagged' : ''}">
      <td class="idx">${i}</td>
      <td class="role">${msg.role}</td>
      <td class="tokens">${g.originalTokens}</td>
      <td class="ghost">${g.ghostTokens > 0 ? `<span style="color:#ffcc00">${g.ghostTokens}</span>` : '0'}</td>
      <td class="pct">${g.ghostPct.toFixed(1)}%</td>
      <td class="content">${originalHtml}</td>
      ${isCompressed ? `<td class="compressed">${compressedHtml}<br><span class="saved">-${compressed.savedTokens} tokens</span></td>` : '<td>—</td>'}
      <td class="flag">${flagIcon}</td>
    </tr>`;
  }).join('');

  let savingsSection = '';
  if (savings) {
    savingsSection = `
    <div class="savings-box">
      <h2>💰 Compression Savings</h2>
      <div class="savings-grid">
        <div class="savings-item">
          <span class="label">Tokens Saved</span>
          <span class="value">${savings.tokenSaved.toLocaleString()}</span>
        </div>
        <div class="savings-item">
          <span class="label">Cost Saved</span>
          <span class="value">$${savings.dollarSaved}</span>
        </div>
        <div class="savings-item">
          <span class="label">Reduction</span>
          <span class="value">${savings.pctReduced}%</span>
        </div>
        <div class="savings-item">
          <span class="label">Rate</span>
          <span class="value">$${savings.ratePerMillion}/1M tokens</span>
        </div>
      </div>
    </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLM Context Optimizer — Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0f; color: #e0e0e0; font-family: 'Courier New', monospace; padding: 20px; line-height: 1.5; }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { color: #00ff88; font-size: 24px; margin-bottom: 5px; }
    h2 { color: #00ff88; font-size: 16px; margin: 20px 0 10px; }
    .subtitle { color: #888; font-size: 12px; margin-bottom: 20px; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px; }
    .meta-box { background: #141420; border: 1px solid #333; border-radius: 4px; padding: 12px; }
    .meta-box .label { color: #888; font-size: 11px; text-transform: uppercase; }
    .meta-box .value { font-size: 20px; font-weight: bold; }
    .severity { color: ${severityColor}; }
    .savings-box { background: #0d2818; border: 1px solid #00ff88; border-radius: 4px; padding: 15px; margin: 20px 0; }
    .savings-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 10px; }
    .savings-item { text-align: center; }
    .savings-item .label { color: #888; font-size: 10px; text-transform: uppercase; }
    .savings-item .value { font-size: 18px; color: #00ff88; }
    .legend { display: flex; gap: 20px; margin: 15px 0; font-size: 12px; }
    .legend span { display: flex; align-items: center; gap: 5px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
    th { background: #1a1a2e; color: #00ff88; padding: 8px; text-align: left; font-size: 11px; position: sticky; top: 0; }
    td { padding: 6px 8px; border-bottom: 1px solid #222; vertical-align: top; }
    tr.flagged { background: #1a1500; }
    .idx { color: #555; width: 30px; }
    .role { width: 60px; color: #888; }
    .tokens, .ghost, .pct { text-align: right; width: 60px; }
    .content { max-width: 300px; word-break: break-word; color: #ccc; }
    .compressed { background: #0a1f10; color: #00ff88; }
    .saved { font-size: 10px; color: #00ff88; opacity: 0.8; }
    .flag { text-align: center; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #333; color: #555; font-size: 11px; }
    @media (max-width: 768px) {
      .meta-grid, .savings-grid { grid-template-columns: repeat(2, 1fr); }
      table { font-size: 10px; }
      .content { max-width: 150px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚙️ LLM Context Optimizer</h1>
    <p class="subtitle">Ghost Token Analysis Report — Generated ${new Date().toISOString()}</p>
    
    <div class="meta-grid">
      <div class="meta-box">
        <div class="label">Total Tokens</div>
        <div class="value">${totalTokens.toLocaleString()}</div>
      </div>
      <div class="meta-box">
        <div class="label">Ghost Tokens</div>
        <div class="value severity">${ghostData.ghostTokens.toLocaleString()} (${ghostPct}%)</div>
      </div>
      <div class="meta-box">
        <div class="label">Severity</div>
        <div class="value severity">${severity}</div>
      </div>
      <div class="meta-box">
        <div class="label">Flagged Messages</div>
        <div class="value">${ghostData.flaggedCount}/${messages.length}</div>
      </div>
    </div>

    ${savingsSection}

    <h2>📊 Per-Message Breakdown</h2>
    <div class="legend">
      <span><span class="dot" style="background:#00ff88"></span> ✓ Normal</span>
      <span><span class="dot" style="background:#ffcc00"></span> ⚠ Flagged (ghost >${threshold}%)</span>
    </div>
    
    <div style="overflow-x:auto;">
    <table>
      <thead>
        <tr>
          <th>#</th><th>Role</th><th>Tokens</th><th>Ghost</th><th>Ghost%</th><th>Content</th><th>Compressed</th><th>Flag</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    </div>

    <div class="footer">
      LLM Context Optimizer v1.0.0 | Prices based on GPT-4o: $5/1M input tokens<br>
      Note: Token estimates are approximate. Actual savings may vary by model.
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf8');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { generateReport };