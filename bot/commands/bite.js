const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bite')
    .setDescription('Bite someone! Nom nom!')
    .addUserOption(option => option.setName('user').setDescription('User to bite').setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    if (targetUser.id === interaction.user.id) return interaction.reply({ content: 'You bit yourself! That hurts!', ephemeral: true });

    const embed = await createActionEmbed({
      title: 'Bite!',
      description: `<@${interaction.user.id}> bit <@${targetUser.id}>! Nom nom!`,
      color: 0xDC143C,
      gifType: 'bite',
      footerText: `@${interaction.user.username} bit @${targetUser.username}`
    });

    await interaction.reply({ content: `<@${targetUser.id}>`, embeds: [embed] });
  }
};
