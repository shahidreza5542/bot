const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Send the ticket creation panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to send panel')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle('🎫 Support Center')
      .setDescription('Click below to create a ticket.')
      .setColor(0x00D4AA)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket:create')
        .setLabel('Create Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫'),

      new ButtonBuilder()
        .setLabel('Dashboard')
        .setStyle(ButtonStyle.Link)
        .setURL('https://toolmetry.vercel.app/tools')
    );

    try {
      await targetChannel.send({ embeds: [embed], components: [row] });

      await interaction.reply({
        content: `✅ Panel sent to ${targetChannel}`,
        ephemeral: true
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: '❌ Failed to send panel',
        ephemeral: true
      });
    }
  }
};