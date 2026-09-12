const { Events, MessageFlags } = require('discord.js');
const { openTicket } = require('../utils/ticketManager');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      const rawWhitelist = process.env.WHITELISTED_USERS || '';
      const whitelistedUsers = rawWhitelist
        .split(',')
        .map(id => id.replace(/['"\s]/g, ''))
        .filter(Boolean);

      if (interaction.isCommand()) {
        const userId = interaction.user.id;

        if (!whitelistedUsers.includes(userId)) {
          return interaction.reply({
            content: '❌ You are not authorized to use this bot.',
            flags: MessageFlags.Ephemeral,
          });
        }

        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) {
          console.warn(`No handler found for command: ${interaction.commandName}`);
          return;
        }

        await command.execute(interaction);
        return;
      }

      if (interaction.isButton()) {
        await handleButton(interaction);
        return;
      }
    } catch (err) {
      console.error('Error handling interaction:', err);
      const errorPayload = { content: '❌ Something went wrong handling that. Check the bot logs.', flags: MessageFlags.Ephemeral };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorPayload).catch(() => null);
      } else {
        await interaction.reply(errorPayload).catch(() => null);
      }
    }
  },
};

async function handleButton(interaction) {
  const { customId } = interaction;

  if (customId.startsWith('panel_open_')) {
    const panelName = customId.replace('panel_open_', '');
    return openTicket(interaction, panelName);
  }

  if (customId === 'ticket_claim') {
    const claimCommand = interaction.client.commands.get('claim');
    return claimCommand.execute(interaction);
  }

  if (customId === 'ticket_close') {
    const closeCommand = interaction.client.commands.get('close');
    return closeCommand.execute(interaction);
  }
}
