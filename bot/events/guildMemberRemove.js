const Guild = require('../../models/Guild');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    try {
      const guildSettings = await Guild.findOne({ guildId: member.guild.id });
      
      if (!guildSettings?.leave?.enabled) return;

      const channel = member.guild.channels.cache.get(guildSettings.leave.channelId);
      if (!channel) return;

      // Check for custom bot name (premium)
      const botName = guildSettings.premium?.customBotName || member.guild.members.me.displayName;

      let message = guildSettings.leave.message
        .replace('{user}', `<@${member.id}>`)
        .replace('{username}', member.user.username)
        .replace('{server}', member.guild.name)
        .replace('{memberCount}', member.guild.memberCount);

      if (guildSettings.leave.embed) {
        const embed = new EmbedBuilder()
          .setDescription(message)
          .setColor(parseInt(guildSettings.leave.color?.replace('#', '') || 'ff0000', 16))
          .setTimestamp();

        embed.setFooter({
          text: botName,
          iconURL: guildSettings.premium?.customBotAvatar || member.guild.members.me.user.displayAvatarURL()
        });

        await channel.send({ embeds: [embed] });
      } else {
        await channel.send(message);
      }
    } catch (err) {
      console.error('Error in guildMemberRemove:', err);
    }
  }
};
