const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCoupons, updateCoupon, SHOP_ID } = require('../utils/sellauth');

const WHITELISTED_USERS = (process.env.WHITELISTED_USERS || '').split(',').map(id => id.trim());

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coupon-update')
    .setDescription('Edit an existing SellAuth coupon.')
    .addStringOption(option => option.setName('code').setDescription('Coupon code').setRequired(true))
    .addBooleanOption(option => option.setName('global').setDescription('Is the coupon global?').setRequired(false))
    .addNumberOption(option => option.setName('discount').setDescription('Discount amount').setRequired(false))
    .addStringOption(option =>
      option
        .setName('type')
        .setDescription('Discount type: percentage or fixed')
        .setRequired(false)
        .addChoices({ name: 'Percentage', value: 'percentage' }, { name: 'Fixed', value: 'fixed' })
    )
    .addNumberOption(option => option.setName('max_uses').setDescription('Maximum uses for the coupon').setRequired(false))
    .addStringOption(option => option.setName('expiration_date').setDescription('Expiration date (e.g., 2024-09-25T12:35:22)').setRequired(false))
    .addStringOption(option => option.setName('allowed_emails').setDescription('Allowed emails (comma-separated)').setRequired(false))
    .addStringOption(option => option.setName('products').setDescription('Applicable product IDs (comma-separated)').setRequired(false)),
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

    const global = interaction.options.getBoolean('global') ?? couponData.global;
    const discount = interaction.options.getNumber('discount') ?? couponData.discount;
    const type = interaction.options.getString('type') ?? couponData.type;
    const maxUses = interaction.options.getNumber('max_uses') ?? couponData.max_uses;
    const expirationDate = interaction.options.getString('expiration_date') ?? couponData.expiration_date;
    const allowedEmails = interaction.options.getString('allowed_emails')?.split(',').map(e => e.trim()) ?? couponData.allowed_emails;
    let products = interaction.options.getString('products')?.split(',').map(p => p.trim()) ?? couponData.products;

    if (global) {
      products = [];
    }

    const updatedCouponData = {
      code,
      global,
      discount,
      type,
      max_uses: maxUses,
      expiration_date: expirationDate,
      allowed_emails: allowedEmails,
      products
    };

    try {
      await updateCoupon(couponData.id, updatedCouponData);
      const embed = new EmbedBuilder()
        .setTitle('✏️ Coupon Updated')
        .setDescription(`Coupon \`${code}\` has been successfully updated.`)
        .setColor('#6571ff')
        .addFields(
          { name: 'Discount', value: `${discount} (${type})`, inline: true },
          { name: 'Global', value: global ? 'Yes' : 'No', inline: true },
          { name: 'Max Uses', value: maxUses?.toString() ?? '∞', inline: true },
          { name: 'Expires On', value: expirationDate ?? 'Never', inline: true }
        )
        .setFooter({ text: `Shop #${SHOP_ID} · SellAuth` })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('SellAuth coupon update error:', err);
      return interaction.editReply(`⚠️ There was an error updating the coupon: ${err.message}`);
    }
  }
};
