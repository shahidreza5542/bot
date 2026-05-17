const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kiss')
    .setDescription('Give someone a sweet kiss! 💋')
    .addUserOption(option =>
      option.setName('user').setDescription('User to kiss').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'You kissed yourself! Self-love wins! 💋', ephemeral: true });
    }
    const embed = await createActionEmbed({
      title: '💋 Kiss!',
      description: `<@${interaction.user.id}> gave <@${target.id}> a sweet kiss! 💕`,
      color: 0xFF1493,
      gifType: 'kiss',
      footerText: `${interaction.user.username} kissed ${target.username}`
    });
    await interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
  }
};
