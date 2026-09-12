const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const SELLAUTH_API_KEY = process.env.SELLAUTH_API_KEY;
const SHOP_ID = process.env.SHOP_ID;

async function sellAuthPost(path, body = {}) {
  const res = await fetch(`https://api.sellauth.com/v1/shops/${SHOP_ID}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SELLAUTH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sellAuthGet(path) {
  const res = await fetch(`https://api.sellauth.com/v1/shops/${SHOP_ID}/${path}`, {
    headers: { Authorization: `Bearer ${SELLAUTH_API_KEY}` },
  });
  return res.json();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('categories')
    .setDescription('Browse products by category.'),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const categoriesRes = await sellAuthPost('categories', { page: 1, perPage: 25 });
    console.log('Categories response:', JSON.stringify(categoriesRes));
    const categories = categoriesRes?.data ?? categoriesRes;

    if (!categories?.length) {
      return interaction.editReply('No categories found.');
    }

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('category_select')
        .setPlaceholder('Select a category')
        .addOptions(
          categories.slice(0, 25).map(c => ({
            label: c.name,
            value: String(c.id),
          }))
        )
    );

    await interaction.editReply({ content: 'Select a category to view its products:', components: [row] });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.customId === 'category_select' && i.user.id === interaction.user.id,
      time: 60_000,
      max: 1,
    });

    collector.on('collect', async i => {
      await i.deferUpdate();
      const categoryId = i.values[0];
      const category = categories.find(c => String(c.id) === categoryId);
      const products = await sellAuthGet(`products?category_id=${categoryId}`);
      console.log('Products response:', JSON.stringify(products));

      if (!products?.data?.length) {
        return i.editReply({ content: `No products found in **${category.name}**.`, components: [] });
      }

      const embed = new EmbedBuilder()
        .setTitle(`${category.name}`)
        .setColor(0xFFFFFF)
        .setFooter({ text: 'ZondisStore' })
        .setTimestamp();

      for (const product of products.data.slice(0, 10)) {
        const variants = product.variants ?? [];
        const lines = variants.map(v => {
          const stock = v.stock ?? 0;
          const price = v.price ? `£${v.price}` : 'N/A';
          return `${v.name} — ${price} — Stock: ${stock}`;
        }).join('\n') || 'No variants';
        embed.addFields({ name: product.name, value: lines, inline: false });
      }

      await i.editReply({ embeds: [embed], components: [] });
    });

    collector.on('end', (collected) => {
      if (collected.size === 0) {
        interaction.editReply({ content: 'Timed out.', components: [] });
      }
    });
  },
};
