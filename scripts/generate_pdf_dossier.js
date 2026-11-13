const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const inputMdPath = path.join(__dirname, '..', 'docs', 'RELAY_FINAL_ROUND_DOSSIER.md');
const outputHtmlPath = path.join(__dirname, '..', 'docs', 'RELAY_FINAL_ROUND_DOSSIER.html');
const outputPdfPath = path.join(__dirname, '..', 'docs', 'RELAY_FINAL_ROUND_DOSSIER.pdf');

const mdContent = fs.readFileSync(inputMdPath, 'utf8');

// Lightweight robust Markdown parser for technical dossier
function parseMarkdownToHtml(md) {
  const lines = md.split('\n');
  let html = [];
  let inCodeBlock = false;
  let codeLang = '';
  let inTable = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        html.push('</code></pre>');
        inCodeBlock = false;
      } else {
        if (inList) { html.push('</ul>'); inList = false; }
        if (inTable) { html.push('</tbody></table>'); inTable = false; }
        codeLang = line.trim().substring(3);
        html.push(`<pre><code class="language-${codeLang}">`);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      html.push(escaped);
      continue;
    }

    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (inList) { html.push('</ul>'); inList = false; }
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      
      // Check if separator line
      if (cells.every(c => /^:?-+:?$/.test(c))) {
        continue;
      }

      if (!inTable) {
        html.push('<table class="dossier-table"><thead><tr>');
        cells.forEach(c => html.push(`<th>${inlineFormat(c)}</th>`));
        html.push('</tr></thead><tbody>');
        inTable = true;
      } else {
        html.push('<tr>');
        cells.forEach(c => html.push(`<td>${inlineFormat(c)}</td>`));
        html.push('</tr>');
      }
      continue;
    } else if (inTable) {
      html.push('</tbody></table>');
      inTable = false;
    }

    // Blockquote
    if (line.startsWith('>')) {
      if (inList) { html.push('</ul>'); inList = false; }
      const bqText = line.replace(/^>\s?/, '');
      html.push(`<blockquote>${inlineFormat(bqText)}</blockquote>`);
      continue;
    }

    // Horizontal Rule
    if (/^---$|^\*\*\*$/.test(line.trim())) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push('<hr />');
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h1>${inlineFormat(line.substring(2))}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h2>${inlineFormat(line.substring(3))}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h3>${inlineFormat(line.substring(4))}</h3>`);
      continue;
    }
    if (line.startsWith('#### ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      html.push(`<h4>${inlineFormat(line.substring(5))}</h4>`);
      continue;
    }

    // Unordered List
    if (/^\s*[-*]\s/.test(line)) {
      const text = line.replace(/^\s*[-*]\s/, '');
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${inlineFormat(text)}</li>`);
      continue;
    } else if (inList && line.trim() === '') {
      html.push('</ul>');
      inList = false;
    }

    // Paragraph
    if (line.trim() !== '') {
      html.push(`<p>${inlineFormat(line)}</p>`);
    }
  }

  if (inTable) html.push('</tbody></table>');
  if (inList) html.push('</ul>');
  if (inCodeBlock) html.push('</code></pre>');

  return html.join('\n');
}

function inlineFormat(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

const bodyHtml = parseMarkdownToHtml(mdContent);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>RELAY — Final Round Technical Dossier</title>
<style>
  @page {
    size: A4;
    margin: 20mm 15mm 20mm 15mm;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.6;
    font-size: 11pt;
    padding: 0;
    margin: 0;
  }
  h1 {
    color: #0f172a;
    font-size: 20pt;
    border-bottom: 2px solid #0d9488;
    padding-bottom: 6px;
    margin-top: 18pt;
    margin-bottom: 10pt;
  }
  h2 {
    color: #0f766e;
    font-size: 15pt;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
    margin-top: 16pt;
    margin-bottom: 8pt;
    page-break-after: avoid;
  }
  h3 {
    color: #334155;
    font-size: 12pt;
    margin-top: 12pt;
    margin-bottom: 4pt;
    page-break-after: avoid;
  }
  p {
    margin-top: 0;
    margin-bottom: 8pt;
  }
  blockquote {
    border-left: 4px solid #0d9488;
    background: #f0fdfa;
    color: #134e4a;
    padding: 6px 12px;
    margin: 8pt 0;
    border-radius: 4px;
    font-size: 10pt;
  }
  code {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 3px;
    padding: 1px 4px;
    font-family: "Cascadia Code", Consolas, Menlo, Monaco, monospace;
    font-size: 9.5pt;
    color: #0f172a;
  }
  pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 10pt;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 8.5pt;
    line-height: 1.4;
    margin: 8pt 0;
  }
  pre code {
    background: transparent;
    border: none;
    color: #f8fafc;
    padding: 0;
  }
  .dossier-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10pt 0;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  .dossier-table th, .dossier-table td {
    border: 1px solid #cbd5e1;
    padding: 6px 10px;
    text-align: left;
  }
  .dossier-table th {
    background-color: #f8fafc;
    color: #0f172a;
    font-weight: 600;
  }
  .dossier-table tr:nth-child(even) {
    background-color: #f8fafc;
  }
  ul {
    margin-top: 0;
    margin-bottom: 8pt;
    padding-left: 18pt;
  }
  li {
    margin-bottom: 3pt;
  }
  hr {
    border: 0;
    border-top: 1px solid #e2e8f0;
    margin: 16pt 0;
  }
  a {
    color: #0d9488;
    text-decoration: none;
  }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

fs.writeFileSync(outputHtmlPath, fullHtml, 'utf8');
console.log(`HTML generated at: ${outputHtmlPath}`);

// Run Microsoft Edge headless to print to PDF
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
if (fs.existsSync(edgePath)) {
  try {
    const fileUrl = 'file:///' + outputHtmlPath.replace(/\\/g, '/');
    const cmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${outputPdfPath}" "${fileUrl}"`;
    execSync(cmd);
    console.log(`PDF generated at: ${outputPdfPath}`);
  } catch (err) {
    console.error('Failed to generate PDF via msedge:', err.message);
  }
} else {
  console.log('msedge not found at default path');
}
