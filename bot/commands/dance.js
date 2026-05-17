const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dance')
    .setDescription('Dance with someone or show off your moves!')
    .addUserOption(option =>
      option.setName('user').setDescription('User to dance with').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const embed = await createActionEmbed({
      title: '💃 Dance!',
      description: target
        ? `<@${interaction.user.id}> is dancing with <@${target.id}>! Groovy!`
        : `<@${interaction.user.id}> is showing off their dance moves!`,
      color: 0xFF69B4,
      gifType: 'dance',
      footerText: target
        ? `${interaction.user.username} danced with ${target.username}`
        : `${interaction.user.username} danced`
    });
    await interaction.reply({ content: target ? `<@${target.id}>` : undefined, embeds: [embed] });
  }
};
