const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wave')
    .setDescription('Wave at someone or say hello!')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to wave at')
        .setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    const embed = await createActionEmbed({
      title: '👋 Wave!',
      description: targetUser
        ? `**${interaction.user.username}** waved at **${targetUser.username}**! Hello!`
        : `**${interaction.user.username}** waved hello! 👋`,
      color: 0x00BFFF,
      gifType: 'wave',
      footerText: targetUser
        ? `${interaction.user.username} waved at ${targetUser.username}`
        : `${interaction.user.username} waved`
    });

    await interaction.reply({ embeds: [embed] });
  }
};
