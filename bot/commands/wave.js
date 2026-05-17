const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wave')
    .setDescription('Wave at someone or say hello!')
    .addUserOption(option =>
      option.setName('user').setDescription('User to wave at').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const embed = await createActionEmbed({
      title: '👋 Wave!',
      description: target
        ? `<@${interaction.user.id}> waved at <@${target.id}>! Hello!`
        : `<@${interaction.user.id}> waved hello! 👋`,
      color: 0x00BFFF,
      gifType: 'wave',
      footerText: target
        ? `${interaction.user.username} waved at ${target.username}`
        : `${interaction.user.username} waved`
    });
    await interaction.reply({ content: target ? `<@${target.id}>` : undefined, embeds: [embed] });
  }
};
