const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const SELLAUTH_API_KEY = process.env.SELLAUTH_API_KEY;
const SHOP_ID = process.env.SHOP_ID;

async function sellAuthGet(path) {
  const res = await fetch(`https://api.sellauth.com/v1/shops/${SHOP_ID}/${path}`, {
    headers: { Authorization: `Bearer ${SELLAUTH_API_KEY}` },
  });
  return res.json();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('groups')
    .setDescription('Browse products by group.'),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const groupsRes = await sellAuthGet('groups');
    console.log('Groups response:', JSON.stringify(groupsRes));
    const groups = groupsRes?.data ?? groupsRes ?? [];

    if (!groups.length) {
      return interaction.editReply('No groups found.');
    }

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('group_select')
        .setPlaceholder('Select a group')
        .addOptions(
          groups.slice(0, 25).map(g => ({
            label: g.name,
            value: String(g.id),
          }))
        )
    );

    await interaction.editReply({ content: 'Select a group to view its products:', components: [row] });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.customId === 'group_select' && i.user.id === interaction.user.id,
      time: 60_000,
      max: 1,
    });

    collector.on('collect', async i => {
      await i.deferUpdate();
      const groupId = i.values[0];
      const groupRes = await sellAuthGet(`groups/${groupId}`);
      console.log('Group detail response:', JSON.stringify(groupRes));

      const group = groupRes?.data ?? groupRes;
      const products = group?.products ?? [];

      const embed = new EmbedBuilder()
        .setTitle(group.name)
        .setColor(0xFFFFFF)
        .setFooter({ text: 'ZondisStore' })
        .setTimestamp();

      if (group.category?.name) {
        embed.setDescription(`Category: **${group.category.name}**`);
      }

      if (!products.length) {
        embed.addFields({ name: 'Products', value: 'No products in this group.', inline: false });
      } else {
        for (const product of products.slice(0, 10)) {
          const variants = product.variants ?? [];
          const lines = variants.map(v => {
            const stock = v.stock ?? 0;
            const price = v.price ? `£${v.price}` : 'N/A';
            return `${v.name} — ${price} — Stock: ${stock}`;
          }).join('\n') || 'No variants';
          embed.addFields({ name: product.name, value: lines, inline: false });
        }
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
