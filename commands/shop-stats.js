const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const SELLAUTH_API_KEY = process.env.SELLAUTH_API_KEY;
const SHOP_ID = process.env.SHOP_ID;
const STORE_NAME = process.env.STORE_NAME;

async function sellAuthGet(path) {
  const res = await fetch(`https://api.sellauth.com/v1/shops/${SHOP_ID}/${path}`, {
    headers: { Authorization: `Bearer ${SELLAUTH_API_KEY}` },
  });
  return res.json();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop-stats')
    .setDescription('Show shop stats.'),

  async execute(interaction) {
    await interaction.deferReply();

    const [stats, feedbackStats] = await Promise.all([
      sellAuthGet('analytics'),
      sellAuthGet('feedbacks/stats'),
    ]);

    const average = feedbackStats?.average ?? feedbackStats?.average_rating ?? null;
    const total = feedbackStats?.total ?? feedbackStats?.total_feedbacks ?? null;

    const embed = new EmbedBuilder()
      .setTitle('🛒 Shop Stats')
      .setColor(0xFFFFFF)
      .addFields(
        { name: '💰 Revenue', value: `£${Number(stats.revenue ?? 0).toFixed(2)}`, inline: true },
        { name: '📦 Orders', value: String(stats.orders ?? 0), inline: true },
        { name: '👥 Customers', value: String(stats.customers ?? 0), inline: true },
      )
      .setFooter({
        text: STORE_NAME
          ? `${STORE_NAME} · Shop #${SHOP_ID}`
          : `Shop #${SHOP_ID}`,
      })
      .setTimestamp();

    if (average !== null) {
      embed.addFields({
        name: '⭐ Rating',
        value: `${Number(average).toFixed(2)} / 5.00${total !== null ? ` from ${total} review${total === 1 ? '' : 's'}` : ''}`,
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
