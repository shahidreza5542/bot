const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('smile')
    .setDescription('Share a smile with someone!')
    .addUserOption(option =>
      option.setName('user').setDescription('User to smile at').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const embed = await createActionEmbed({
      title: '😄 Smile!',
      description: target
        ? `<@${interaction.user.id}> smiled at <@${target.id}>! How sweet!`
        : `<@${interaction.user.id}> is smiling! What a happy day!`,
      color: 0xFFFF00,
      gifType: 'smile',
      footerText: target
        ? `${interaction.user.username} smiled at ${target.username}`
        : `${interaction.user.username} smiled`
    });
    await interaction.reply({ content: target ? `<@${target.id}>` : undefined, embeds: [embed] });
  }
};
