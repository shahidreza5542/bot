const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Give someone a warm hug!')
    .addUserOption(option => option.setName('user').setDescription('User to hug').setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    if (targetUser.id === interaction.user.id) return interaction.reply({ content: 'You hugged yourself! Self-love is important!', ephemeral: true });

    const embed = await createActionEmbed({
      title: 'Hug!',
      description: `<@${interaction.user.id}> gave <@${targetUser.id}> a big warm hug!`,
      color: 0xFF69B4,
      gifType: 'hug',
      footerText: `@${interaction.user.username} hugged @${targetUser.username}`
    });

    await interaction.reply({ content: `<@${targetUser.id}>`, embeds: [embed] });
  }
};
