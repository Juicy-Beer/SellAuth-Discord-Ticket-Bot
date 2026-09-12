const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const store = require('../utils/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add a user to this ticket.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption(opt => opt.setName('user').setDescription('User to add').setRequired(true)),

  async execute(interaction) {
    const ticket = store.getTicketByChannel(interaction.channel.id);
    if (!ticket) {
      return interaction.reply({ content: '⚠️ This command can only be used inside a ticket channel.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');

    await interaction.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
    });

    await interaction.reply(`✅ <@${user.id}> has been added to the ticket by <@${interaction.user.id}>.`);
  },
};
