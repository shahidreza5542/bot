const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Give someone a warm hug!')
    .addUserOption(option =>
      option.setName('user').setDescription('User to hug').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'You hugged yourself! Aww, self-love is important! 🤗', ephemeral: true });
    }
    const embed = await createActionEmbed({
      title: '🤗 Hug!',
      description: `<@${interaction.user.id}> gave <@${target.id}> a big warm hug!`,
      color: 0xFF69B4,
      gifType: 'hug',
      footerText: `${interaction.user.username} hugged ${target.username}`
    });
    await interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
  }
};
