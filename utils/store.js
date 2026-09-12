const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const GUILD_CONFIG_PATH = path.join(DATA_DIR, 'guildConfig.json');
const TICKETS_PATH = path.join(DATA_DIR, 'tickets.json');

function ensureFile(filePath, defaultValue) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

function readJSON(filePath, defaultValue) {
  ensureFile(filePath, defaultValue);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Failed to parse ${filePath}, resetting to default.`, err);
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getGuildConfig(guildId) {
  const all = readJSON(GUILD_CONFIG_PATH, {});
  return all[guildId] || null;
}

function setGuildConfig(guildId, partialConfig) {
  const all = readJSON(GUILD_CONFIG_PATH, {});
  all[guildId] = { ...(all[guildId] || {}), ...partialConfig };
  writeJSON(GUILD_CONFIG_PATH, all);
  return all[guildId];
}

function setPanel(guildId, panelName, panelData) {
  const all = readJSON(GUILD_CONFIG_PATH, {});
  if (!all[guildId]) all[guildId] = {};
  if (!all[guildId].panels) all[guildId].panels = {};
  all[guildId].panels[panelName] = panelData;
  writeJSON(GUILD_CONFIG_PATH, all);
}

function getNextTicketNumber(guildId) {
  const all = readJSON(GUILD_CONFIG_PATH, {});
  if (!all[guildId]) all[guildId] = {};
  const current = all[guildId].nextTicketNumber || 1;
  all[guildId].nextTicketNumber = current + 1;
  writeJSON(GUILD_CONFIG_PATH, all);
  return current;
}

function getAllTickets() {
  return readJSON(TICKETS_PATH, {});
}

function getTicket(ticketNumber) {
  const all = readJSON(TICKETS_PATH, {});
  return all[String(ticketNumber)] || null;
}

function getTicketByChannel(channelId) {
  const all = readJSON(TICKETS_PATH, {});
  return Object.values(all).find(t => t.channelId === channelId) || null;
}

function getTicketNumberByChannel(channelId) {
  const all = readJSON(TICKETS_PATH, {});
  const entry = Object.entries(all).find(([, t]) => t.channelId === channelId);
  return entry ? entry[0] : null;
}

function saveTicket(ticketNumber, data) {
  const all = readJSON(TICKETS_PATH, {});
  all[String(ticketNumber)] = { ...(all[String(ticketNumber)] || {}), ...data };
  writeJSON(TICKETS_PATH, all);
  return all[String(ticketNumber)];
}

module.exports = {
  getGuildConfig,
  setGuildConfig,
  setPanel,
  getNextTicketNumber,
  getAllTickets,
  getTicket,
  getTicketByChannel,
  getTicketNumberByChannel,
  saveTicket,
};
