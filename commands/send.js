const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('send')
    .setDescription('Post a Markdown-formatted message to any channel the bot can see.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption(opt =>
      opt
        .setName('channel')
        .setDescription('Target channel')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('message').setDescription('Message content (Markdown supported)').setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');

    const permissions = channel.permissionsFor(interaction.guild.members.me);
    if (!permissions?.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.ViewChannel)) {
      return interaction.reply({
        content: `⚠️ I don't have permission to send messages in <#${channel.id}>.`,
        ephemeral: true,
      });
    }

    if (message.length > 2000) {
      return interaction.reply({
        content: `⚠️ Message is ${message.length} characters — Discord's limit is 2000. Please shorten.`,
        ephemeral: true,
      });
    }

    await channel.send(message);

    await interaction.reply({ content: `✅ Message sent to <#${channel.id}>.`, ephemeral: true });
  },
};
