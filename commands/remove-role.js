const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-role')
    .setDescription('Remove a role from a user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to take the role from')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to remove')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser('target');
    const role = interaction.options.getRole('role');
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      return interaction.editReply('Could not find that user in this server.');
    }

    try {
      await member.roles.remove(role);
      await interaction.editReply(`Successfully removed **${role.name}** from **${targetUser.tag}**.`);
    } catch (error) {
      console.error(error);
      await interaction.editReply(`Failed to remove the role. Please check my permissions and role hierarchy.\n\nError: ${error.message}`);
    }
  },
};
