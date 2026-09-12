const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-role')
    .setDescription('Add a role to a user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to give the role to')
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to give')
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
      await member.roles.add(role);
      await interaction.editReply(`Successfully added **${role.name}** to **${targetUser.tag}**.`);
    } catch (error) {
      console.error(error);
      await interaction.editReply(`Failed to add the role. Please check my permissions and role hierarchy.\n\nError: ${error.message}`);
    }
  },
};
