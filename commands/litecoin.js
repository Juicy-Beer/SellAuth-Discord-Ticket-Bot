const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('litecoin')
    .setDescription('Displays the store Litecoin cryptocurrency wallet address'),

  async execute(interaction) {
    const ltcAddress = process.env.LITECOIN_ADDRESS || 'Not configured yet';

    const embed = new EmbedBuilder()
      .setTitle('🪙 Litecoin Payment Information')
      .setDescription('To make a manual payment using Litecoin, please send the exact amount to the wallet address below. Make sure to double-check the address before sending.')
      .addFields(
        { name: 'Litecoin Wallet Address', value: `\`${ltcAddress}\``, inline: false }
      )
      .setColor('Grey')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
