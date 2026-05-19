const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dance')
    .setDescription('Dance with someone or show off your moves!')
    .addUserOption(option => option.setName('user').setDescription('User to dance with').setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    const embed = await createActionEmbed({
      title: 'Dance!',
      description: targetUser
        ? `<@${interaction.user.id}> is dancing with <@${targetUser.id}>! Groovy!`
        : `<@${interaction.user.id}> is showing off their dance moves!`,
      color: 0xFF69B4,
      gifType: 'dance',
      footerText: targetUser ? `@${interaction.user.username} danced with @${targetUser.username}` : `@${interaction.user.username} danced`
    });

    await interaction.reply({ content: targetUser ? `<@${targetUser.id}>` : undefined, embeds: [embed] });
  }
};
