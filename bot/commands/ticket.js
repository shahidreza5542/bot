const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ============================================================
// Persistent Ticket Storage (JSON file based)
// ============================================================
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
        if (!isNaN(num) && num > maxCounter) maxCounter = num;
      }
      console.log(`[Tickets] Loaded ${ticketsMap.size} tickets from storage`);
      return { tickets: ticketsMap, counter: maxCounter };
    }
  } catch (err) {
    console.error('[Tickets] Error loading tickets:', err.message);
  }
  return { tickets: new Map(), counter: 0 };
}

function saveTickets() {
  try {
    const ticketsObj = Object.fromEntries(tickets);
    fs.writeFileSync(TICKETS_FILE, JSON.stringify({ tickets: ticketsObj, lastUpdated: new Date().toISOString() }, null, 2));
  } catch (err) {
    console.error('[Tickets] Error saving tickets:', err.message);
  }
}

const { tickets: loadedTickets, counter: loadedCounter } = loadTickets();
const tickets = loadedTickets;
let ticketCounter = loadedCounter;

// ============================================================
// Ticket Creation Helper (shared between /ticket and panel button)
// ============================================================
async function createTicket(guild, user, subject, interaction) {
  // Check for existing open ticket
  for (const [id, ticket] of tickets) {
    if (ticket.userId === user.id && ticket.guildId === guild.id && ticket.status === 'open') {
      const existingChannel = guild.channels.cache.get(ticket.channelId);
      if (existingChannel) {
        return { success: false, message: `You already have an open ticket: ${existingChannel}` };
      } else {
        // Channel was deleted but ticket still exists - clean it up
        ticket.status = 'closed';
        saveTickets();
      }
    }
  }

  // Get next ticket number
  ticketCounter++;
  const channelName = `ticket-${ticketCounter.toString().padStart(4, '0')}`;

  // Ensure bot member is cached for permission overwrites
  const botMember = guild.members.me || await guild.members.fetchMe().catch(() => null);
  if (!botMember) {
    return { success: false, message: 'Failed to get bot permissions. Please try again.' };
  }

  try {
    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: botMember.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] }
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
      createdAt: new Date().toISOString()
    });

    saveTickets();

    const embed = new EmbedBuilder()
      .setTitle(`🎫 Ticket #${ticketCounter}`)
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

    return { success: true, channel: ticketChannel, ticketId };
  } catch (err) {
    console.error('[Tickets] Error creating channel:', err);
    return { success: false, message: 'Failed to create ticket channel. Check bot permissions and try again.' };
  }
}

// ============================================================
// Slash Command
// ============================================================
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
    const result = await createTicket(interaction.guild, interaction.user, subject, interaction);

    if (result.success) {
      await interaction.reply({
        content: `✅ Ticket created: ${result.channel}`,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true
      });
    }
  }
};

module.exports.tickets = tickets;
module.exports.saveTickets = saveTickets;
module.exports.createTicket = createTicket;
