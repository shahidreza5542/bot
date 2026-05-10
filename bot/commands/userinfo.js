const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show user information')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to check')
        .setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle(`${targetUser.username}'s Info`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setColor(member?.displayHexColor || 0x5865F2)
      .addFields(
        { name: 'Username', value: targetUser.tag, inline: true },
        { name: 'ID', value: targetUser.id, inline: true },
        { name: 'Bot', value: targetUser.bot ? 'Yes' : 'No', inline: true },
        { name: 'Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: 'Toolmetry AI' })
      .setTimestamp();

    if (member) {
      embed.addFields(
        { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'Roles', value: `${member.roles.cache.size - 1}`, inline: true }
      );
    }

    await interaction.reply({ embeds: [embed] });
  }
};
