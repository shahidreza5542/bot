const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Show server information'),

  async execute(interaction) {
    const { guild } = interaction;
    const owner = await guild.fetchOwner();

    const embed = new EmbedBuilder()
      .setTitle(`${guild.name} Server Info`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setColor(0x5865F2)
      .addFields(
        { name: 'Owner', value: `${owner.user.tag}`, inline: true },
        { name: 'Members', value: `${guild.memberCount}`, inline: true },
        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
        { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Boost Level', value: `Level ${guild.premiumTier}`, inline: true }
      )
      .setFooter({ text: `ID: ${guild.id} • Toolmetry AI` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
