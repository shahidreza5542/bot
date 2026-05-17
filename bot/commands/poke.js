const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poke')
    .setDescription('Poke someone to get their attention!')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to poke')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    if (targetUser.id === interaction.user.id) {
      return interaction.reply({ content: 'You poked yourself! Hey, wake up! 👉', ephemeral: true });
    }

    const embed = await createActionEmbed({
      title: '👉 Poke!',
      description: `**${interaction.user.username}** poked **@${targetUser.username}**! Hey!`,
      color: 0x00CED1,
      gifType: 'poke',
      footerText: `${interaction.user.username} poked ${targetUser.username}`
    });

    await interaction.reply({ embeds: [embed] });
  }
};
