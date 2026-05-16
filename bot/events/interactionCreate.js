const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { tickets, saveTickets, createTicket } = require('../commands/ticket');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // Handle button interactions first
    if (interaction.isButton()) {
      return handleButton(interaction);
    }

    // Handle slash commands
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);

      const errorMsg = { content: '❌ There was an error while executing this command!', ephemeral: true };

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMsg);
        } else {
          await interaction.reply(errorMsg);
        }
      } catch (followUpErr) {
        console.error('Failed to send error message:', followUpErr.message);
      }
    }
  }
};

// ============================================================
// Button Handler - Full Rewrite with Proper Error Handling
// ============================================================
async function handleButton(interaction) {
  const customId = interaction.customId;

  // ---- CREATE TICKET (from panel button) ----
  if (customId === 'ticket_create') {
    await handleTicketCreate(interaction);
    return;
  }

  // ---- TICKET ACTION BUTTONS (claim/close/delete) ----
  if (customId.startsWith('ticket_claim_') || customId.startsWith('ticket_close_') || customId.startsWith('ticket_delete_')) {
    await handleTicketAction(interaction);
    return;
  }

  // Unknown button - just acknowledge
  try {
    await interaction.reply({ content: 'Unknown button action.', ephemeral: true });
  } catch (err) {
    // Button interaction expired - ignore
  }
}

// ============================================================
// Handle: Create Ticket from Panel Button
// ============================================================
async function handleTicketCreate(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;

  try {
    // Defer immediately - must respond within 3 seconds
    await interaction.deferReply({ ephemeral: true });
  } catch (deferErr) {
    console.error('[Tickets] Failed to defer reply:', deferErr.message);
    return;
  }

  try {
    const result = await createTicket(guild, user, 'Support Ticket', interaction);

    if (result.success) {
      await interaction.editReply({
        content: `✅ Ticket created: ${result.channel}`
      });
    } else {
      await interaction.editReply({
        content: `❌ ${result.message}`
      });
    }
  } catch (err) {
    console.error('[Tickets] Error in handleTicketCreate:', err);

    // We already deferred, so use editReply
    try {
      await interaction.editReply({
        content: '❌ Failed to create ticket. Please try again or contact staff.'
      });
    } catch (editErr) {
      console.error('[Tickets] Failed to send error response:', editErr.message);
    }
  }
}

// ============================================================
// Handle: Ticket Action Buttons (Claim / Close / Delete)
// ============================================================
async function handleTicketAction(interaction) {
  const customId = interaction.customId;
  const guild = interaction.guild;
  const user = interaction.user;
  const channel = interaction.channel;
  const member = interaction.member; // In guild button interactions, member is always available

  // Parse action and ticketId from customId
  // Format: ticket_claim_TICKET-5, ticket_close_TICKET-5, ticket_delete_TICKET-5
  let action, ticketId;

  if (customId.startsWith('ticket_claim_')) {
    action = 'claim';
    ticketId = customId.replace('ticket_claim_', '');
  } else if (customId.startsWith('ticket_close_')) {
    action = 'close';
    ticketId = customId.replace('ticket_close_', '');
  } else if (customId.startsWith('ticket_delete_')) {
    action = 'delete';
    ticketId = customId.replace('ticket_delete_', '');
  } else {
    try {
      await interaction.reply({ content: '❌ Unknown ticket action.', ephemeral: true });
    } catch (e) { /* expired */ }
    return;
  }

  // Look up ticket - if not found in memory, try reloading from disk
  let ticket = tickets.get(ticketId);

  if (!ticket) {
    // Ticket might exist on disk but not in memory (after bot restart)
    // Reload tickets from file
    const { loadTickets } = require('../commands/ticket');
    console.log(`[Tickets] Ticket ${ticketId} not in memory, it may have been from a previous session`);
    try {
      await interaction.reply({
        content: '❌ This ticket no longer exists or the bot was restarted. Please create a new ticket.',
        ephemeral: true
      });
    } catch (e) { /* expired */ }
    return;
  }

  // Verify the ticket channel matches
  if (ticket.channelId !== channel.id) {
    try {
      await interaction.reply({
        content: '❌ This button does not belong to this ticket channel.',
        ephemeral: true
      });
    } catch (e) { /* expired */ }
    return;
  }

  // ---- CLAIM ----
  if (action === 'claim') {
    await handleClaim(interaction, ticket, ticketId, member, channel, guild);
    return;
  }

  // ---- CLOSE ----
  if (action === 'close') {
    await handleClose(interaction, ticket, ticketId, member, channel, guild, user);
    return;
  }

  // ---- DELETE ----
  if (action === 'delete') {
    await handleDelete(interaction, ticket, ticketId, member, channel);
    return;
  }
}

// ============================================================
// CLAIM Ticket
// ============================================================
async function handleClaim(interaction, ticket, ticketId, member, channel, guild) {
  try {
    await interaction.deferReply({ ephemeral: true });
  } catch (e) {
    console.error('[Tickets] Claim defer failed:', e.message);
    return;
  }

  try {
    // Check permissions - use member.permissions (works in button interactions)
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.editReply({ content: '❌ Only staff members can claim tickets.' });
    }

    // Check if already claimed
    if (ticket.claimedBy) {
      try {
        const claimer = await guild.members.fetch(ticket.claimedBy).catch(() => null);
        return await interaction.editReply({
          content: `❌ This ticket is already claimed by ${claimer?.user?.tag || 'another staff member'}.`
        });
      } catch (e) {
        return await interaction.editReply({ content: '❌ This ticket is already claimed.' });
      }
    }

    // Claim it
    ticket.claimedBy = member.user.id;
    ticket.claimedAt = new Date().toISOString();
    saveTickets();

    // Update the embed in the ticket channel
    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const panelMessage = messages.find(m => m.embeds?.[0]?.title?.includes('Ticket #'));

      if (panelMessage && panelMessage.embeds[0]) {
        const oldEmbed = panelMessage.embeds[0];
        const updatedEmbed = new EmbedBuilder()
          .setTitle(oldEmbed.title)
          .setDescription(oldEmbed.description)
          .setColor(0x22C55E)
          .setThumbnail(oldEmbed.thumbnail?.url || null)
          .addFields({ name: '👋 Claimed By', value: `<@${member.user.id}>`, inline: true })
          .setFooter({ text: 'Ticket Claimed • Toolmetry AI' })
          .setTimestamp();

        await panelMessage.edit({ embeds: [updatedEmbed] });
      }
    } catch (editErr) {
      console.warn('[Tickets] Could not update panel embed:', editErr.message);
    }

    await channel.send({ content: `✅ **${member.user.tag}** claimed this ticket!` });
    return await interaction.editReply({ content: '✅ You claimed this ticket!' });

  } catch (err) {
    console.error('[Tickets] Claim error:', err);
    try {
      await interaction.editReply({ content: '❌ Error claiming ticket. Please try again.' });
    } catch (e) { /* already responded */ }
  }
}

// ============================================================
// CLOSE Ticket
// ============================================================
async function handleClose(interaction, ticket, ticketId, member, channel, guild, user) {
  try {
    await interaction.deferReply();
  } catch (e) {
    console.error('[Tickets] Close defer failed:', e.message);
    return;
  }

  try {
    // Check permissions - staff or ticket owner can close
    const isStaff = member.permissions.has(PermissionFlagsBits.ManageMessages);
    const isOwner = ticket.userId === user.id;

    if (!isStaff && !isOwner) {
      return await interaction.editReply({ content: '❌ Only staff or the ticket owner can close this ticket.' });
    }

    // Check if already closed
    if (ticket.status === 'closed') {
      return await interaction.editReply({ content: '❌ This ticket is already closed.' });
    }

    // Close it
    ticket.status = 'closed';
    ticket.closedBy = user.id;
    ticket.closedAt = new Date().toISOString();
    saveTickets();

    // Update the embed - remove buttons, mark as closed
    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const panelMessage = messages.find(m => m.embeds?.[0]?.title?.includes('Ticket #'));

      if (panelMessage && panelMessage.embeds[0]) {
        const oldEmbed = panelMessage.embeds[0];
        const closedEmbed = new EmbedBuilder()
          .setTitle(oldEmbed.title + ' [CLOSED]')
          .setDescription(oldEmbed.description)
          .setColor(0xEF4444)
          .setThumbnail(oldEmbed.thumbnail?.url || null)
          .addFields({ name: '🔒 Closed By', value: `<@${user.id}>`, inline: true })
          .setFooter({ text: 'Ticket Closed • Toolmetry AI' })
          .setTimestamp();

        // Remove all buttons - ticket is closed
        await panelMessage.edit({ embeds: [closedEmbed], components: [] });
      }
    } catch (editErr) {
      console.warn('[Tickets] Could not update panel embed:', editErr.message);
    }

    // Notify in channel
    await channel.send({
      content: `🔒 Ticket closed by **${user.tag}**. This channel will be deleted in 60 seconds.`
    });

    await interaction.editReply({ content: '✅ Ticket closed. Channel will be deleted in 60 seconds.' });

    // Delete channel after 60 seconds (shorter than before - 5 minutes was too long)
    setTimeout(async () => {
      try {
        await channel.delete('Ticket closed and auto-deleted');
        tickets.delete(ticketId);
        saveTickets();
        console.log(`[Tickets] Deleted channel and cleaned up ticket ${ticketId}`);
      } catch (err) {
        console.error(`[Tickets] Error deleting channel for ${ticketId}:`, err.message);
        // Still clean up the ticket data even if channel delete fails
        tickets.delete(ticketId);
        saveTickets();
      }
    }, 60000);

  } catch (err) {
    console.error('[Tickets] Close error:', err);
    try {
      await interaction.editReply({ content: '❌ Error closing ticket. Please try again.' });
    } catch (e) { /* already responded */ }
  }
}

// ============================================================
// DELETE Ticket
// ============================================================
async function handleDelete(interaction, ticket, ticketId, member, channel) {
  try {
    await interaction.deferReply();
  } catch (e) {
    console.error('[Tickets] Delete defer failed:', e.message);
    return;
  }

  try {
    // Only staff can delete
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.editReply({ content: '❌ Only staff members can delete tickets.' });
    }

    await interaction.editReply({ content: '🗑️ Deleting ticket...' });

    // Small delay so user sees the response
    setTimeout(async () => {
      try {
        await channel.delete('Ticket deleted by staff');
        tickets.delete(ticketId);
        saveTickets();
        console.log(`[Tickets] Deleted ticket ${ticketId} by staff request`);
      } catch (err) {
        console.error(`[Tickets] Error deleting channel for ${ticketId}:`, err.message);
        tickets.delete(ticketId);
        saveTickets();
      }
    }, 2000);

  } catch (err) {
    console.error('[Tickets] Delete error:', err);
    try {
      await interaction.editReply({ content: '❌ Error deleting ticket. Please try again.' });
    } catch (e) { /* already responded */ }
  }
}
