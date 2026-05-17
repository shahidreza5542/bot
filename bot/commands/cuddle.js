const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cuddle')
    .setDescription('Cuddle with someone cozily!')
    .addUserOption(option =>
      option.setName('user').setDescription('User to cuddle').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'You cuddled yourself! Stay warm! 🧸', ephemeral: true });
    }
    const embed = await createActionEmbed({
      title: '🧸 Cuddle!',
      description: `<@${interaction.user.id}> cuddled <@${target.id}>! So cozy!`,
      color: 0xFFB347,
      gifType: 'cuddle',
      footerText: `${interaction.user.username} cuddled ${target.username}`
    });
    await interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
  }
};
