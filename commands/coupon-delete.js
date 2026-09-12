const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCoupons, deleteCoupon, SHOP_ID } = require('../utils/sellauth');

const WHITELISTED_USERS = (process.env.WHITELISTED_USERS || '').split(',').map(id => id.trim());

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coupon-delete')
    .setDescription('Delete a SellAuth coupon.')
    .addStringOption(option => option.setName('code').setDescription('Coupon code').setRequired(true)),
  async execute(interaction) {
    if (!WHITELISTED_USERS.includes(interaction.user.id)) {
      return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const code = interaction.options.getString('code');

    let couponData;
    try {
      const rawCoupons = await getCoupons();
      const coupons = Array.isArray(rawCoupons) ? rawCoupons : (rawCoupons?.data || []);
      couponData = coupons.find(coupon => coupon.code === code);
    } catch (err) {
      console.error('SellAuth coupon fetch error:', err);
      return interaction.editReply(`⚠️ Failed to load coupons: ${err.message}`);
    }

    if (!couponData) {
      return interaction.editReply(`Coupon \`${code}\` not found.`);
    }

    try {
      await deleteCoupon(couponData.id);
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Coupon Deleted')
        .setDescription(`Coupon \`${code}\` has been successfully deleted.`)
        .setColor('#6571ff')
        .setFooter({ text: `Shop #${SHOP_ID} · SellAuth` })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('SellAuth coupon delete error:', err);
      return interaction.editReply(`⚠️ There was an error deleting the coupon: ${err.message}`);
    }
  }
};
