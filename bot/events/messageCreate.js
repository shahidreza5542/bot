const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const path = require('path');
const { tickets } = require('../commands/ticket');

// Load training data from JSON file
const trainData = require('../data/traindata.json');
const knowledgeBase = trainData.knowledgeBase;
const hindiWords = trainData.languageDetection.hindiWords;
const fallbackResponses = trainData.fallbackResponses;

// Track user activity
const userActivity = new Map();
const lastRoasted = new Map();
const aiResponseCooldown = new Map(); // Track AI response cooldowns

// Detect language (simple heuristic)
function detectLanguage(message) {
  const msg = message.toLowerCase();
  const hasHindi = hindiWords.some(word => msg.includes(word));
  return hasHindi ? 'hi' : 'en';
}

// Match query to knowledge base
function matchQuery(message) {
  const msg = message.toLowerCase();
  
  for (const [key, data] of Object.entries(knowledgeBase)) {
    for (const pattern of data.patterns) {
      if (msg.includes(pattern.toLowerCase())) {
        return key;
      }
    }
  }
  return null;
}

// Get AI response using Gemini
async function getGeminiResponse(userMessage, context = '') {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log('Gemini API key not found, using fallback');
      return null;
    }

    const prompt = `You are Toolmetry AI Support Assistant. Toolmetry is a platform providing useful online tools.
    
Context: ${context}
User Message: "${userMessage}"

Instructions:
- Keep response under 250 characters
- Be friendly and professional
- If user asks about non-support topics (weather, news, etc.), politely say "I'm here to help! Could you provide more details about your issue?"
- Respond in the same language as the user's query (English or Hinglish mix)
- Focus only on Toolmetry-related support queries

Response:`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      { timeout: 8000 }
    );

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.data.candidates[0].content.parts[0].text.trim();
    }
    return null;
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    return null;
  }
}

// Free AI roast generator
async function generateAIRoast(username) {
  try {
    const prompt = `Roast user "${username}" with a funny, light-hearted joke about being inactive. Keep it under 120 characters.`;
    const response = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?seed=${Date.now()}&json=false`, { timeout: 5000 });
    return response.data || `${username} is so inactive, they make sloths look hyperactive!`;
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

// Generate AI Support Response
async function generateSupportResponse(userMessage, channelType = 'support') {
  // First try knowledge base
  const matchedKey = matchQuery(userMessage);
  
  if (matchedKey) {
    const lang = detectLanguage(userMessage);
    return knowledgeBase[matchedKey].responses[lang] || knowledgeBase[matchedKey].responses.en;
  }
  
  // If no match, try Gemini AI
  const geminiResponse = await getGeminiResponse(userMessage, channelType);
  if (geminiResponse) {
    return geminiResponse;
  }
  
  // Ultimate fallback
  const lang = detectLanguage(userMessage);
  return fallbackResponses[lang] || fallbackResponses.en;
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    const userId = message.author.id;
    const guildId = message.guild?.id;
    const now = Date.now();
    const channelName = message.channel.name;

    // Update activity
    userActivity.set(userId, now);

    // AI Support for Ticket Channels & AI-Support Channel
    const isTicketChannel = channelName.startsWith('ticket-');
    const isAISupportChannel = channelName === 'ai-support' || channelName.includes('ai-support');
    
    if (isTicketChannel || isAISupportChannel) {
      // Get cooldown key
      const cooldownKey = isTicketChannel ? `ticket-${message.channel.id}` : `ai-support-${message.channel.id}`;
      const lastResponse = aiResponseCooldown.get(cooldownKey) || 0;
      const timeSinceResponse = now - lastResponse;

      // Only respond if it's been at least 15 seconds since last AI response (avoid spam)
      if (timeSinceResponse > 15000) {
        let context = 'general support';
        
        // If it's a ticket channel, get ticket info
        if (isTicketChannel) {
          for (const [id, t] of tickets) {
            if (t.channelId === message.channel.id && t.status === 'open') {
              context = `ticket subject: ${t.subject}`;
              break;
            }
          }
        }

        const aiResponse = await generateSupportResponse(message.content, context);

        const embed = new EmbedBuilder()
          .setTitle('🤖 Toolmetry AI Support')
          .setDescription(aiResponse)
          .setColor(0x00D4AA)
          .setFooter({ text: 'Powered by AI • Toolmetry Support' })
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        aiResponseCooldown.set(cooldownKey, now);
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
