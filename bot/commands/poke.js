const { SlashCommandBuilder } = require('discord.js');
const { createActionEmbed } = require('../utils/gifApi');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poke')
    .setDescription('Poke someone to get their attention!')
    .addUserOption(option =>
      option.setName('user').setDescription('User to poke').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: 'You poked yourself! Hey, wake up! 👉', ephemeral: true });
    }
    const embed = await createActionEmbed({
      title: '👉 Poke!',
      description: `<@${interaction.user.id}> poked <@${target.id}>! Hey!`,
      color: 0x00CED1,
      gifType: 'poke',
      footerText: `${interaction.user.username} poked ${target.username}`
    });
    await interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
  }
};
