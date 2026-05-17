const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');

const {
  tickets,
  saveTickets,
  reloadTickets
} = require('../utils/ticketStorage');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction) {
    try {
      if (interaction.isButton()) {
        return handleButton(interaction);
      }

      if (!interaction.isChatInputCommand()) return;

      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      await command.execute(interaction);

    } catch (err) {
      console.error('Interaction Error:', err);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Interaction failed',
          flags: 64
        }).catch(() => { });
      }
    }
  }
};

// ================= BUTTON ROUTER =================
async function handleButton(interaction) {
  try {
    const id = interaction.customId;

    // CREATE
    if (id === 'ticket_create') {
      return await handleTicketCreate(interaction);
    }

    // OLD FORMAT SUPPORT (IMPORTANT FIX)
    if (id.startsWith('ticket_')) {
      const parts = id.split('_'); // ticket_claim_123

      if (parts.length !== 3) {
        return interaction.reply({
          content: '❌ Old button format detected. Recreate panel.',
          flags: 64
        });
      }

      const [, action, ticketId] = parts;

      return await handleTicketAction(interaction, action, ticketId);
    }

    // NEW FORMAT
    if (id.startsWith('ticket:')) {
      const parts = id.split(':');

      if (parts.length !== 3) {
        return interaction.reply({
          content: '❌ Invalid button format',
          flags: 64
        });
      }

      const [, action, ticketId] = parts;

      return await handleTicketAction(interaction, action, ticketId);
    }

    return interaction.reply({
      content: '❌ Unknown button',
      flags: 64
    });

  } catch (err) {
    console.error('Button error:', err);

    if (!interaction.replied) {
      await interaction.reply({
        content: '❌ Button crash',
        flags: 64
      }).catch(() => { });
    }
  }
}

// ================= CREATE TICKET =================
async function handleTicketCreate(interaction) {
  const guild = interaction.guild;
  const user = interaction.user;

  try {
    await interaction.deferReply({ flags: 64 });
  } catch {
    return;
  }

  const existing = [...tickets.values()].find(
    t => t.userId === user.id && t.guildId === guild.id && t.status === 'open'
  );

  if (existing) {
    const ch = guild.channels.cache.get(existing.channelId);
    return interaction.editReply({
      content: ch ? `❌ Already open: ${ch}` : '❌ Ticket already exists'
    });
  }

  const ticketId = `TICKET-${Date.now()}`;

  let channel;

  try {
    const botMember =
      guild.members.me ||
      await guild.members.fetch(interaction.client.user.id).catch(() => null);

    channel = await guild.channels.create({
      name: `ticket-${Date.now()}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        },
        botMember
          ? {
            id: botMember.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels
            ]
          }
          : null
      ].filter(Boolean)
    });

  } catch (err) {
    console.error(err);
    return interaction.editReply({ content: '❌ Failed to create ticket' });
  }

  tickets.set(ticketId, {
    ticketId,
    userId: user.id,
    guildId: guild.id,
    channelId: channel.id,
    status: 'open',
    createdAt: Date.now()
  });

  saveTickets();

  const embed = new EmbedBuilder()
    .setTitle('🎫 Support Ticket')
    .setDescription(`User: ${user.tag}`)
    .setColor(0x00d4aa);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket:claim:${ticketId}`)
      .setLabel('Claim')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`ticket:close:${ticketId}`)
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId(`ticket:delete:${ticketId}`)
      .setLabel('Delete')
      .setStyle(ButtonStyle.Secondary)
  );

  await channel.send({ content: `${user}`, embeds: [embed], components: [row] });

  return interaction.editReply({
    content: `✅ Ticket created: ${channel}`
  });
}

// ================= ACTION HANDLER =================
async function handleTicketAction(interaction, action, ticketId) {
  let ticket = tickets.get(ticketId);

  if (!ticket) {
    try {
      reloadTickets();
      ticket = tickets.get(ticketId);
    } catch { }
  }

  if (!ticket) {
    return interaction.reply({
      content: '❌ Ticket not found',
      flags: 64
    });
  }

  const channel = interaction.channel;
  const member = interaction.member;
  const user = interaction.user;

  // CLAIM
  if (action === 'claim') {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: '❌ No permission',
        flags: 64
      });
    }

    ticket.claimedBy = user.id;
    saveTickets();

    await channel.send(`👋 Claimed by ${user.tag}`);

    return interaction.reply({
      content: '✅ Claimed',
      flags: 64
    });
  }

  // CLOSE
  if (action === 'close') {
    ticket.status = 'closed';
    saveTickets();

    await channel.send(`🔒 Closed by ${user.tag}`);

    return interaction.reply({
      content: '✅ Closed',
      flags: 64
    });
  }

  // DELETE
  if (action === 'delete') {
    if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: '❌ No permission',
        flags: 64
      });
    }

    await interaction.reply({
      content: '🗑️ Deleting ticket...',
      flags: 64
    });

    setTimeout(async () => {
      try {
        await channel.delete();
      } catch { }

      tickets.delete(ticketId);
      saveTickets();
    }, 2000);
  }
}