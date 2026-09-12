const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  AttachmentBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require('discord.js');
const store = require('../utils/store');
const { generateTranscript } = require('../utils/transcript');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close this ticket and save the transcript.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const ticket = store.getTicketByChannel(interaction.channel.id);
    if (!ticket) {
      return interaction.reply({ content: '⚠️ This command can only be used inside a ticket channel.', ephemeral: true });
    }

    const config = store.getGuildConfig(interaction.guild.id);
    const isSupport = config?.supportRoleId && interaction.member.roles.cache.has(config.supportRoleId);
    const hasManagerPerms = interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels);
    
    if (!isSupport && !hasManagerPerms) {
      return interaction.reply({ 
        content: '⚠️ Only support staff can close tickets.', 
        ephemeral: true 
      });
    }

    if (ticket.status === 'closed') {
      return interaction.reply({ content: '⚠️ This ticket is already closed.', ephemeral: true });
    }

    await interaction.deferReply();

    const ticketNumber = store.getTicketNumberByChannel(interaction.channel.id);
    const reason = 'No reason provided';

    const { filePath, messageCount } = await generateTranscript(interaction.channel, {
      ticketNumber,
      closedBy: interaction.user.tag,
    });

    store.saveTicket(ticketNumber, {
      status: 'closed',
      closedAt: Date.now(),
      closedBy: interaction.user.id,
      closeReason: reason,
      transcriptPath: filePath,
    });

    const attachment = new AttachmentBuilder(filePath, { name: `ticket-${ticketNumber}-transcript.html` });

    const logEmbed = new EmbedBuilder()
      .setTitle(`Ticket #${ticketNumber} Closed`)
      .addFields(
        { name: 'Channel', value: `#${interaction.channel.name}`, inline: true },
        { name: 'Opened by', value: `<@${ticket.openerId}>`, inline: true },
        { name: 'Closed by', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Claimed by', value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : '_Unclaimed_', inline: true },
        { name: 'Messages', value: String(messageCount), inline: true },
        { name: 'Reason', value: reason, inline: false }
      )
      .setColor(0xed4245)
      .setTimestamp();

    if (config?.transcriptChannelId) {
      const logChannel = await interaction.guild.channels.fetch(config.transcriptChannelId).catch(() => null);
      if (logChannel) {
        await logChannel.send({ embeds: [logEmbed], files: [attachment] });
      }
    }

    await interaction.channel.permissionOverwrites.edit(ticket.openerId, {
      SendMessages: false,
      ViewChannel: true,
    }).catch(() => null);

    await interaction.editReply({
      content: `🔒 Ticket closed by <@${interaction.user.id}>. Reason: ${reason}\n\nTranscript saved${config?.transcriptChannelId ? ` to <#${config.transcriptChannelId}>` : ''}. This channel will be archived.`,
      files: [attachment],
    });
  },
};
