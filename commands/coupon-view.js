const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCoupons } = require('../utils/sellauth');

const WHITELISTED_USERS = (process.env.WHITELISTED_USERS || '').split(',').map(id => id.trim());

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coupon-view')
    .setDescription('View a SellAuth coupon.')
    .addStringOption(option =>
      option.setName('code').setDescription('The coupon code to search for').setRequired(true)
    ),
  async execute(interaction) {
    if (!WHITELISTED_USERS.includes(interaction.user.id)) {
      return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const code = interaction.options.getString('code');

    let coupon;
    try {
      const res = await getCoupons();
      const coupons = Array.isArray(res) ? res : (res?.data || []);
      coupon = coupons.find(c => c.code === code);
    } catch (err) {
      console.error('SellAuth coupon view error:', err);
      return interaction.editReply(`⚠️ Failed to view coupon: ${err.message}`);
    }

    if (!coupon) {
      return interaction.editReply(`No coupon found with the code: \`${code}\``);
    }

    let productStr;
    if (coupon.global) {
      productStr = 'All Products';
    } else if (!coupon.products || coupon.products.length === 0) {
      productStr = 'No Products';
    } else {
      productStr = coupon.products.map(product => product.name).join(', ');
    }

    const embed = new EmbedBuilder()
      .setTitle('🎟️ Coupon Details')
      .setColor('#6571ff')
      .setTimestamp()
      .addFields(
        { name: 'Code', value: coupon.code, inline: true },
        { name: 'Discount', value: coupon.type === 'percentage' ? `${coupon.discount}%` : `$${coupon.discount}`, inline: true },
        { name: 'Global', value: coupon.global ? 'Yes' : 'No', inline: true },
        {
          name: 'Expiration Date',
          value: coupon.expiration_date ? new Date(coupon.expiration_date).toLocaleString() : 'No Expiration Date',
          inline: true
        },
        { name: 'Uses', value: `${coupon.uses}/${coupon.max_uses || '∞'}`, inline: true },
        {
          name: 'Allowed Emails',
          value: coupon.allowed_emails?.length ? coupon.allowed_emails.join(', ') : 'All Emails',
          inline: false
        },
        { name: 'Products', value: productStr, inline: false }
      );

    await interaction.editReply({ embeds: [embed] });
  }
};
