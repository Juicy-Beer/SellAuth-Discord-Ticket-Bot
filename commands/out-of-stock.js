const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getProducts, SHOP_ID } = require('../utils/sellauth');

function chunkLines(lines, maxLen = 1000) {
  const chunks = [];
  let current = '';
  for (const line of lines) {
    if ((current + '\n' + line).length > maxLen) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? current + '\n' + line : line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function getStock(product) {
  if (typeof product.stock === 'number') return product.stock;
  if (Array.isArray(product.variants)) {
    return product.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  }
  return null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('out-of-stock')
    .setDescription('List all SellAuth products currently at 0 stock.'),

  async execute(interaction) {
    await interaction.deferReply();

    let products;
    try {
      const response = await getProducts();
      products = Array.isArray(response) ? response : response.products ?? response.data ?? [];
    } catch (err) {
      console.error('SellAuth products error:', err);
      return interaction.editReply(`⚠️ Couldn't fetch products from SellAuth: ${err.message}`);
    }

    const outOfStock = products.filter(p => getStock(p) === 0);

    const embed = new EmbedBuilder()
      .setTitle('📦 Out of Stock')
      .setColor(0xed4245)
      .setFooter({ text: `Shop #${SHOP_ID} · SellAuth` })
      .setTimestamp();

    if (outOfStock.length === 0) {
      embed.setDescription('✅ Nothing is out of stock right now.');
      return interaction.editReply({ embeds: [embed] });
    }

    embed.setDescription(`**${outOfStock.length}** product${outOfStock.length === 1 ? ' is' : 's are'} currently out of stock:`);

    const lines = outOfStock.map(p => `• **${p.name ?? p.title ?? `Product #${p.id}`}**`);
    const chunks = chunkLines(lines);

    chunks.forEach((chunk, i) => {
      embed.addFields({ name: i === 0 ? 'Products' : '\u200b', value: chunk });
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
