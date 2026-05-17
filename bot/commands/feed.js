const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('feed')
    .setDescription('Feed someone some tasty food!')
    .addUserOption(option =>
      option.setName('user').setDescription('User to feed').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'You fed yourself! Yummy! 🍕', ephemeral: true });
    }
    const embed = await createActionEmbed({
      title: '🍕 Feed!',
      description: `<@${interaction.user.id}> fed <@${target.id}> something delicious!`,
      color: 0xFFA500,
      gifType: 'feed',
      footerText: `${interaction.user.username} fed ${target.username}`
    });
    await interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
  }
};
