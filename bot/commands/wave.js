const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wave')
    .setDescription('Wave at someone or say hello!')
    .addUserOption(option => option.setName('user').setDescription('User to wave at').setRequired(false)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    const embed = await createActionEmbed({
      title: 'Wave!',
      description: targetUser
        ? `<@${interaction.user.id}> waved at <@${targetUser.id}>! Hello!`
        : `<@${interaction.user.id}> waved hello!`,
      color: 0x00BFFF,
      gifType: 'wave',
      footerText: targetUser ? `@${interaction.user.username} waved at @${targetUser.username}` : `@${interaction.user.username} waved`
    });

    await interaction.reply({ content: targetUser ? `<@${targetUser.id}>` : undefined, embeds: [embed] });
  }
};
