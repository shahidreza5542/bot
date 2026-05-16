const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('smile')
    .setDescription('Share a smile with someone!')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to smile at')
        .setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    const embed = await createActionEmbed({
      title: '😄 Smile!',
      description: targetUser
        ? `**${interaction.user.username}** smiled at **${targetUser.username}**! How sweet!`
        : `**${interaction.user.username}** is smiling! What a happy day!`,
      color: 0xFFFF00,
      gifType: 'smile',
      footerText: targetUser
        ? `${interaction.user.username} smiled at ${targetUser.username}`
        : `${interaction.user.username} smiled`
    });

    await interaction.reply({ embeds: [embed] });
  }
};
