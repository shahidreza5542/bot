const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const ticketStorage = require('../utils/ticketStorage');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // ---- BUTTON CLICKS ----
    if (interaction.isButton()) {
      return handleButton(interaction);
    }

    // ---- SLASH COMMANDS ----
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[Cmd Error] ${interaction.commandName}:`, error.message);
      try {
        const msg = { content: '❌ Error executing command!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg);
        } else {
          await interaction.reply(msg);
        }
      } catch (e) { /* ignore */ }
    }
  }
};

// ============================================================
// BUTTON ROUTER
// Custom IDs: t_new, t_claim_TICKET-X, t_close_TICKET-X, t_del_TICKET-X
// ============================================================
async function handleButton(interaction) {
  const id = interaction.customId;

  // Create ticket (from panel button)
  if (id === 't_new') {
    return await btnCreateTicket(interaction);
  }

  // Claim
  if (id.startsWith('t_claim_')) {
    const ticketId = id.slice(8); // remove 't_claim_'
    return await btnClaim(interaction, ticketId);
  }

  // Close
  if (id.startsWith('t_close_')) {
    const ticketId = id.slice(8); // remove 't_close_'
    return await btnClose(interaction, ticketId);
  }

  // Delete
  if (id.startsWith('t_del_')) {
    const ticketId = id.slice(6); // remove 't_del_'
    return await btnDelete(interaction, ticketId);
  }

  // Unknown button
  try { await interaction.reply({ content: '❓ Unknown button.', ephemeral: true }); } catch (e) { /* */ }
}

// ============================================================
// SAFE REPLY HELPER
// Always makes sure the user gets a response, never "thinking forever"
// ============================================================
async function safeReply(interaction, content, ephemeral = true) {
  try {
    if (interaction.deferred) {
      await interaction.editReply({ content });
    } else if (interaction.replied) {
      await interaction.followUp({ content, ephemeral });
    } else {
      await interaction.reply({ content, ephemeral });
    }
  } catch (e) {
    console.error('[Reply Error]', e.message);
  }
}

// ============================================================
// CREATE TICKET (panel button)
// ============================================================
async function btnCreateTicket(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;

  // Step 1: Defer immediately (3 second deadline)
  try {
    await interaction.deferReply({ ephemeral: true });
  } catch (e) {
    console.error('[Ticket] Defer failed:', e.message);
    return;
  }

  // Step 2: Validate
  if (!guild) {
    return await safeReply(interaction, '❌ This only works in a server.');
  }

  // Step 3: Check existing open ticket
  const existing = ticketStorage.getOpenTicket(guild.id, user.id);
  if (existing) {
    const ch = guild.channels.cache.get(existing.channelId);
    if (ch) {
      return await safeReply(interaction, `❌ You already have an open ticket: ${ch}`);
    } else {
      // Stale ticket - clean up
      ticketStorage.updateTicket(existing.ticketId, { status: 'closed' });
    }
  }

  // Step 4: Create ticket data
  const ticket = ticketStorage.createTicket({
    guildId: guild.id,
    userId: user.id,
    username: user.username,
    subject: 'Support Ticket'
  });

  const channelName = `ticket-${ticket.ticketNumber.toString().padStart(4, '0')}`;

  // Step 5: Create Discord channel
  let ticketChannel;
  try {
    const botMember = guild.members.me;
    const overwrites = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
    ];

    if (botMember) {
      overwrites.push({
        id: botMember.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory]
      });
    }

    ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: overwrites
    });

    // Save channel ID
    ticketStorage.updateTicket(ticket.ticketId, { channelId: ticketChannel.id });
  } catch (err) {
    console.error('[Ticket] Channel create error:', err.message);
    ticketStorage.deleteTicket(ticket.ticketId);
    return await safeReply(interaction, `❌ Failed to create ticket. Error: ${err.message}`);
  }

  // Step 6: Send embed + buttons in ticket channel
  try {
    const embed = new EmbedBuilder()
      .setTitle(`🎫 Ticket #${ticket.ticketNumber}`)
      .setDescription(
        `**Welcome to Support!**\n\n` +
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
  } catch (err) {
    console.error('[Ticket] Embed send error:', err.message);
    // Channel was created, still notify user
    return await safeReply(interaction, `✅ Ticket created: ${ticketChannel} (embed failed)`);
  }

  // Step 7: Success
  return await safeReply(interaction, `✅ Ticket created: ${ticketChannel}`);
}

// ============================================================
// CLAIM TICKET
// ============================================================
async function btnClaim(interaction, ticketId) {
  // Defer first
  try { await interaction.deferReply({ ephemeral: true }); } catch (e) { return; }

  const member = interaction.member;
  const channel = interaction.channel;
  const guild = interaction.guild;

  // Get ticket
  const ticket = ticketStorage.getTicket(ticketId);
  if (!ticket) {
    return await safeReply(interaction, '❌ This ticket no longer exists. Create a new one.');
  }

  // Permission check
  if (!member?.permissions?.has(PermissionFlagsBits.ManageMessages)) {
    return await safeReply(interaction, '❌ Only staff can claim tickets.');
  }

  // Already claimed?
  if (ticket.claimedBy) {
    return await safeReply(interaction, '❌ Already claimed by another staff member.');
  }

  // Claim it
  ticketStorage.updateTicket(ticketId, {
    claimedBy: member.user.id,
    claimedAt: new Date().toISOString()
  });

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
        .setFooter({ text: 'Ticket Claimed' })
        .setTimestamp();

      await panelMsg.edit({ embeds: [updated] });
    }
  } catch (err) {
    console.warn('[Ticket] Embed update failed:', err.message);
  }

  await channel.send(`✅ <@${member.user.id}> claimed this ticket!`);
  return await safeReply(interaction, '✅ You claimed this ticket!');
}

// ============================================================
// CLOSE TICKET
// ============================================================
async function btnClose(interaction, ticketId) {
  try { await interaction.deferReply(); } catch (e) { return; }

  const member = interaction.member;
  const user = interaction.user;
  const channel = interaction.channel;

  // Get ticket
  const ticket = ticketStorage.getTicket(ticketId);
  if (!ticket) {
    return await safeReply(interaction, '❌ Ticket not found. It may have been deleted.');
  }

  // Permission: staff or ticket owner
  const isStaff = member?.permissions?.has(PermissionFlagsBits.ManageMessages);
  const isOwner = ticket.userId === user.id;
  if (!isStaff && !isOwner) {
    return await safeReply(interaction, '❌ Only staff or ticket owner can close this.');
  }

  if (ticket.status === 'closed') {
    return await safeReply(interaction, '❌ Already closed.');
  }

  // Close it
  ticketStorage.updateTicket(ticketId, {
    status: 'closed',
    closedBy: user.id,
    closedAt: new Date().toISOString()
  });

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
        .setFooter({ text: 'Ticket Closed' })
        .setTimestamp();

      await panelMsg.edit({ embeds: [closed], components: [] });
    }
  } catch (err) {
    console.warn('[Ticket] Embed update failed:', err.message);
  }

  await channel.send(`🔒 Ticket closed by <@${user.id}>. Channel will be deleted in 30 seconds.`);
  await interaction.editReply('✅ Ticket closed. Channel will be deleted in 30 seconds.');

  // Auto-delete channel after 30 seconds
  setTimeout(async () => {
    try {
      await channel.delete('Ticket closed');
    } catch (err) {
      console.error('[Ticket] Channel delete error:', err.message);
    }
    ticketStorage.deleteTicket(ticketId);
  }, 30000);
}

// ============================================================
// DELETE TICKET
// ============================================================
async function btnDelete(interaction, ticketId) {
  try { await interaction.deferReply(); } catch (e) { return; }

  const member = interaction.member;
  const channel = interaction.channel;

  // Permission
  if (!member?.permissions?.has(PermissionFlagsBits.ManageMessages)) {
    return await interaction.editReply('❌ Only staff can delete tickets.');
  }

  // Get ticket
  const ticket = ticketStorage.getTicket(ticketId);
  if (!ticket) {
    return await interaction.editReply('❌ Ticket not found.');
  }

  await interaction.editReply('🗑️ Deleting ticket...');

  // Delete after short delay
  setTimeout(async () => {
    try {
      await channel.delete('Ticket deleted by staff');
    } catch (err) {
      console.error('[Ticket] Channel delete error:', err.message);
    }
    ticketStorage.deleteTicket(ticketId);
  }, 2000);
}
