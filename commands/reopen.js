const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const store = require('../utils/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reopen')
    .setDescription('Reopen a closed ticket.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(opt =>
      opt
        .setName('ticket_number')
        .setDescription('Ticket number (required if the channel was deleted, or to reopen from elsewhere)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const providedNumber = interaction.options.getInteger('ticket_number');
    let ticketNumber = providedNumber;
    let ticket;

    if (!ticketNumber) {
      ticket = store.getTicketByChannel(interaction.channel.id);
      if (!ticket) {
        return interaction.reply({
          content: '⚠️ Run this inside the ticket channel, or provide `ticket_number` (needed if the channel was deleted).',
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

    if (ticket.status === 'open') {
      return interaction.reply({ content: '⚠️ This ticket is already open.', ephemeral: true });
    }

    await interaction.deferReply();

    const config = store.getGuildConfig(interaction.guild.id);
    const existingChannel = await interaction.guild.channels.fetch(ticket.channelId).catch(() => null);

    if (existingChannel) {
      await existingChannel.permissionOverwrites.edit(ticket.openerId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });

      store.saveTicket(ticketNumber, { status: 'open', closedAt: null, closeReason: null });

      const embed = new EmbedBuilder()
        .setDescription(`🔓 Ticket reopened by <@${interaction.user.id}>.`)
        .setColor(0x57f287);

      await existingChannel.send({ embeds: [embed] });
      return interaction.editReply(`✅ Ticket #${ticketNumber} reopened: <#${existingChannel.id}>`);
    }

    if (!config?.categoryId || !config?.supportRoleId) {
      return interaction.editReply('⚠️ Cannot recreate the channel: ticket category or support role is not configured. Run `/setup`.');
    }

    const category = await interaction.guild.channels.fetch(config.categoryId).catch(() => null);
    if (!category) {
      return interaction.editReply('⚠️ The configured ticket category no longer exists.');
    }

    const newChannel = await interaction.guild.channels.create({
      name: `ticket-${ticketNumber}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: ticket.openerId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
        },
        {
          id: config.supportRoleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.AttachFiles],
        },
        {
          id: interaction.guild.members.me.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles, PermissionFlagsBits.AttachFiles],
        },
      ],
    });

    store.saveTicket(ticketNumber, {
      status: 'open',
      channelId: newChannel.id,
      closedAt: null,
      closeReason: null,
    });

    const embed = new EmbedBuilder()
      .setTitle(`Ticket #${ticketNumber} (Reopened)`)
      .setDescription(
        `This ticket was reopened by <@${interaction.user.id}>. The original channel had been deleted, so this is a fresh channel — the previous transcript is still saved and can be found in the transcript log.\n\nOriginally opened by <@${ticket.openerId}>.`
      )
      .setColor(0xffffff)
      .setTimestamp();

    const controlRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Primary).setEmoji('🙋'),
      new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒')
    );

    await newChannel.send({
      content: `<@${ticket.openerId}> <@&${config.supportRoleId}>`,
      embeds: [embed],
      components: [controlRow],
    });

    await interaction.editReply(`✅ Ticket #${ticketNumber} reopened in a new channel: <#${newChannel.id}> (original channel had been deleted).`);
  },
};
