const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bitcoin')
    .setDescription('Displays the store Bitcoin cryptocurrency wallet address'),

  async execute(interaction) {
    const btcAddress = process.env.BITCOIN_ADDRESS || 'Not configured yet';

    const embed = new EmbedBuilder()
      .setTitle('🪙 Bitcoin Payment Information')
      .setDescription('To make a manual payment using Bitcoin, please send the exact amount to the wallet address below. Make sure to double-check the address before sending.')
      .addFields(
        { name: 'Bitcoin Wallet Address', value: `\`${btcAddress}\``, inline: false }
      )
      .setColor('Orange')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
