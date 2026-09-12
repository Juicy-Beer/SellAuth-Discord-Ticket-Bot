//html file
const fs = require('fs');
const path = require('path');

const TRANSCRIPTS_DIR = path.join(__dirname, '..', 'data', 'transcripts');

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderContent(content = '') {
  let out = escapeHtml(content);
  out = out.replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="code-block">${code}</pre>`);
  out = out.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  out = out.replace(/\n/g, '<br>');
  return out;
}

async function fetchAllMessages(channel) {
  let messages = [];
  let lastId = null;

  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;
    const batch = await channel.messages.fetch(options);
    if (batch.size === 0) break;
    messages = messages.concat(Array.from(batch.values()));
    lastId = batch.last().id;
    if (batch.size < 100) break;
  }

  return messages.reverse();
}

function renderAttachments(msg) {
  if (msg.attachments.size === 0) return '';
  const items = Array.from(msg.attachments.values()).map(att => {
    const isImage = /\.(png|jpe?g|gif|webp)$/i.test(att.name || '');
    if (isImage) {
      return `<div class="attachment"><img src="${escapeHtml(att.url)}" alt="${escapeHtml(att.name)}" loading="lazy"></div>`;
    }
    return `<div class="attachment"><a href="${escapeHtml(att.url)}" target="_blank" rel="noopener">📎 ${escapeHtml(att.name)}</a></div>`;
  });
  return items.join('\n');
}

function renderEmbeds(msg) {
  if (msg.embeds.length === 0) return '';
  return msg.embeds.map(e => {
    const title = e.title ? `<div class="embed-title">${escapeHtml(e.title)}</div>` : '';
    const desc = e.description ? `<div class="embed-desc">${renderContent(e.description)}</div>` : '';
    return `<div class="embed">${title}${desc}</div>`;
  }).join('\n');
}

async function generateTranscript(channel, { ticketNumber, closedBy = null } = {}) {
  const messages = await fetchAllMessages(channel);

  const rows = messages.map(msg => {
    const author = msg.author;
    const avatar = author.displayAvatarURL({ size: 64 });
    const timestamp = new Date(msg.createdTimestamp).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const bot = author.bot ? '<span class="bot-tag">BOT</span>' : '';

    return `
      <div class="message">
        <img class="avatar" src="${escapeHtml(avatar)}" alt="avatar">
        <div class="message-body">
          <div class="message-header">
            <span class="username">${escapeHtml(author.username)}</span>${bot}
            <span class="timestamp">${escapeHtml(timestamp)}</span>
          </div>
          <div class="message-content">${renderContent(msg.content)}</div>
          ${renderAttachments(msg)}
          ${renderEmbeds(msg)}
        </div>
      </div>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Transcript — Ticket #${ticketNumber} — ${escapeHtml(channel.name)}</title>
<style>
  body { background: #313338; color: #dbdee1; font-family: "gg sans", "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 0; }
  .header { background: #2b2d31; padding: 20px 32px; border-bottom: 1px solid #1e1f22; }
  .header h1 { margin: 0 0 4px; font-size: 20px; color: #f2f3f5; }
  .header .meta { color: #949ba4; font-size: 13px; }
  .messages { padding: 16px 32px 48px; max-width: 900px; margin: 0 auto; }
  .message { display: flex; gap: 16px; padding: 8px 0; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; }
  .message-header { display: flex; align-items: baseline; gap: 8px; }
  .username { font-weight: 600; color: #f2f3f5; }
  .bot-tag { background: #5865f2; color: white; font-size: 10px; padding: 1px 4px; border-radius: 3px; font-weight: 600; }
  .timestamp { color: #949ba4; font-size: 12px; }
  .message-content { color: #dbdee1; line-height: 1.4; margin-top: 2px; word-wrap: break-word; }
  .inline-code { background: #2b2d31; padding: 1px 4px; border-radius: 3px; font-family: Consolas, monospace; font-size: 13px; }
  .code-block { background: #2b2d31; padding: 10px; border-radius: 6px; font-family: Consolas, monospace; font-size: 13px; overflow-x: auto; white-space: pre-wrap; }
  .attachment img { max-width: 400px; max-height: 300px; border-radius: 6px; margin-top: 6px; display: block; }
  .attachment a { color: #00a8fc; }
  .embed { border-left: 4px solid #5865f2; background: #2b2d31; padding: 10px 12px; border-radius: 4px; margin-top: 6px; max-width: 500px; }
  .embed-title { font-weight: 600; color: #f2f3f5; margin-bottom: 4px; }
  .embed-desc { font-size: 14px; color: #dbdee1; }
</style>
</head>
<body>
  <div class="header">
    <h1>Ticket #${ticketNumber} — #${escapeHtml(channel.name)}</h1>
    <div class="meta">Generated ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}${closedBy ? ` · Closed by ${escapeHtml(closedBy)}` : ''} · ${messages.length} messages</div>
  </div>
  <div class="messages">
    ${rows || '<p style="color:#949ba4;">No messages in this ticket.</p>'}
  </div>
</body>
</html>`;

  if (!fs.existsSync(TRANSCRIPTS_DIR)) fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
  const filePath = path.join(TRANSCRIPTS_DIR, `ticket-${ticketNumber}.html`);
  fs.writeFileSync(filePath, html, 'utf8');

  return { filePath, messageCount: messages.length };
}

module.exports = { generateTranscript };
