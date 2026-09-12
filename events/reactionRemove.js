const { Events } = require('discord.js');

module.exports = {
  name: Events.MessageReactionRemove,
  data: { name: Events.MessageReactionRemove }, 
  async execute(reaction, user) {
    if (user.bot) return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (err) {
        console.error('Error fetching reaction:', err);
        return;
      }
    }

    if (!reaction.message.embeds.length) return;

    try {
      const member = await reaction.message.guild.members.fetch(user.id);

      const embed = reaction.message.embeds[0];
      const description = embed.description || '';
      
      const roleMatch = description.match(/<@&(\d+)>/);
      if (!roleMatch) return;

      const roleId = roleMatch[1];
      const role = reaction.message.guild.roles.cache.get(roleId);

      if (!role) {
        console.error('Role not found:', roleId);
        return;
      }

      await member.roles.remove(role);
      console.log(`❌ Removed ${role.name} from ${user.tag}`);
    } catch (err) {
      console.error('Error removing role:', err);
    }
  },
};
