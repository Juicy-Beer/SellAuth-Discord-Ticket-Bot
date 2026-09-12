const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const store = require('../utils/store');
const { generateTranscript } = require('../utils/transcript');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transcript')
    .setDescription('Generate an HTML transcript of this ticket right now (without closing it).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const ticket = store.getTicketByChannel(interaction.channel.id);
    if (!ticket) {
      return interaction.reply({ content: '⚠️ This command can only be used inside a ticket channel.', ephemeral: true });
    }

    await interaction.deferReply();

    const ticketNumber = store.getTicketNumberByChannel(interaction.channel.id);
    const { filePath, messageCount } = await generateTranscript(interaction.channel, {
      ticketNumber,
    });

    const attachment = new AttachmentBuilder(filePath, { name: `ticket-${ticketNumber}-transcript.html` });

    await interaction.editReply({
      content: `📄 Transcript generated (${messageCount} messages so far). This does **not** close the ticket.`,
      files: [attachment],
    });
  },
};
