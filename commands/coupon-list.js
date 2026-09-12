const { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCoupons } = require('../utils/sellauth');

const WHITELISTED_USERS = (process.env.WHITELISTED_USERS || '').split(',').map(id => id.trim());

function formatCoupon(coupon, isSingle) {
  const { code, type, discount, expiration_date, uses, max_uses, products, global } = coupon;

  const valueStr = type === 'percentage' ? `${discount}%` : `$${discount}`;
  const expirationStr = expiration_date
    ? `Expires at ${new Date(expiration_date).toLocaleString()}`
    : 'No Expiration Date';
  const redeemedStr = `${uses}/${max_uses || '∞'}`;
  const allowedEmailsStr = coupon.allowed_emails?.length ? coupon.allowed_emails.join(', ') : 'All Emails';

  let productStr = '';

  if (global) {
    productStr = 'All Products';
  } else if (!products || products.length === 0) {
    productStr = 'No Products';
  } else if (isSingle) {
    productStr = products.map(product => product.name).join(', ');
  } else {
    productStr = products.slice(0, 2).map(product => product.name).join(', ');
    if (products.length > 2) {
      productStr += ` and ${products.length - 2} more`;
    }
  }

  return `**${code}**: ${valueStr} • ${expirationStr} • ${redeemedStr} • ${allowedEmailsStr} • ${productStr}`;
}

function buildComponents(page, totalPages) {
  const components = [];
  if (totalPages > 1) {
    const row = new ActionRowBuilder();
    if (page > 1) {
      row.addComponents(
        new ButtonBuilder().setCustomId('coupon-list-prev').setLabel('Previous').setStyle(ButtonStyle.Primary)
      );
    }
    if (page < totalPages) {
      row.addComponents(
        new ButtonBuilder().setCustomId('coupon-list-next').setLabel('Next').setStyle(ButtonStyle.Primary)
      );
    }
    components.push(row);
  }
  return components;
}

module.exports = {
  data: new SlashCommandBuilder().setName('coupon-list').setDescription('List all coupons.'),
  async execute(interaction) {
    if (!WHITELISTED_USERS.includes(interaction.user.id)) {
      return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
    }

    await interaction.deferReply();

    const pageSize = 10;
    let page = 1;

    let rawCoupons;
    try {
      rawCoupons = await getCoupons();
    } catch (err) {
      console.error('SellAuth coupon list error:', err);
      return interaction.editReply(`⚠️ Failed to list coupons: ${err.message}`);
    }

    const coupons = Array.isArray(rawCoupons) ? rawCoupons : (rawCoupons?.data || []);

    const totalPages = Math.max(1, Math.ceil(coupons.length / pageSize));

    const embed = new EmbedBuilder().setTitle('Coupon List').setColor('#6571ff');

    function renderPage() {
      const startIndex = (page - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, coupons.length);
      const currentCoupons = coupons.slice(startIndex, endIndex);

      embed.setDescription(
        currentCoupons.length === 0
          ? 'No coupons found.'
          : currentCoupons.map(coupon => formatCoupon(coupon, false)).join('\n')
      );
      embed.setFooter({ text: `Page ${page} of ${totalPages}` });
    }

    renderPage();

    const initialResponse = await interaction.editReply({
      embeds: [embed],
      components: buildComponents(page, totalPages)
    });

    if (totalPages > 1) {
      const collector = interaction.channel.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id && i.message.id === initialResponse.id,
        time: 15000
      });

      collector.on('collect', async i => {
        if (i.customId === 'coupon-list-prev') page--;
        else if (i.customId === 'coupon-list-next') page++;

        renderPage();

        await i.update({ embeds: [embed], components: buildComponents(page, totalPages) });
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.editReply({ components: [] }).catch(() => {});
        }
      });
    }
  }
};
