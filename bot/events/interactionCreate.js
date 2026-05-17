const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { tickets, saveTickets, getNextTicketNumber, reloadTickets } = require('../utils/ticketStorage');

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
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: '❌ Error executing command!', ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ Error executing command!', ephemeral: true });
        }
      } catch (e) { /* ignore */ }
    }
  }
};

// ============================================================
// MAIN BUTTON HANDLER
// ============================================================
async function handleButton(interaction) {
  const customId = interaction.customId;

  // ---- CREATE TICKET from panel ----
  if (customId === 'ticket_create') {
    return await handleTicketCreate(interaction);
  }

  // ---- CLAIM / CLOSE / DELETE ----
  if (customId.startsWith('ticket_claim_') || customId.startsWith('ticket_close_') || customId.startsWith('ticket_delete_')) {
    return await handleTicketAction(interaction);
  }

  // Unknown button
  try {
    await interaction.reply({ content: 'Unknown button action.', ephemeral: true });
  } catch (e) { /* expired */ }
}

// ============================================================
// CREATE TICKET (from panel button click)
// ALL logic is inline - no external function calls
// ============================================================
async function handleTicketCreate(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;

  console.log(`[Tickets] Create button clicked by ${user.tag}`);

  // Step 1: Defer reply FIRST (within 3 seconds)
  let deferred = false;
  try {
    await interaction.deferReply({ ephemeral: true });
    deferred = true;
  } catch (deferErr) {
    console.error('[Tickets] Defer failed:', deferErr.message);
    // Try regular reply as fallback
    try {
      await interaction.reply({ content: '❌ Failed to process. Please try again.', ephemeral: true });
    } catch (e) { /* totally expired */ }
    return;
  }

  // Helper to safely respond (always use editReply since we deferred)
  const reply = async (content) => {
    try {
      if (deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    } catch (e) {
      console.error('[Tickets] Reply failed:', e.message);
    }
  };

  // Step 2: Validate guild
  if (!guild) {
    return await reply('❌ This can only be used in a server.');
  }

  // Step 3: Check for existing open ticket
  try {
    for (const [id, ticket] of tickets) {
      if (ticket.userId === user.id && ticket.guildId === guild.id && ticket.status === 'open') {
        const existingChannel = guild.channels.cache.get(ticket.channelId);
        if (existingChannel) {
          return await reply(`❌ You already have an open ticket: ${existingChannel}`);
        } else {
          // Channel deleted but ticket exists - clean up
          ticket.status = 'closed';
          saveTickets();
        }
      }
    }
  } catch (err) {
    console.error('[Tickets] Existing ticket check error:', err.message);
  }

  // Step 4: Get next ticket number
  const ticketNumber = getNextTicketNumber();
  const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}`;
  const ticketId = `TICKET-${ticketNumber}`;

  // Step 5: Create the channel
  let ticketChannel;
  try {
    // Get bot member - use guild.members.me (always available after ready)
    const botMember = guild.members.me;

    const permissionOverwrites = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ];

    // Add bot permissions if available
    if (botMember) {
      permissionOverwrites.push({
        id: botMember.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory]
      });
    }

    ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites
    });

    console.log(`[Tickets] Channel created: ${channelName} (${ticketChannel.id})`);
  } catch (err) {
    console.error('[Tickets] Channel create error:', err.message);
    return await reply(`❌ Failed to create ticket channel. Error: ${err.message || 'Check bot permissions.'}`);
  }

  // Step 6: Store ticket data
  try {
    tickets.set(ticketId, {
      ticketId,
      guildId: guild.id,
      channelId: ticketChannel.id,
      userId: user.id,
      username: user.username,
      subject: 'Support Ticket',
      status: 'open',
      claimedBy: null,
      createdAt: new Date().toISOString()
    });
    saveTickets();
    console.log(`[Tickets] Stored ${ticketId} in Map (size: ${tickets.size})`);
  } catch (err) {
    console.error('[Tickets] Store error:', err.message);
    // Channel was created but storage failed - still notify user
    return await reply(`⚠️ Ticket channel created: ${ticketChannel}, but data storage failed. Contact admin.`);
  }

  // Step 7: Send embed + buttons in ticket channel
  try {
    const embed = new EmbedBuilder()
      .setTitle(`🎫 Ticket #${ticketNumber}`)
      .setDescription(
        `**Welcome to Support!**\n\n` +
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
  } catch (err) {
    console.error('[Tickets] Send embed error:', err.message);
    // Channel exists but embed failed - still notify user
    return await reply(`✅ Ticket created: ${ticketChannel} (embed failed to send)`);
  }

  // Step 8: Success!
  await reply(`✅ Ticket created: ${ticketChannel}`);
}

// ============================================================
// TICKET ACTION BUTTONS (claim / close / delete)
// ============================================================
async function handleTicketAction(interaction) {
  const customId = interaction.customId;
  const guild = interaction.guild;
  const user = interaction.user;
  const channel = interaction.channel;
  const member = interaction.member;

  // Parse action and ticketId
  let action, ticketId;

  if (customId.startsWith('ticket_claim_')) {
    action = 'claim';
    ticketId = customId.slice('ticket_claim_'.length);
  } else if (customId.startsWith('ticket_close_')) {
    action = 'close';
    ticketId = customId.slice('ticket_close_'.length);
  } else if (customId.startsWith('ticket_delete_')) {
    action = 'delete';
    ticketId = customId.slice('ticket_delete_'.length);
  }

  console.log(`[Tickets] Button: ${action}, ticketId: ${ticketId}, user: ${user.tag}`);

  // Find ticket in memory
  let ticket = tickets.get(ticketId);

  // If not found, try reloading from disk (bot may have restarted)
  if (!ticket) {
    console.log(`[Tickets] ${ticketId} not in memory, reloading from disk...`);
    reloadTickets();
    ticket = tickets.get(ticketId);
  }

  // Still not found - ticket doesn't exist
  if (!ticket) {
    try {
      await interaction.reply({
        content: '❌ This ticket no longer exists. It may have been closed or deleted. Create a new ticket if needed.',
        ephemeral: true
      });
    } catch (e) { /* expired */ }
    return;
  }

  // Route to correct handler
  if (action === 'claim') {
    return await handleClaim(interaction, ticket, ticketId, member, channel, guild);
  }
  if (action === 'close') {
    return await handleClose(interaction, ticket, ticketId, member, channel, guild, user);
  }
  if (action === 'delete') {
    return await handleDelete(interaction, ticket, ticketId, member, channel);
  }
}

// ============================================================
// CLAIM
// ============================================================
async function handleClaim(interaction, ticket, ticketId, member, channel, guild) {
  // Defer first
  try {
    await interaction.deferReply({ ephemeral: true });
  } catch (e) {
    console.error('[Tickets] Claim defer failed:', e.message);
    return;
  }

  try {
    // Permission check
    if (!member || !member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.editReply({ content: '❌ Only staff members can claim tickets.' });
    }

    // Already claimed?
    if (ticket.claimedBy) {
      return await interaction.editReply({ content: '❌ This ticket is already claimed.' });
    }

    // Claim it
    ticket.claimedBy = member.user.id;
    ticket.claimedAt = new Date().toISOString();
    saveTickets();

    // Update embed in channel
    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const panelMsg = messages.find(m => m.embeds?.[0]?.title?.includes('Ticket #'));

      if (panelMsg?.embeds?.[0]) {
        const old = panelMsg.embeds[0];
        const updated = new EmbedBuilder()
          .setTitle(old.title)
          .setDescription(old.description)
          .setColor(0x22C55E)
          .setThumbnail(old.thumbnail?.url || null)
          .addFields({ name: '👋 Claimed By', value: `<@${member.user.id}>`, inline: true })
          .setFooter({ text: 'Ticket Claimed • Toolmetry AI' })
          .setTimestamp();

        await panelMsg.edit({ embeds: [updated] });
      }
    } catch (editErr) {
      console.warn('[Tickets] Embed update failed:', editErr.message);
    }

    await channel.send(`✅ **${member.user.tag}** claimed this ticket!`);
    return await interaction.editReply({ content: '✅ You claimed this ticket!' });

  } catch (err) {
    console.error('[Tickets] Claim error:', err.message);
    try { await interaction.editReply({ content: '❌ Error claiming ticket.' }); } catch (e) { /* */ }
  }
}

// ============================================================
// CLOSE
// ============================================================
async function handleClose(interaction, ticket, ticketId, member, channel, guild, user) {
  try {
    await interaction.deferReply();
  } catch (e) {
    console.error('[Tickets] Close defer failed:', e.message);
    return;
  }

  try {
    const isStaff = member?.permissions?.has(PermissionFlagsBits.ManageMessages);
    const isOwner = ticket.userId === user.id;

    if (!isStaff && !isOwner) {
      return await interaction.editReply({ content: '❌ Only staff or ticket owner can close this.' });
    }

    if (ticket.status === 'closed') {
      return await interaction.editReply({ content: '❌ This ticket is already closed.' });
    }

    // Close it
    ticket.status = 'closed';
    ticket.closedBy = user.id;
    ticket.closedAt = new Date().toISOString();
    saveTickets();

    // Update embed - remove buttons
    try {
      const messages = await channel.messages.fetch({ limit: 10 });
      const panelMsg = messages.find(m => m.embeds?.[0]?.title?.includes('Ticket #'));

      if (panelMsg?.embeds?.[0]) {
        const old = panelMsg.embeds[0];
        const closed = new EmbedBuilder()
          .setTitle(old.title + ' [CLOSED]')
          .setDescription(old.description)
          .setColor(0xEF4444)
          .setThumbnail(old.thumbnail?.url || null)
          .addFields({ name: '🔒 Closed By', value: `<@${user.id}>`, inline: true })
          .setFooter({ text: 'Ticket Closed • Toolmetry AI' })
          .setTimestamp();

        await panelMsg.edit({ embeds: [closed], components: [] });
      }
    } catch (editErr) {
      console.warn('[Tickets] Embed update failed:', editErr.message);
    }

    await channel.send(`🔒 Ticket closed by **${user.tag}**. Channel will be deleted in 30 seconds.`);
    await interaction.editReply({ content: '✅ Ticket closed. Channel will be deleted in 30 seconds.' });

    // Auto-delete channel after 30 seconds
    setTimeout(async () => {
      try {
        await channel.delete('Ticket closed - auto delete');
        console.log(`[Tickets] Auto-deleted channel for ${ticketId}`);
      } catch (err) {
        console.error(`[Tickets] Auto-delete channel error:`, err.message);
      }
      tickets.delete(ticketId);
      saveTickets();
    }, 30000);

  } catch (err) {
    console.error('[Tickets] Close error:', err.message);
    try { await interaction.editReply({ content: '❌ Error closing ticket.' }); } catch (e) { /* */ }
  }
}

// ============================================================
// DELETE
// ============================================================
async function handleDelete(interaction, ticket, ticketId, member, channel) {
  try {
    await interaction.deferReply();
  } catch (e) {
    console.error('[Tickets] Delete defer failed:', e.message);
    return;
  }

  try {
    if (!member?.permissions?.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.editReply({ content: '❌ Only staff members can delete tickets.' });
    }

    await interaction.editReply({ content: '🗑️ Deleting ticket...' });

    // Small delay then delete
    setTimeout(async () => {
      try {
        await channel.delete('Ticket deleted by staff');
        console.log(`[Tickets] Deleted channel for ${ticketId}`);
      } catch (err) {
        console.error(`[Tickets] Channel delete error:`, err.message);
      }
      tickets.delete(ticketId);
      saveTickets();
    }, 2000);

  } catch (err) {
    console.error('[Tickets] Delete error:', err.message);
    try { await interaction.editReply({ content: '❌ Error deleting ticket.' }); } catch (e) { /* */ }
  }
}
