const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tickle')
    .setDescription('Tickle someone until they laugh!')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to tickle')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: 'You tickled yourself! Hahaha! 🪶', ephemeral: true });
    }

    const embed = await createActionEmbed({
      title: '🪶 Tickle!',
      description: `**${interaction.user.username}** tickled **${targetUser.username}**! Hahaha!`,
      color: 0x98FB98,
      gifType: 'tickle',
      footerText: `${interaction.user.username} tickled ${targetUser.username}`
    });

    await interaction.reply({ embeds: [embed] });
  }
};
