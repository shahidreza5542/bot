const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const { tickets, saveTickets } = require('../commands/ticket');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isButton()) {
      return handleButton(interaction);
    }

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
      
      const errorMsg = {
        content: 'There was an error while executing this command!',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMsg);
      } else {
        await interaction.reply(errorMsg);
      }
    }
  }
};

async function handleButton(interaction) {
  const customId = interaction.customId;
  const guild = interaction.guild;
  const user = interaction.user;
  const channel = interaction.channel;

  // create ticket button
  if (customId === 'ticket_create') {
    try {
      await interaction.deferReply({ ephemeral: true });

      // check if user already has open ticket
      for (const [id, ticket] of tickets) {
        if (ticket.userId === user.id && ticket.guildId === guild.id && ticket.status === 'open') {
          const existingChannel = guild.channels.cache.get(ticket.channelId);
          if (existingChannel) {
            return await interaction.editReply({ 
              content: `You already have an open ticket: ${existingChannel}` 
            });
          }
        }
      }

      // get ticket number
      let maxNum = 0;
      for (const [id, ticket] of tickets) {
        const num = parseInt(ticket.ticketId.split('-')[1]);
        if (num > maxNum) maxNum = num;
      }
      const ticketNumber = maxNum + 1;
      const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}`;

      // create channel
      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
          { id: guild.members.me.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] }
        ]
      });

      const ticketId = `TICKET-${ticketNumber}`;
      tickets.set(ticketId, {
        ticketId,
        guildId: guild.id,
        channelId: ticketChannel.id,
        userId: user.id,
        username: user.username,
        subject: 'Support Ticket',
        status: 'open',
        claimedBy: null,
        createdAt: new Date()
      });
      
      saveTickets();

      // send embed with buttons
      const embed = new EmbedBuilder()
        .setTitle(`Ticket #${ticketNumber}`)
        .setDescription(
          `Welcome to Toolmetry Support!\n\n` +
          `Hello ${user}, our support team will help you soon.\n\n` +
          `User: ${user.tag}\n` +
          `Created: <t:${Math.floor(Date.now()/1000)}:R>`
        )
        .setColor(0x4F46E5)
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: 'Toolmetry Ticket System' })
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

      return interaction.editReply({ content: `Ticket created: ${ticketChannel}` });
    } catch (err) {
      console.error('Error creating ticket:', err);
      if (!interaction.replied) {
        await interaction.reply({ content: 'Error creating ticket', ephemeral: true }).catch(() => {});
      }
    }
  }

  // ticket action buttons
  if (customId.startsWith('ticket_')) {
    const parts = customId.split('_');
    const action = parts[1];
    const ticketId = parts.slice(2).join('_');
    
    const ticket = tickets.get(ticketId);

    if (!ticket) {
      return interaction.reply({ content: 'Ticket not found', ephemeral: true }).catch(() => {});
    }

    // claim button
    if (action === 'claim') {
      try {
        await interaction.deferReply({ ephemeral: true });

        // security check - only staff
        if (!user.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
          return await interaction.editReply({ content: 'Only staff can claim tickets' });
        }

        if (ticket.claimedBy) {
          const claimer = await guild.members.fetch(ticket.claimedBy).catch(() => null);
          return await interaction.editReply({ content: `Already claimed by ${claimer?.user?.tag || 'someone'}` });
        }

        ticket.claimedBy = user.id;
        saveTickets();

        const messages = await channel.messages.fetch({ limit: 10 });
        const panelMessage = messages.find(m => m.embeds?.[0]?.title?.includes('Ticket #'));
        
        if (panelMessage && panelMessage.embeds[0]) {
          const oldEmbed = panelMessage.embeds[0];
          const updatedEmbed = new EmbedBuilder()
            .setTitle(oldEmbed.title)
            .setDescription(oldEmbed.description)
            .setColor(0x22C55E)
            .setThumbnail(oldEmbed.thumbnail?.url || null)
            .addFields({ name: 'Claimed By', value: `<@${user.id}>`, inline: true })
            .setFooter({ text: 'Ticket Claimed' });
          
          await panelMessage.edit({ embeds: [updatedEmbed] });
        }

        await channel.send({ content: `${user.tag} claimed this ticket` });
        return await interaction.editReply({ content: 'Ticket claimed' });
      } catch (err) {
        console.error('Error claiming ticket:', err);
        return interaction.editReply({ content: 'Error claiming ticket' }).catch(() => {});
      }
    }

    // close button
    if (action === 'close') {
      try {
        await interaction.deferReply();

        // security check - only staff or ticket owner
        const member = await guild.members.fetch(user.id).catch(() => null);
        const isStaff = member?.permissions.has(PermissionsBitField.Flags.ManageMessages);
        const isOwner = ticket.userId === user.id;

        if (!isStaff && !isOwner) {
          return await interaction.editReply({ content: 'Only staff or ticket owner can close' });
        }

        ticket.status = 'closed';
        saveTickets();

        const messages = await channel.messages.fetch({ limit: 10 });
        const panelMessage = messages.find(m => m.embeds?.[0]?.title?.includes('Ticket #'));
        
        if (panelMessage && panelMessage.embeds[0]) {
          const oldEmbed = panelMessage.embeds[0];
          const closedEmbed = new EmbedBuilder()
            .setTitle(oldEmbed.title + ' (CLOSED)')
            .setDescription(oldEmbed.description)
            .setColor(0xEF4444)
            .setThumbnail(oldEmbed.thumbnail?.url || null)
            .addFields({ name: 'Closed By', value: `<@${user.id}>`, inline: true })
            .setFooter({ text: 'Ticket Closed' });
          
          await panelMessage.edit({ embeds: [closedEmbed], components: [] });
        }

        await channel.send({ 
          content: `Ticket closed by ${user.tag}\nChannel will be deleted in 5 minutes` 
        });

        // delete after 5 min
        setTimeout(async () => {
          try {
            await channel.delete('Ticket closed');
            tickets.delete(ticketId);
          } catch (err) {
            console.error('Error deleting channel:', err);
            tickets.delete(ticketId);
          }
        }, 300000);

        return await interaction.editReply({ content: 'Ticket closed. Channel will be deleted in 5 minutes' });
      } catch (err) {
        console.error('Error closing ticket:', err);
        return interaction.editReply({ content: 'Error closing ticket' }).catch(() => {});
      }
    }

    // delete button
    if (action === 'delete') {
      try {
        await interaction.deferReply();

        // security check - only staff
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
          return await interaction.editReply({ content: 'Only staff can delete tickets' });
        }
        
        await interaction.editReply({ content: 'Deleting ticket...' });
        
        setTimeout(async () => {
          try {
            await channel.delete('Ticket deleted');
            tickets.delete(ticketId);
          } catch (err) {
            console.error('Error deleting channel:', err);
            tickets.delete(ticketId);
          }
        }, 1000);
      } catch (err) {
        console.error('Error deleting ticket:', err);
        return interaction.editReply({ content: 'Error deleting ticket' }).catch(() => {});
      }
    }
  }

  // unknown button
  if (!interaction.replied) {
    await interaction.reply({ content: 'Unknown button', ephemeral: true }).catch(() => {});
  }
}
