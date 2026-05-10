const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say something')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Message to say')
        .setRequired(true))
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to send message')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    await targetChannel.send(message);
    await interaction.reply({ 
      content: `✅ Message sent to ${targetChannel}`,
      ephemeral: true 
    });
  }
};
