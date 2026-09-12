const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-reaction-role')
    .setDescription('Create a reaction role embed - react to get/remove the role')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt => 
      opt.setName('channel')
        .setDescription('Channel to send the reaction role embed to')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addRoleOption(opt => opt.setName('role').setDescription('Role to assign on reaction').setRequired(true))
    .addStringOption(opt => opt.setName('emoji').setDescription('Emoji to react with (e.g. 📦)').setRequired(true))
    .addStringOption(opt => opt.setName('title').setDescription('Embed title').setRequired(false))
    .addStringOption(opt => opt.setName('description').setDescription('Description for this role').setRequired(false)),

  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');
    const emoji = interaction.options.getString('emoji');
    const title = interaction.options.getString('title') || '🔔 React to Get Roles';
    const desc = interaction.options.getString('description') || role.name;

    const listDescription = `${emoji} **${desc}** — ${role}`;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`React below to claim or remove your role!\n\n${listDescription}`)
      .setColor('#ffffff')
      .setTimestamp();

    try {
      const message = await targetChannel.send({ embeds: [embed] });
      await message.react(emoji);
      
      await interaction.reply({ content: `✅ Reaction role embed created in ${targetChannel}!`, ephemeral: true });
      
      console.log(`Reaction role created: ${message.id} in ${targetChannel.id} for role ${role.id} with emoji ${emoji}`);
    } catch (err) {
      console.error('Failed to create reaction role:', err);
      await interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true });
    }
  },
};
