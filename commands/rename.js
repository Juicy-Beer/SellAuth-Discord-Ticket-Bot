const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const store = require('../utils/store');

function sanitizeChannelName(raw) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 90); 
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rename')
    .setDescription('Rename this ticket channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(opt => opt.setName('name').setDescription('New channel name').setRequired(true)),

  async execute(interaction) {
    const ticket = store.getTicketByChannel(interaction.channel.id);
    if (!ticket) {
      return interaction.reply({ content: '⚠️ This command can only be used inside a ticket channel.', ephemeral: true });
    }

    const rawName = interaction.options.getString('name');
    const newName = sanitizeChannelName(rawName);

    if (!newName) {
      return interaction.reply({ content: '⚠️ That name is invalid after sanitizing. Use letters, numbers, and hyphens.', ephemeral: true });
    }

    const oldName = interaction.channel.name;
    await interaction.channel.setName(newName);

    await interaction.reply(`✅ Renamed channel from \`${oldName}\` to \`${newName}\`.`);
  },
};
