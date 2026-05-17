const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blush')
    .setDescription('Show someone you\'re blushing!')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User who made you blush')
        .setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    const embed = await createActionEmbed({
      title: '😊 Blush!',
      description: targetUser
        ? `**${targetUser.username}** made **@${interaction.user.username}** blush!`
        : `**${interaction.user.username}** is blushing!`,
      color: 0xFF9999,
      gifType: 'blush',
      footerText: targetUser
        ? `${targetUser.username} made ${interaction.user.username} blush`
        : `${interaction.user.username} blushed`
    });

    await interaction.reply({ embeds: [embed] });
  }
};
