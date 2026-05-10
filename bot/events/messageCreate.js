const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { tickets } = require('../commands/ticket');

// Track user activity
const userActivity = new Map();
const lastRoasted = new Map();
const ticketResponses = new Map(); // Track AI responses per ticket

// Free AI roast generator
async function generateAIRoast(username) {
  try {
    const prompt = `Roast user "${username}" with a funny, light-hearted joke about being inactive. Keep it under 120 characters.`;
    const response = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?seed=${Date.now()}&json=false`, { timeout: 5000 });
    return response.data || `\${username} is so inactive, they make sloths look hyperactive!`;
  } catch (error) {
    const roasts = [
      "has been so quiet, we thought they were a ghost!",
      "is so inactive, even snails are racing past them!",
      "finally showed up! We missed your silence!",
      "must be practicing to be invisible!"
    ];
    return roasts[Math.floor(Math.random() * roasts.length)];
  }
}

// AI-powered support response
async function generateAISupportResponse(userMessage, ticketSubject) {
  try {
    const prompt = `You are a helpful AI support assistant for Toolmetry AI. The user has a ticket with subject: "${ticketSubject}". Their message is: "${userMessage}". Provide a helpful, friendly response. Keep it under 200 characters. Be professional but conversational.`;
    const response = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?seed=${Date.now()}&json=false`, { timeout: 5000 });
    return response.data || "I'm here to help! Could you provide more details about your issue?";
  } catch (error) {
    console.error('AI Support Error:', error.message);
    const fallbackResponses = [
      "I'm here to help! Could you provide more details about your issue?",
      "Thank you for reaching out! Let me assist you with this.",
      "I understand your concern. Could you tell me more about what's happening?",
      "I'm happy to help! Please share more information so I can better assist you."
    ];
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    const userId = message.author.id;
    const guildId = message.guild?.id;
    const now = Date.now();

    // Update activity
    userActivity.set(userId, now);

    // AI Support for Tickets
    if (message.channel.name.startsWith('ticket-')) {
      // Check if this is a ticket channel
      let ticket = null;
      for (const [id, t] of tickets) {
        if (t.channelId === message.channel.id && t.status === 'open') {
          ticket = t;
          break;
        }
      }

      if (ticket) {
        // Check if we've already responded recently (avoid spam)
        const lastResponse = ticketResponses.get(ticket.ticketId) || 0;
        const timeSinceResponse = now - lastResponse;

        // Only respond if it's been at least 10 seconds since last AI response
        if (timeSinceResponse > 10000) {
          const aiResponse = await generateAISupportResponse(message.content, ticket.subject);

          const embed = new EmbedBuilder()
            .setTitle('🤖 AI Support Response')
            .setDescription(aiResponse)
            .setColor(0x00D4AA)
            .setFooter({ text: 'Powered by AI • Toolmetry AI Support' })
            .setTimestamp();

          await message.channel.send({ embeds: [embed] });
          ticketResponses.set(ticket.ticketId, now);
        }
      }
    }

    // Check for inactive users to roast (every 10 messages)
    if (message.guild && Math.random() < 0.1) {
      const members = await message.guild.members.fetch();
      const inactiveUsers = [];
      
      for (const [memberId, member] of members) {
        if (member.user.bot || memberId === userId) continue;
        
        const lastActive = userActivity.get(memberId);
        const lastRoast = lastRoasted.get(memberId) || 0;
        
        // If inactive for 30+ minutes and not roasted in last 2 hours
        if (lastActive && (now - lastActive) > 30 * 60 * 1000 && (now - lastRoast) > 2 * 60 * 60 * 1000) {
          inactiveUsers.push(member);
        }
      }

      // Roast a random inactive user
      if (inactiveUsers.length > 0) {
        const target = inactiveUsers[Math.floor(Math.random() * inactiveUsers.length)];
        const roastText = await generateAIRoast(target.user.username);
        
        const embed = new EmbedBuilder()
          .setTitle('🔥 Inactivity Roast!')
          .setDescription(`${target.user} ${roastText}`)
          .setColor(0xFF4500)
          .setFooter({ text: 'Powered by AI • Toolmetry AI Bot' })
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        lastRoasted.set(target.user.id, now);
      }
    }

    // Leveling system (Discord-only, no DB)
    if (message.guild) {
      const key = `xp-${message.guild.id}-${userId}`;
      const currentXP = global.userXP?.get(key) || 0;
      const gainedXP = Math.floor(Math.random() * 10) + 5;
      
      if (!global.userXP) global.userXP = new Map();
      global.userXP.set(key, currentXP + gainedXP);
    }
  }
};
