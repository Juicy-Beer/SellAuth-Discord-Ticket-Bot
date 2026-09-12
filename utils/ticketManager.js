const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const store = require('./store');

async function openTicket(interaction, panelName) {
  const { guild, user } = interaction;
  const config = store.getGuildConfig(guild.id);

  if (!config || !config.categoryId || !config.supportRoleId) {
    return interaction.reply({
      content: '⚠️ This server has not run `/setup` yet. Ask an admin to configure the ticket system first.',
      ephemeral: true,
    });
  }

  //only 1 ticket per person
  const tickets = store.getAllTickets();
  const existingOpen = Object.entries(tickets).find(
    ([, t]) => t.guildId === guild.id && t.openerId === user.id && t.status === 'open'
  );
  if (existingOpen) {
    const [, t] = existingOpen;
    return interaction.reply({
      content: `⚠️ You already have an open ticket: <#${t.channelId}>`,
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const ticketNumber = store.getNextTicketNumber(guild.id);
  const channelName = `ticket-${ticketNumber}`;

  const category = await guild.channels.fetch(config.categoryId).catch(() => null);
  if (!category) {
    return interaction.editReply('⚠️ The configured ticket category no longer exists. Ask an admin to re-run `/setup`.');
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: config.supportRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: guild.members.me.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageRoles,
          PermissionFlagsBits.AttachFiles,
        ],
      },
    ],
  });

  store.saveTicket(ticketNumber, {
    guildId: guild.id,
    channelId: channel.id,
    openerId: user.id,
    claimedBy: null,
    status: 'open',
    createdAt: Date.now(),
    closedAt: null,
    transcriptPath: null,
    panelName: panelName || null,
  });

  const embed = new EmbedBuilder()
    .setTitle(`Ticket #${ticketNumber}`)
    .setDescription(
      `Welcome <@${user.id}>! Support (<@&${config.supportRoleId}>) will be with you shortly.\n\nPlease describe your issue in as much detail as possible.`
    )
    .setColor(0xffffff)
    .setTimestamp();

  const controlRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_claim').setLabel('Claim').setStyle(ButtonStyle.Primary).setEmoji('🙋'),
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setStyle(ButtonStyle.Danger).setEmoji('🔒')
  );

  await channel.send({
    content: `<@${user.id}> <@&${config.supportRoleId}>`,
    embeds: [embed],
    components: [controlRow],
  });

  await interaction.editReply(`✅ Your ticket has been created: <#${channel.id}>`);
}

module.exports = { openTicket };
