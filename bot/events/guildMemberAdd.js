const { EmbedBuilder } = require('discord.js');
const { welcomeSettings } = require('../commands/welcome');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const settings = welcomeSettings.get(member.guild.id);

    if (!settings || !settings.enabled) return;

    const channel = member.guild.channels.cache.get(settings.channelId);
    if (!channel) return;

    const welcomeMsg = settings.message
      .replace('{user}', `<@${member.user.id}>`)
      .replace('{server}', member.guild.name);

    if (settings.useEmbed) {
      const embed = new EmbedBuilder()
        .setTitle('Welcome!')
        .setDescription(welcomeMsg)
        .setColor(parseInt(settings.color.replace('#', ''), 16) || 0x00ff00)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      if (settings.image) embed.setImage(settings.image);
      await channel.send({ embeds: [embed] });
    } else {
      await channel.send(welcomeMsg);
    }
  }
};
