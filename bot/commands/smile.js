const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('smile')
    .setDescription('Share a smile with someone!')
    .addUserOption(option => option.setName('user').setDescription('User to smile at').setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    const embed = await createActionEmbed({
      title: 'Smile!',
      description: targetUser
        ? `<@${interaction.user.id}> smiled at <@${targetUser.id}>! How sweet!`
        : `<@${interaction.user.id}> is smiling! What a happy day!`,
      color: 0xFFFF00,
      gifType: 'smile',
      footerText: targetUser ? `@${interaction.user.username} smiled at @${targetUser.username}` : `@${interaction.user.username} smiled`
    });

    await interaction.reply({ content: targetUser ? `<@${targetUser.id}>` : undefined, embeds: [embed] });
  }
};
