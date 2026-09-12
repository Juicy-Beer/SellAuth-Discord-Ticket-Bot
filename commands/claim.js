const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const store = require('../utils/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim this ticket as the handler.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const ticket = store.getTicketByChannel(interaction.channel.id);
    if (!ticket) {
      return interaction.reply({ content: '⚠️ This command can only be used inside a ticket channel.', ephemeral: true });
    }

    const config = store.getGuildConfig(interaction.guild.id);
    const member = interaction.member;
    if (config?.supportRoleId && !member.roles.cache.has(config.supportRoleId) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '⚠️ Only support team members can claim tickets.', ephemeral: true });
    }

    if (ticket.claimedBy) {
      return interaction.reply({
        content: `⚠️ This ticket is already claimed by <@${ticket.claimedBy}>.`,
        ephemeral: true,
      });
    }

    const ticketNumber = store.getTicketNumberByChannel(interaction.channel.id);
    store.saveTicket(ticketNumber, { claimedBy: interaction.user.id });

    const embed = new EmbedBuilder()
      .setDescription(`🙋 Ticket claimed by <@${interaction.user.id}>.`)
      .setColor(0xffffff);

    await interaction.reply({ embeds: [embed] });
  },
};
