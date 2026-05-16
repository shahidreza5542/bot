const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Persistent ticket storage
const TICKETS_FILE = path.join(__dirname, '../data/tickets.json');

function loadTickets() {
  try {
    if (fs.existsSync(TICKETS_FILE)) {
      const data = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf8'));
      const ticketsMap = new Map();
      let maxCounter = 0;
      for (const [key, value] of Object.entries(data.tickets || {})) {
        ticketsMap.set(key, value);
        const num = parseInt(key.split('-')[1]);
        if (num > maxCounter) maxCounter = num;
      }
      return { tickets: ticketsMap, counter: maxCounter };
    }
  } catch (err) {
    console.error('Error loading tickets:', err);
  }
  return { tickets: new Map(), counter: 0 };
}

function saveTickets() {
  try {
    const ticketsObj = Object.fromEntries(tickets);
    fs.writeFileSync(TICKETS_FILE, JSON.stringify({ tickets: ticketsObj, lastUpdated: new Date().toISOString() }, null, 2));
  } catch (err) {
    console.error('Error saving tickets:', err);
  }
}

const { tickets: loadedTickets, counter: loadedCounter } = loadTickets();
const tickets = loadedTickets;
let ticketCounter = loadedCounter;

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

    for (const [id, ticket] of tickets) {
      if (ticket.userId === user.id && ticket.guildId === guild.id && ticket.status === 'open') {
        const existingChannel = guild.channels.cache.get(ticket.channelId);
        if (existingChannel) {
          return interaction.reply({
            content: `You already have an open ticket: ${existingChannel}`,
            ephemeral: true
          });
        }
      }
    }

    ticketCounter++;
    const channelName = `ticket-${ticketCounter.toString().padStart(4, '0')}`;

    try {
      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
        ]
      });

      const ticketId = `TICKET-${ticketCounter}`;
      tickets.set(ticketId, {
        ticketId,
        guildId: guild.id,
        channelId: ticketChannel.id,
        userId: user.id,
        username: user.username,
        subject,
        status: 'open',
        claimedBy: null,
        createdAt: new Date()
      });

      saveTickets();

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticketCounter}`)
        .setDescription(
          `**Welcome to Support!**\n\n` +
          `**Subject:** ${subject}\n` +
          `**User:** ${user.tag}\n` +
          `**Created:** <t:${Math.floor(Date.now() / 1000)}:R>`
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
      console.error('Error creating ticket:', err);
      await interaction.reply({
        content: '❌ Failed to create ticket. Please try again.',
        ephemeral: true
      });
    }
  }
};

module.exports.tickets = tickets;
module.exports.saveTickets = saveTickets;
