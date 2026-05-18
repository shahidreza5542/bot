const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType } = require('discord.js');
const { tickets, saveTickets, getNextTicketNumber } = require('../utils/ticketStorage');

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
    for (const [id, ticket] of tickets) {
      if (ticket.userId === user.id && ticket.guildId === guild.id && ticket.status === 'open') {
        const existingChannel = guild.channels.cache.get(ticket.channelId);
        if (existingChannel) {
          return interaction.reply({
            content: `❌ You already have an open ticket: ${existingChannel}`,
            ephemeral: true
          });
        } else {
          // Channel was deleted but ticket still exists - clean it up
          ticket.status = 'closed';
          saveTickets();
        }
      }
    }

    const ticketNumber = getNextTicketNumber();
    const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}`;

    try {
      // Get bot member for permissions
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

      const ticketId = `TICKET-${ticketNumber}`;
      tickets.set(ticketId, {
        ticketId,
        guildId: guild.id,
        channelId: ticketChannel.id,
        userId: user.id,
        username: user.username,
        subject,
        status: 'open',
        claimedBy: null,
        createdAt: new Date().toISOString()
      });

      saveTickets();

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticketNumber}`)
        .setDescription(
          `**Welcome to Support!**\n\n` +
          `**Subject:** ${subject}\n` +
          `**User:** ${user.tag}\n` +
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
            .setCustomId(`ticket_claim_${ticketId}`)
            .setLabel('Claim')
            .setStyle(ButtonStyle.Success)
            .setEmoji('👋'),
          new ButtonBuilder()
            .setCustomId(`ticket_close_${ticketId}`)
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒'),
          new ButtonBuilder()
            .setCustomId(`ticket_delete_${ticketId}`)
            .setLabel('Delete')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🗑️')
        );

      await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [row] });

      await interaction.reply({
        content: `✅ Ticket created: ${ticketChannel}`,
        ephemeral: true
      });
    } catch (err) {
      console.error('[Ticket] Create error:', err.message);
      await interaction.reply({
        content: `❌ Failed to create ticket: ${err.message || 'Check bot permissions and try again.'}`,
        ephemeral: true
      });
    }
  }
};

// Export for use in interactionCreate.js
module.exports.tickets = tickets;
module.exports.saveTickets = saveTickets;
