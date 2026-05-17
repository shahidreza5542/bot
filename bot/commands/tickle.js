const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tickle')
    .setDescription('Tickle someone until they laugh!')
    .addUserOption(option =>
      option.setName('user').setDescription('User to tickle').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'You tickled yourself! Hahaha! 🪶', ephemeral: true });
    }
    const embed = await createActionEmbed({
      title: '🪶 Tickle!',
      description: `<@${interaction.user.id}> tickled <@${target.id}>! Hahaha!`,
      color: 0x98FB98,
      gifType: 'tickle',
      footerText: `${interaction.user.username} tickled ${target.username}`
    });
    await interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
  }
};
