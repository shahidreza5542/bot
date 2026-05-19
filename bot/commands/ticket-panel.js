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
    try {
      const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

      if (!targetChannel) {
        return await interaction.reply({ content: 'Could not find a valid channel.', ephemeral: true });
      }

      const avatarURL = interaction.client.user.displayAvatarURL({ size: 256 });
      const supportEmail = process.env.SUPPORT_EMAIL || 'toolmetryai@gmail.com';

      const embed = new EmbedBuilder()
        .setTitle('Support Center')
        .setDescription(
          '**Need help? We are here for you!**\n\n' +
          'Click the button below to create a support ticket.\n\n' +
          '**Fast response times**\n' +
          '**Professional support**\n' +
          '**AI-powered assistance**\n\n' +
          `Email: ${supportEmail}`
        )
        .setColor(0x00D4AA)
        .setThumbnail(avatarURL)
        .setFooter({ text: 'Toolmetry AI Support System', iconURL: avatarURL })
        .setTimestamp();

      const createButton = new ButtonBuilder()
        .setCustomId('ticket_create')
        .setLabel('Create Ticket')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(createButton);

      await targetChannel.send({ embeds: [embed], components: [row] });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: `Ticket panel sent to ${targetChannel}`, ephemeral: true });
      } else {
        await interaction.reply({ content: `Ticket panel sent to ${targetChannel}`, ephemeral: true });
      }
    } catch (err) {
      console.error('ticket-panel error:', err);
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: `Failed to send panel: ${err.message}`, ephemeral: true });
        } else {
          await interaction.reply({ content: `Failed to send panel: ${err.message}`, ephemeral: true });
        }
      } catch (replyErr) {
        console.error('ticket-panel reply error:', replyErr.message);
      }
    }
  }
};
