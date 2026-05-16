const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Send the ticket creation panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to send the ticket panel')
        .setRequired(false)),

  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle('🎫 Support Center')
      .setDescription(
        '**Need help? We\'re here for you!**\n\n' +
        'Click the button below to create a support ticket.\n\n' +
        '⚡ **Fast response times**\n' +
        '🛡️ **Professional support**\n' +
        '🤖 **AI-powered assistance**'
      )
      .setColor(0x00D4AA)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({
        text: 'Toolmetry AI Support System',
        iconURL: interaction.client.user.displayAvatarURL()
      })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_create')
          .setLabel('Create Ticket')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎫'),
        new ButtonBuilder()
          .setURL(process.env.SUPPORT_SERVER_URL || 'https://discord.gg/yourserver')
          .setLabel('Join Support Server')
          .setStyle(ButtonStyle.Link)
          .setEmoji('🔗')
      );

    await targetChannel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: `✅ Ticket panel sent to ${targetChannel}`,
      ephemeral: true
    });
  }
};
