const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const fs = require('fs');
const store = require('../utils/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Permanently delete this ticket and its transcript. Cannot be undone.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(opt =>
      opt.setName('ticket_number').setDescription('Ticket number (only needed if run outside the ticket channel)').setRequired(false)
    ),

  async execute(interaction) {
    const providedNumber = interaction.options.getInteger('ticket_number');
    let ticketNumber = providedNumber;
    let ticket;

    if (!ticketNumber) {
      ticket = store.getTicketByChannel(interaction.channel.id);
      if (!ticket) {
        return interaction.reply({
          content: '⚠️ Run this inside the ticket channel, or provide `ticket_number`.',
          ephemeral: true,
        });
      }
      ticketNumber = store.getTicketNumberByChannel(interaction.channel.id);
    } else {
      ticket = store.getTicket(ticketNumber);
      if (!ticket) {
        return interaction.reply({ content: `⚠️ No ticket found with number **${ticketNumber}**.`, ephemeral: true });
      }
    }

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`delete_confirm_${ticketNumber}`).setLabel('Yes, delete permanently').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('delete_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
    );

    const warnEmbed = new EmbedBuilder()
      .setTitle('⚠️ Confirm Permanent Deletion')
      .setDescription(
        `You are about to permanently delete **Ticket #${ticketNumber}**.\n\nThis will:\n• Delete the channel (if it still exists)\n• Delete the saved transcript file\n\n**This cannot be undone.**`
      )
      .setColor(0xed4245);

    const confirmMsg = await interaction.reply({
      embeds: [warnEmbed],
      components: [confirmRow],
      ephemeral: interaction.channel.id !== ticket.channelId,
      fetchReply: true,
    });

    const choice = await confirmMsg
      .awaitMessageComponent({
        filter: i => i.user.id === interaction.user.id,
        time: 30_000,
      })
      .catch(() => null);

    if (!choice) {
      return interaction.editReply({ content: '⏱️ Deletion timed out and was cancelled.', embeds: [], components: [] });
    }

    if (choice.customId === 'delete_cancel') {
      return choice.update({ content: '❌ Deletion cancelled.', embeds: [], components: [] });
    }

    await choice.update({ content: '🗑️ Deleting...', embeds: [], components: [] });

    if (ticket.transcriptPath && fs.existsSync(ticket.transcriptPath)) {
      fs.unlinkSync(ticket.transcriptPath);
    }

    store.saveTicket(ticketNumber, {
      status: 'deleted',
      transcriptPath: null,
      deletedAt: Date.now(),
      deletedBy: interaction.user.id,
    });

    const channelToDelete = await interaction.guild.channels.fetch(ticket.channelId).catch(() => null);
    if (channelToDelete) {
      await channelToDelete.delete(`Ticket #${ticketNumber} deleted by ${interaction.user.tag}`).catch(() => null);
    } else {
      await interaction.followUp({ content: `✅ Ticket #${ticketNumber} record and transcript deleted. (Channel was already gone.)`, ephemeral: true });
    }
  },
};
