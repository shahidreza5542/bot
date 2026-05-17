const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType } = require('discord.js');
const ticketStorage = require('../utils/ticketStorage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Create a support ticket')
    .addStringOption(option =>
      option
        .setName('subject')
        .setDescription('Subject of your ticket')
        .setRequired(true)),

  async execute(interaction) {
    const subject = interaction.options.getString('subject');
    const guild = interaction.guild;
    const user = interaction.user;

    // Check for existing open ticket
    const existing = ticketStorage.getOpenTicket(guild.id, user.id);
    if (existing) {
      const existingChannel = guild.channels.cache.get(existing.channelId);
      if (existingChannel) {
        return interaction.reply({
          content: `❌ You already have an open ticket: ${existingChannel}`,
          ephemeral: true
        });
      } else {
        // Channel was deleted - clean up stale ticket
        ticketStorage.updateTicket(existing.ticketId, { status: 'closed' });
      }
    }

    // Create ticket in storage first (to get the number)
    const ticket = ticketStorage.createTicket({
      guildId: guild.id,
      userId: user.id,
      username: user.username,
      subject
    });

    const channelName = `ticket-${ticket.ticketNumber.toString().padStart(4, '0')}`;

    try {
      const botMember = guild.members.me;
      const permissionOverwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
      ];

      if (botMember) {
        permissionOverwrites.push({
          id: botMember.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory]
        });
      }

      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites
      });

      // Update storage with channel ID
      ticketStorage.updateTicket(ticket.ticketId, { channelId: ticketChannel.id });

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticket.ticketNumber}`)
        .setDescription(
          `**Welcome to Support!**\n\n` +
          `**Subject:** ${subject}\n` +
          `**User:** <@${user.id}>\n` +
          `**Created:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
          `Describe your issue below. Our team will respond shortly!`
        )
        .setColor(0x00D4AA)
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: 'Toolmetry AI Ticket System' })
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`t_claim_${ticket.ticketId}`)
            .setLabel('Claim')
            .setStyle(ButtonStyle.Success)
            .setEmoji('👋'),
          new ButtonBuilder()
            .setCustomId(`t_close_${ticket.ticketId}`)
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒'),
          new ButtonBuilder()
            .setCustomId(`t_del_${ticket.ticketId}`)
            .setLabel('Delete')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🗑️')
        );

      await ticketChannel.send({ content: `<@${user.id}>`, embeds: [embed], components: [row] });

      await interaction.reply({
        content: `✅ Ticket created: ${ticketChannel}`,
        ephemeral: true
      });
    } catch (err) {
      console.error('[Ticket] Create error:', err.message);
      // Delete the stored ticket since channel creation failed
      ticketStorage.deleteTicket(ticket.ticketId);
      await interaction.reply({
        content: `❌ Failed to create ticket channel. Check bot permissions.\nError: ${err.message}`,
        ephemeral: true
      });
    }
  }
};
