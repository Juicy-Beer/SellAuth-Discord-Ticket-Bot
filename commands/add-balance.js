const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-balance')
    .setDescription('Add or adjust balance for a customer on SellAuth')
    .addStringOption(option =>
      option.setName('email')
        .setDescription('The customer email address')
        .setRequired(true)
    )
    .addNumberOption(option =>
      option.setName('amount')
        .setDescription('The amount to add (use negative to subtract)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the balance adjustment')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const email = interaction.options.getString('email');
    const amount = interaction.options.getNumber('amount');
    const reason = interaction.options.getString('reason') || 'Manual adjustment via Discord bot';

    try {
      const searchResponse = await axios.get(`https://api.sellauth.com/v1/shops/${process.env.SHOP_ID}/customers`, {
        headers: {
          'Authorization': `Bearer ${process.env.SELLAUTH_API_KEY}`
        },
        params: {
          email: email
        }
      });

      const customers = searchResponse.data.data || searchResponse.data;
      const customer = Array.isArray(customers) ? customers.find(c => c.email.toLowerCase() === email.toLowerCase()) : customers;

      if (!customer) {
        return interaction.editReply(`Could not find a SellAuth customer registered under the email **${email}**.`);
      }

      const customerId = customer.id;

      const updateResponse = await axios.put(`https://api.sellauth.com/v1/shops/${process.env.SHOP_ID}/customers/${customerId}/balance`, {
        amount: amount,
        description: reason
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.SELLAUTH_API_KEY}`
        }
      });

      const updatedData = updateResponse.data;
      const newBalance = updatedData.balance !== undefined ? updatedData.balance : 'Updated';

      const embed = new EmbedBuilder()
        .setTitle('✅ Customer Balance Updated')
        .setColor('Green')
        .addFields(
          { name: 'Customer Email', value: `\`${email}\``, inline: false },
          { name: 'Amount Added', value: `\`€${amount}\``, inline: true },
          { name: 'New Balance', value: `\`€${newBalance}\``, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.editReply('An error occurred while communicating with the SellAuth API. Please verify your API permissions and customer email.');
    }
  },
};
