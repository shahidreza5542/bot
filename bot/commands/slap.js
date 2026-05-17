const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slap')
    .setDescription('Slap someone (all in good fun!)')
    .addUserOption(option =>
      option.setName('user').setDescription('User to slap').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'You slapped yourself! That must have hurt! 👋', ephemeral: true });
    }
    const embed = await createActionEmbed({
      title: '👋 Slap!',
      description: `<@${interaction.user.id}> slapped <@${target.id}>! Ouch!`,
      color: 0xFF4500,
      gifType: 'slap',
      footerText: `${interaction.user.username} slapped ${target.username}`
    });
    await interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
  }
};
