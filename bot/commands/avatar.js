const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('avatar').setDescription('Show user avatar')
    .addUserOption(option => option.setName('user').setDescription('User to show avatar').setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const embed = new EmbedBuilder()
      .setTitle(`${targetUser.username}'s Avatar`)
      .setImage(targetUser.displayAvatarURL({ size: 4096, dynamic: true }))
      .setColor(0x5865F2)
      .setFooter({ text: 'Toolmetry AI' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
