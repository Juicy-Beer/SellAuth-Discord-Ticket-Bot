const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const activeGiveaways = new Map();

function parseDuration(input) {
  const match = /^(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days)$/i.exec(input.trim());
  if (!match) return null;
  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  let multiplier;
  if (unit.startsWith('s')) multiplier = 1000;
  else if (unit.startsWith('m')) multiplier = 60000;
  else if (unit.startsWith('h')) multiplier = 3600000;
  else multiplier = 86400000;
  return amount * multiplier;
}

function pickWinners(entries, count) {
  const pool = [...entries];
  const winners = [];
  while (winners.length < count && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(index, 1)[0]);
  }
  return winners;
}

function buildGiveawayEmbed(giveaway) {
  const lines = [];
  if (giveaway.description) {
    lines.push(giveaway.description, '');
  }
  if (giveaway.requirements) {
    lines.push(`Requirements: ${giveaway.requirements}`);
  }
  lines.push(`Ends: <t:${Math.floor(giveaway.endTime / 1000)}:R> (<t:${Math.floor(giveaway.endTime / 1000)}:f>)`);
  lines.push(`Hosted by: <@${giveaway.hostId}>`);
  lines.push(`Entries: ${giveaway.entries.size}`);
  lines.push(`Winners: ${giveaway.winnerCount}`);

  return new EmbedBuilder()
    .setTitle(giveaway.prize)
    .setDescription(lines.join('\n'))
    .setTimestamp();
}

function buildEnterRow(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway-enter')
      .setEmoji('🎉')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled)
  );
}

async function endGiveaway(giveaway, channel) {
  giveaway.ended = true;
  if (giveaway.collector && !giveaway.collector.ended) {
    giveaway.collector.stop('ended');
  }

  const winners = pickWinners(giveaway.entries, giveaway.winnerCount);
  giveaway.lastWinners = winners;

  const resultEmbed = new EmbedBuilder()
    .setTitle(`${giveaway.prize} — Ended`)
    .setDescription(
      winners.length > 0
        ? `Winner${winners.length > 1 ? 's' : ''}: ${winners.map(id => `<@${id}>`).join(', ')}`
        : 'No valid entries — no winner could be picked.'
    )
    .setTimestamp();

  try {
    const message = await channel.messages.fetch(giveaway.messageId);
    await message.edit({ embeds: [resultEmbed], components: [buildEnterRow(true)] });
    if (winners.length > 0) {
      await channel.send(
        `🎉 Congratulations ${winners.map(id => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**!`
      );
    }
  } catch (err) {
    console.error('Giveaway end message update error:', err);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub => sub.setName('create').setDescription('Open the giveaway creation form.'))
    .addSubcommand(sub =>
      sub
        .setName('end')
        .setDescription('End a giveaway early.')
        .addStringOption(option => option.setName('message_id').setDescription('The giveaway message ID').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('reroll')
        .setDescription('Reroll winners for an ended giveaway.')
        .addStringOption(option => option.setName('message_id').setDescription('The giveaway message ID').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list').setDescription('List all active giveaways in this server.')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      const modal = new ModalBuilder().setCustomId('giveaway-create-modal').setTitle('Create a Giveaway');

      const durationInput = new TextInputBuilder()
        .setCustomId('giveaway-duration')
        .setLabel('Duration')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 10 minutes')
        .setRequired(true);

      const winnersInput = new TextInputBuilder()
        .setCustomId('giveaway-winners')
        .setLabel('Number of Winners')
        .setStyle(TextInputStyle.Short)
        .setValue('1')
        .setRequired(true);

      const prizeInput = new TextInputBuilder()
        .setCustomId('giveaway-prize')
        .setLabel('Prize')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const descriptionInput = new TextInputBuilder()
        .setCustomId('giveaway-description')
        .setLabel('Description')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      const requirementsInput = new TextInputBuilder()
        .setCustomId('giveaway-requirements')
        .setLabel('Requirements (optional)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: Must be Boosting')
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(durationInput),
        new ActionRowBuilder().addComponents(winnersInput),
        new ActionRowBuilder().addComponents(prizeInput),
        new ActionRowBuilder().addComponents(descriptionInput),
        new ActionRowBuilder().addComponents(requirementsInput)
      );

      await interaction.showModal(modal);

      let submitted;
      try {
        submitted = await interaction.awaitModalSubmit({
          filter: i => i.customId === 'giveaway-create-modal' && i.user.id === interaction.user.id,
          time: 300000
        });
      } catch {
        return;
      }

      const durationRaw = submitted.fields.getTextInputValue('giveaway-duration');
      const winnersRaw = submitted.fields.getTextInputValue('giveaway-winners');
      const prize = submitted.fields.getTextInputValue('giveaway-prize');
      const description = submitted.fields.getTextInputValue('giveaway-description') || null;
      const requirements = submitted.fields.getTextInputValue('giveaway-requirements') || null;

      const durationMs = parseDuration(durationRaw);
      if (!durationMs) {
        return submitted.reply({
          content: 'Invalid duration format. Try something like `10 minutes`, `1 hour`, or `2 days`.',
          ephemeral: true
        });
      }

      const winnerCount = parseInt(winnersRaw, 10);
      if (!Number.isInteger(winnerCount) || winnerCount < 1 || winnerCount > 100) {
        return submitted.reply({
          content: 'Number of winners must be a whole number between 1 and 100.',
          ephemeral: true
        });
      }

      const endTime = Date.now() + durationMs;

      const giveaway = {
        prize,
        description,
        requirements,
        winnerCount,
        hostId: interaction.user.id,
        endTime,
        entries: new Set(),
        ended: false,
        guildId: interaction.guildId,
        channelId: interaction.channelId
      };

      const embed = buildGiveawayEmbed(giveaway);
      const message = await submitted.reply({ embeds: [embed], components: [buildEnterRow()], fetchReply: true });
      giveaway.messageId = message.id;
      activeGiveaways.set(message.id, giveaway);

      const collector = message.createMessageComponentCollector({ time: durationMs });
      giveaway.collector = collector;

      collector.on('collect', async i => {
        if (i.customId !== 'giveaway-enter') return;
        if (giveaway.entries.has(i.user.id)) {
          return i.reply({ content: 'You have already entered this giveaway.', ephemeral: true });
        }
        giveaway.entries.add(i.user.id);
        await i.reply({ content: `You entered the giveaway for **${prize}**! Good luck!`, ephemeral: true });
        await message.edit({ embeds: [buildGiveawayEmbed(giveaway)], components: [buildEnterRow()] }).catch(() => {});
      });

      collector.on('end', (_collected, reason) => {
        if (reason !== 'ended') {
          endGiveaway(giveaway, interaction.channel);
        }
      });

      return;
    }

    if (subcommand === 'end') {
      const messageId = interaction.options.getString('message_id');
      const giveaway = activeGiveaways.get(messageId);

      if (!giveaway) {
        return interaction.reply({ content: 'No active giveaway found with that message ID.', ephemeral: true });
      }
      if (giveaway.ended) {
        return interaction.reply({ content: 'That giveaway has already ended.', ephemeral: true });
      }

      await interaction.reply({ content: 'Ending the giveaway now...', ephemeral: true });
      await endGiveaway(giveaway, interaction.channel);
      return;
    }

    if (subcommand === 'reroll') {
      const messageId = interaction.options.getString('message_id');
      const giveaway = activeGiveaways.get(messageId);

      if (!giveaway) {
        return interaction.reply({ content: 'No giveaway found with that message ID.', ephemeral: true });
      }
      if (!giveaway.ended) {
        return interaction.reply({ content: 'That giveaway has not ended yet.', ephemeral: true });
      }
      if (giveaway.entries.size === 0) {
        return interaction.reply({ content: 'There are no entries to reroll from.', ephemeral: true });
      }

      const newWinners = pickWinners(giveaway.entries, giveaway.winnerCount);
      giveaway.lastWinners = newWinners;

      await interaction.reply(
        `🔄 New winner${newWinners.length > 1 ? 's' : ''}: ${newWinners.map(id => `<@${id}>`).join(', ')} — congratulations on **${giveaway.prize}**!`
      );
      return;
    }

    if (subcommand === 'list') {
      const guildGiveaways = [...activeGiveaways.values()].filter(
        g => g.guildId === interaction.guildId && !g.ended
      );

      if (guildGiveaways.length === 0) {
        return interaction.reply({ content: 'There are no active giveaways in this server.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('🎉 Active Giveaways')
        .setDescription(
          guildGiveaways
            .map(g => `**${g.prize}** — ${g.entries.size} entries — ends <t:${Math.floor(g.endTime / 1000)}:R> — [Jump](https://discord.com/channels/${g.guildId}/${g.channelId}/${g.messageId})`)
            .join('\n')
        );

      return interaction.reply({ embeds: [embed] });
    }
  }
};
