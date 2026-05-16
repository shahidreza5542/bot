const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cuddle')
    .setDescription('Cuddle with someone cozily!')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to cuddle')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: 'You cuddled yourself! Stay warm! 🧸', ephemeral: true });
    }

    const embed = await createActionEmbed({
      title: '🧸 Cuddle!',
      description: `**${interaction.user.username}** cuddled **${targetUser.username}**! So cozy!`,
      color: 0xFFB347,
      gifType: 'cuddle',
      footerText: `${interaction.user.username} cuddled ${targetUser.username}`
    });

    await interaction.reply({ embeds: [embed] });
  }
};
