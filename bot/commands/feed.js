const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('feed')
    .setDescription('Feed someone some tasty food!')
    .addUserOption(option => option.setName('user').setDescription('User to feed').setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    if (targetUser.id === interaction.user.id) return interaction.reply({ content: 'You fed yourself! Yummy!', ephemeral: true });

    const embed = await createActionEmbed({
      title: 'Feed!',
      description: `<@${interaction.user.id}> fed <@${targetUser.id}> something delicious!`,
      color: 0xFFA500,
      gifType: 'feed',
      footerText: `@${interaction.user.username} fed @${targetUser.username}`
    });

    await interaction.reply({ content: `<@${targetUser.id}>`, embeds: [embed] });
  }
};
