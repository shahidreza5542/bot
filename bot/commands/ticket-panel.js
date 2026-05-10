const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Send the ticket creation panel (Toolmetry AI)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel to send the ticket panel')
        .setRequired(false)),

  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    const embed = new EmbedBuilder()
      .setTitle('🎫 Toolmetry AI Support')
      .setDescription(
        '**Welcome to Toolmetry AI Support System!**\n\n' +
        'Need help? Click the button below to create a ticket.\n\n' +
        '🤖 **Our AI-powered support team is ready to assist you**\n' +
        '⚡ **Fast response times guaranteed**\n' +
        '🛡️ **Professional and friendly support**'
      )
      .setColor(0x00D4AA)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({ 
        text: 'Powered by Toolmetry AI • Created with love for our community',
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
          .setURL('https://discord.com/oauth2/authorize?client_id=1502937744601649232&permissions=8&integration_type=0&scope=bot')
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
