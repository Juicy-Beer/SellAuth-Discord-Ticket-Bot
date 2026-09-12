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
    .setName('setup-panel')
    .setDescription('Post a ticket button panel in a channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName('panel').setDescription('Internal name for this panel (e.g. billing, general)').setRequired(true)
    )
    .addChannelOption(opt =>
      opt
        .setName('channel')
        .setDescription('Channel to post the panel in')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('title').setDescription('Title shown above the button (default: "Support Tickets")').setRequired(false)
    )
    .addStringOption(opt =>
      opt
        .setName('description')
        .setDescription('Description text shown above the button, explaining what this panel is for')
        .setRequired(false)
    ),

  async execute(interaction) {
    const config = store.getGuildConfig(interaction.guild.id);
    if (!config || !config.categoryId || !config.supportRoleId) {
      return interaction.reply({
        content: '⚠️ Run `/setup` first to configure the ticket category and support role.',
        ephemeral: true,
      });
    }

    const panelName = interaction.options.getString('panel').toLowerCase().replace(/\s+/g, '-');
    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title') || 'Support Tickets';
    const description = interaction.options.getString('description') || 'Click the button below to open a support ticket.';

    const customId = `panel_open_${panelName}`;

    const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(0xffffff);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(customId).setLabel('Open Ticket').setStyle(ButtonStyle.Secondary).setEmoji('🎫')
    );

    const message = await channel.send({ embeds: [embed], components: [row] });

    store.setPanel(interaction.guild.id, panelName, {
      channelId: channel.id,
      messageId: message.id,
      title,
      description,
    });

    await interaction.reply({
      content: `✅ Panel **${panelName}** posted in <#${channel.id}>.`,
      ephemeral: true,
    });
  },
};
