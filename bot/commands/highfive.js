const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('highfive')
    .setDescription('Give someone a high five!')
    .addUserOption(option =>
      option.setName('user').setDescription('User to high five').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'You high-fived yourself! Nice! ✋', ephemeral: true });
    }
    const embed = await createActionEmbed({
      title: '✋ High Five!',
      description: `<@${interaction.user.id}> gave <@${target.id}> a high five! Yeah!`,
      color: 0xFFD700,
      gifType: 'highfive',
      footerText: `${interaction.user.username} high-fived ${target.username}`
    });
    await interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
  }
};
