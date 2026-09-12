const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const store = require('../utils/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Guided setup wizard for the ticket system (run this once).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.reply({
      content:
        '**Ticket System Setup — Step 1 of 4**\nSelect the category where ticket channels should be created.\n\n_If you don\'t have one yet, create a category in Discord first, then re-run `/setup`._',
      components: [
        new ActionRowBuilder().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('setup_category')
            .setPlaceholder('Choose a category')
            .setChannelTypes(ChannelType.GuildCategory)
        ),
      ],
      ephemeral: true,
    });

    const filter = i => i.user.id === interaction.user.id && i.customId === 'setup_category';
    const step1 = await interaction.channel
      .awaitMessageComponent({ filter, time: 120_000 })
      .catch(() => null);

    if (!step1) {
      return interaction.editReply({ content: '⚠️ Setup timed out. Run `/setup` again.', components: [] });
    }

    const categoryId = step1.values[0];
    store.setGuildConfig(interaction.guild.id, { categoryId });

    await step1.update({
      content: '**Ticket System Setup — Step 2 of 4**\nSelect the role that should have access to all tickets (your support team).',
      components: [
        new ActionRowBuilder().addComponents(
          new RoleSelectMenuBuilder().setCustomId('setup_role').setPlaceholder('Choose support role')
        ),
      ],
    });

    const step2 = await interaction.channel
      .awaitMessageComponent({ filter: i => i.user.id === interaction.user.id && i.customId === 'setup_role', time: 120_000 })
      .catch(() => null);

    if (!step2) {
      return interaction.editReply({ content: '⚠️ Setup timed out. Run `/setup` again.', components: [] });
    }

    const supportRoleId = step2.values[0];
    store.setGuildConfig(interaction.guild.id, { supportRoleId });

    await step2.update({
      content: '**Ticket System Setup — Step 3 of 4**\nSelect the channel where closed-ticket transcripts should be logged.',
      components: [
        new ActionRowBuilder().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('setup_transcript')
            .setPlaceholder('Choose transcript log channel')
            .setChannelTypes(ChannelType.GuildText)
        ),
      ],
    });

    const step3 = await interaction.channel
      .awaitMessageComponent({ filter: i => i.user.id === interaction.user.id && i.customId === 'setup_transcript', time: 120_000 })
      .catch(() => null);

    if (!step3) {
      return interaction.editReply({ content: '⚠️ Setup timed out. Run `/setup` again.', components: [] });
    }

    const transcriptChannelId = step3.values[0];
    store.setGuildConfig(interaction.guild.id, { transcriptChannelId });

    await step3.update({
      content: '**Ticket System Setup — Step 4 of 4**\nFinally, choose where the first support panel (button) should be posted.',
      components: [
        new ActionRowBuilder().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId('setup_panel_channel')
            .setPlaceholder('Choose panel channel')
            .setChannelTypes(ChannelType.GuildText)
        ),
      ],
    });

    const step4 = await interaction.channel
      .awaitMessageComponent({ filter: i => i.user.id === interaction.user.id && i.customId === 'setup_panel_channel', time: 120_000 })
      .catch(() => null);

    if (!step4) {
      return interaction.editReply({ content: '⚠️ Setup timed out. Run `/setup` again.', components: [] });
    }

    const panelChannelId = step4.values[0];

    const modal = new ModalBuilder().setCustomId('setup_panel_modal').setTitle('Panel Text');

    const titleInput = new TextInputBuilder()
      .setCustomId('panel_title')
      .setLabel('Panel title')
      .setStyle(TextInputStyle.Short)
      .setValue('Support Tickets')
      .setRequired(true)
      .setMaxLength(100);

    const descInput = new TextInputBuilder()
      .setCustomId('panel_description')
      .setLabel('Panel description')
      .setStyle(TextInputStyle.Paragraph)
      .setValue('Click the button below to open a support ticket.')
      .setRequired(true)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descInput)
    );

    await step4.showModal(modal);

    const modalSubmit = await interaction
  .awaitModalSubmit({ filter: i => i.customId === 'setup_panel_modal' && i.user.id === interaction.user.id, time: 300_000 })
  .catch(() => null);

    if (!modalSubmit) {
      return interaction.editReply({ content: '⚠️ Panel text was not submitted in time. Config saved so far — use `/setup-panel` to post a panel manually.', components: [] });
    }

    const panelTitle = modalSubmit.fields.getTextInputValue('panel_title');
    const panelDescription = modalSubmit.fields.getTextInputValue('panel_description');

    const panelChannel = await interaction.guild.channels.fetch(panelChannelId);

    const embed = new EmbedBuilder()
      .setTitle(panelTitle)
      .setDescription(panelDescription)
      .setColor(0xffffff);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('panel_open_default').setLabel('Open Ticket').setStyle(ButtonStyle.Secondary).setEmoji('🎫')
    );

    const panelMessage = await panelChannel.send({ embeds: [embed], components: [row] });

    store.setPanel(interaction.guild.id, 'default', {
      channelId: panelChannelId,
      messageId: panelMessage.id,
      title: panelTitle,
      description: panelDescription,
    });

    await modalSubmit.reply({
      content: `✅ **Setup complete!**\n\n• Ticket category: <#${categoryId}>\n• Support role: <@&${supportRoleId}>\n• Transcript log: <#${transcriptChannelId}>\n• Panel posted in <#${panelChannelId}>\n\nUse \`/setup-panel\` to deploy additional panels elsewhere.`,
      ephemeral: true,
    });
  },
};
