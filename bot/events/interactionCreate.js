const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const { tickets, saveTickets } = require('../commands/ticket');

// In-memory warnings storage
const warnings = new Map();

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // Handle Button Interactions
    if (interaction.isButton()) {
      return handleButtonInteraction(interaction);
    }

    // Handle Slash Commands
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
      
      const errorMessage = {
        content: 'There was an error while executing this command!',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
};

async function handleButtonInteraction(interaction) {
  const { customId, guild, user, channel } = interaction;

  try {
    // Ticket Create Button from panel
    if (customId === 'ticket_create') {
      await interaction.deferReply({ ephemeral: true });

      // Check if user already has an open ticket
      for (const [id, ticket] of tickets) {
        if (ticket.userId === user.id && ticket.guildId === guild.id && ticket.status === 'open') {
          const existingChannel = guild.channels.cache.get(ticket.channelId);
          if (existingChannel) {
            return await interaction.editReply({ 
              content: `⚠️ You already have an open ticket: ${existingChannel}` 
            });
          }
        }
      }

      // Get next ticket number
      let maxNum = 0;
      for (const [id, ticket] of tickets) {
        const num = parseInt(ticket.ticketId.split('-')[1]);
        if (num > maxNum) maxNum = num;
      }
      const ticketNumber = maxNum + 1;
      const channelName = `ticket-${ticketNumber.toString().padStart(4, '0')}`;

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
      
      // Save to file
      saveTickets();

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket #${ticketNumber}`)
        .setDescription(
          `**Welcome to Toolmetry AI Support!**\n\n` +
          `Hello ${user}, our support team will assist you shortly.\n\n` +
          `**User:** ${user.tag}\n` +
          `**Created:** <t:${Math.floor(Date.now()/1000)}:R>`
        )
        .setColor(0x00D4AA)
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: 'Toolmetry AI Ticket System', iconURL: interaction.client.user.displayAvatarURL() })
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

      return interaction.editReply({ content: `✅ Ticket created: ${ticketChannel}` });
    }

    // Handle ticket claim/close/delete (format: ticket_action_ticketId)
    if (customId.startsWith('ticket_')) {
      const parts = customId.split('_');
      const action = parts[1];
      const ticketId = parts.slice(2).join('_');
      
      const ticket = tickets.get(ticketId);

      if (action === 'claim') {
        await interaction.deferReply({ ephemeral: true });
        
        if (!ticket) {
          return await interaction.editReply({ content: '❌ Ticket not found.' });
        }

        if (ticket.claimedBy) {
          const claimer = await guild.members.fetch(ticket.claimedBy).catch(() => null);
          return await interaction.editReply({ content: `⚠️ Already claimed by ${claimer?.user?.tag || 'someone'}.` });
        }

        ticket.claimedBy = user.id;
        saveTickets(); // Persist changes

        const messages = await channel.messages.fetch({ limit: 10 });
        const panelMessage = messages.find(m => m.embeds?.[0]?.title?.includes('Ticket #'));
        
        if (panelMessage && panelMessage.embeds[0]) {
          const oldEmbed = panelMessage.embeds[0];
          const updatedEmbed = new EmbedBuilder()
            .setTitle(oldEmbed.title)
            .setDescription(oldEmbed.description)
            .setColor(0x00D26A)
            .setThumbnail(oldEmbed.thumbnail?.url || null)
            .addFields({ name: '👋 Claimed By', value: `<@${user.id}>`, inline: true })
            .setFooter({ text: 'Toolmetry AI • Ticket Claimed', iconURL: oldEmbed.footer?.iconURL });
          
          await panelMessage.edit({ embeds: [updatedEmbed] });
        }

        await channel.send({ content: `👋 **${user.tag}** has claimed this ticket.` });
        return await interaction.editReply({ content: '✅ You have claimed this ticket.' });
      }

      if (action === 'close') {
        await interaction.deferReply();
        
        if (!ticket) {
          return await interaction.editReply({ content: '❌ Ticket not found.' });
        }

        ticket.status = 'closed';
        saveTickets(); // Persist changes

        const messages = await channel.messages.fetch({ limit: 10 });
        const panelMessage = messages.find(m => m.embeds?.[0]?.title?.includes('Ticket #'));
        
        if (panelMessage && panelMessage.embeds[0]) {
          const oldEmbed = panelMessage.embeds[0];
          const closedEmbed = new EmbedBuilder()
            .setTitle(oldEmbed.title + ' (CLOSED)')
            .setDescription(oldEmbed.description)
            .setColor(0xE94560)
            .setThumbnail(oldEmbed.thumbnail?.url || null)
            .addFields({ name: '🔒 Closed By', value: `<@${user.id}>`, inline: true })
            .setFooter({ text: 'Toolmetry AI • Ticket Closed', iconURL: oldEmbed.footer?.iconURL });
          
          await panelMessage.edit({ embeds: [closedEmbed], components: [] });
        }

        await channel.send({ 
          content: `🔒 **Ticket closed by ${user.tag}**\n🗑️ Channel will be deleted in 5 minutes.` 
        });

        // Schedule deletion with better error handling
        const deleteTimer = setTimeout(async () => {
          try {
            console.log(`Attempting to delete ticket channel: ${channel.name}`);
            await channel.delete('Ticket closed - auto-deletion');
            tickets.delete(ticketId);
            console.log(`✅ Successfully deleted ticket channel: ${channel.name}`);
          } catch (err) {
            console.error(`❌ Failed to delete ticket channel ${channel.name}:`, err);
            // Try to remove from tickets map even if channel deletion fails
            tickets.delete(ticketId);
          }
        }, 300000);

        // Store timer reference on ticket for potential cleanup
        ticket.deleteTimer = deleteTimer;

        return await interaction.editReply({ content: '✅ Ticket closed. Channel will be deleted in 5 minutes.' });
      }

      if (action === 'delete') {
        await interaction.deferReply();
        
        if (!ticket) {
          return await interaction.editReply({ content: '❌ Ticket not found.' });
        }

        await interaction.editReply({ content: '🗑️ **Deleting ticket...**' });
        
        // Clear any existing deletion timer
        if (ticket.deleteTimer) {
          clearTimeout(ticket.deleteTimer);
        }

        // Immediate deletion with better error handling
        setTimeout(async () => {
          try {
            console.log(`Attempting to delete ticket channel: ${channel.name}`);
            await channel.delete('Ticket manually deleted');
            tickets.delete(ticketId);
            console.log(`✅ Successfully deleted ticket channel: ${channel.name}`);
          } catch (err) {
            console.error(`❌ Failed to delete ticket channel ${channel.name}:`, err);
            // Remove from tickets map even if channel deletion fails
            tickets.delete(ticketId);
          }
        }, 1000);
      }
    }

  } catch (error) {
    console.error('Button interaction error:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'An error occurred.', ephemeral: true }).catch(() => {});
    } else {
      await interaction.editReply({ content: 'An error occurred.' }).catch(() => {});
    }
  }
}
