const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('paypal')
    .setDescription('Displays the store PayPal payment email address'),

  async execute(interaction) {
    const paypalEmail = process.env.PAYPAL_EMAIL || 'Not configured yet';

    const embed = new EmbedBuilder()
      .setTitle('💳 PayPal Payment Information')
      .setDescription('To make a manual payment via PayPal, please use the address below. Be sure to send as **Friends & Family** or include your order details in the notes.')
      .addFields(
        { name: 'PayPal Email', value: `\`${paypalEmail}\``, inline: false }
      )
      .setColor('Blue')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
