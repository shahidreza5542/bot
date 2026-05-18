const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pat')
    .setDescription('Pat someone on the head!')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to pat')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: 'You patted yourself! Good job! 🥺', ephemeral: true });
    }

    const embed = await createActionEmbed({
      title: '🥺 Pat!',
      description: `**${interaction.user.username}** patted **${targetUser.username}** on the head!`,
      color: 0xFFB6C1,
      gifType: 'pat',
      footerText: `${interaction.user.username} patted ${targetUser.username}`
    });

    await interaction.reply({ embeds: [embed] });
  }
};
