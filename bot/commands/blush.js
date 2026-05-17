const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blush')
    .setDescription('Show someone you\'re blushing!')
    .addUserOption(option =>
      option.setName('user').setDescription('User who made you blush').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const embed = await createActionEmbed({
      title: '😊 Blush!',
      description: target
        ? `<@${target.id}> made <@${interaction.user.id}> blush!`
        : `<@${interaction.user.id}> is blushing!`,
      color: 0xFF9999,
      gifType: 'blush',
      footerText: target
        ? `${target.username} made ${interaction.user.username} blush`
        : `${interaction.user.username} blushed`
    });
    await interaction.reply({ content: target ? `<@${target.id}>` : undefined, embeds: [embed] });
  }
};
