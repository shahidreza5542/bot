const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('highfive')
    .setDescription('Give someone a high five!')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to high five')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: 'You high-fived yourself! Nice! ✋', ephemeral: true });
    }

    const embed = await createActionEmbed({
      title: '✋ High Five!',
      description: `**${interaction.user.username}** gave **${targetUser.username}** a high five! Yeah!`,
      color: 0xFFD700,
      gifType: 'highfive',
      footerText: `${interaction.user.username} high-fived ${targetUser.username}`
    });

    await interaction.reply({ embeds: [embed] });
  }
};
