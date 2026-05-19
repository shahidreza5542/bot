const { EmbedBuilder } = require('discord.js');
const { levelStorage } = require('../utils/localStorage');

let knowledgeBase = {};
try {
  knowledgeBase = require('../data/traindata.json').knowledgeBase;
} catch (err) {
  console.error('Could not load traindata.json:', err.message);
}

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'toolmetryai@gmail.com';
const fallbackResponse = `I'm not sure about that specific query. Let me tag our support team to help you!\n\nMeanwhile, you can check our Help Center or email ${SUPPORT_EMAIL}`;

const userActivity = new Map();
const lastRoasted = new Map();
const aiResponseCooldown = new Map();
const userMessageTracker = new Map();
const unknownQueryTracker = new Map();
const processedMessages = new Set();

const SPAM_CONFIG = {
  cooldownSeconds: 20,
  maxMessagesPerMinute: 3
};

const STAFF_ROLE_IDS = process.env.STAFF_ROLE_IDS ? process.env.STAFF_ROLE_IDS.split(',') : [];
const OWNER_ID = process.env.OWNER_ID || '';

setInterval(() => {
  processedMessages.clear();
}, 5 * 60 * 1000);

function matchQuery(message) {
  const msg = message.toLowerCase().trim();
  const words = msg.split(/\s+/);
  let bestMatch = null;
  let bestScore = 0;
  const CONFIDENCE_THRESHOLD = 0.7;

  for (const [key, data] of Object.entries(knowledgeBase)) {
    for (const pattern of data.patterns) {
      const patternLower = pattern.toLowerCase().trim();

      if (msg === patternLower) {
        return key;
      }

      if (msg.includes(patternLower) && patternLower.length > 3) {
        const score = patternLower.length / msg.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = key;
        }
      }

      const patternWords = patternLower.split(/\s+/);
      if (patternWords.length >= 2) {
        let matchedCount = 0;
        for (const pw of patternWords) {
          if (pw.length > 3 && words.includes(pw)) {
            matchedCount++;
          }
        }
        const score = matchedCount / patternWords.length;
        if (score >= CONFIDENCE_THRESHOLD && score > bestScore) {
          bestScore = score;
          bestMatch = key;
        }
      }
    }
  }

  return bestMatch;
}

function generateRoast(username) {
  const roasts = [
    "has been so quiet, we thought they were a ghost!",
    "is so inactive, even snails are racing past them!",
    "finally showed up! We missed your silence!",
    "must be practicing to be invisible!",
    "is so quiet, library rules don't apply to them!",
    "has mastered the art of ninja-level silence!"
  ];
  return roasts[Math.floor(Math.random() * roasts.length)];
}

function generateSupportResponse(userMessage) {
  const matchedKey = matchQuery(userMessage);

  if (matchedKey) {
    const response = knowledgeBase[matchedKey].responses.en || knowledgeBase[matchedKey].responses;
    return { response, isKnown: true };
  }

  return { response: fallbackResponse, isKnown: false };
}

function isUserSpamming(userId, channelId) {
  const now = Date.now();
  const key = `${userId}-${channelId}`;
  const userData = userMessageTracker.get(key) || { count: 0, firstMessage: now };

  if (now - userData.firstMessage > 60000) {
    userData.count = 0;
    userData.firstMessage = now;
  }

  userData.count++;
  userMessageTracker.set(key, userData);

  return userData.count > SPAM_CONFIG.maxMessagesPerMinute;
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    const userId = message.author.id;
    const guildId = message.guild?.id;
    const now = Date.now();
    const channelName = message.channel.name;

    userActivity.set(userId, now);

    const isTicketChannel = channelName.startsWith('ticket-');
    const isAISupportChannel = channelName === 'ai-support' || channelName.includes('ai-support');

    if (isTicketChannel || isAISupportChannel) {
      if (processedMessages.has(message.id)) return;
      processedMessages.add(message.id);

      if (isUserSpamming(userId, message.channel.id)) return;

      const cooldownKey = `channel-${message.channel.id}`;
      const lastResponse = aiResponseCooldown.get(cooldownKey) || 0;
      const timeSinceResponse = now - lastResponse;

      if (timeSinceResponse > (SPAM_CONFIG.cooldownSeconds * 1000)) {
        const { response: aiResponse, isKnown } = generateSupportResponse(message.content);

        const unknownKey = `unknown-${message.channel.id}`;
        const lastUnknownTag = unknownQueryTracker.get(unknownKey) || 0;
        const shouldTagStaff = !isKnown && (now - lastUnknownTag > 300000);

        if (shouldTagStaff) {
          const mentions = [];
          if (OWNER_ID) mentions.push(`<@${OWNER_ID}>`);
          mentions.push(...STAFF_ROLE_IDS.map(id => `<@&${id}>`));
          const staffMentions = mentions.join(' ') || 'Support team needed!';

          const embed = new EmbedBuilder()
            .setTitle('AI Support')
            .setDescription(aiResponse)
            .setColor(0xFFA500)
            .setFooter({ text: 'AI Assistant | Staff has been notified' })
            .setTimestamp();

          await message.channel.send({ content: staffMentions, embeds: [embed] });
          unknownQueryTracker.set(unknownKey, now);
        } else {
          const embed = new EmbedBuilder()
            .setTitle('AI Support')
            .setDescription(aiResponse)
            .setColor(isKnown ? 0x00D4AA : 0xFFA500)
            .setFooter({ text: isKnown ? 'Powered by AI' : 'AI Assistant | Contact staff if needed' })
            .setTimestamp();

          await message.channel.send({ embeds: [embed] });
        }

        aiResponseCooldown.set(cooldownKey, now);
      }
    }

    if (message.guild && Math.random() < 0.1) {
      const members = await message.guild.members.fetch();
      const inactiveUsers = [];

      for (const [memberId, member] of members) {
        if (member.user.bot || memberId === userId) continue;

        const lastActive = userActivity.get(memberId);
        const lastRoast = lastRoasted.get(memberId) || 0;

        if (lastActive && (now - lastActive) > 30 * 60 * 1000 && (now - lastRoast) > 2 * 60 * 60 * 1000) {
          inactiveUsers.push(member);
        }
      }

      if (inactiveUsers.length > 0) {
        const target = inactiveUsers[Math.floor(Math.random() * inactiveUsers.length)];
        const roastText = generateRoast(target.user.username);

        const embed = new EmbedBuilder()
          .setTitle('Inactivity Roast!')
          .setDescription(`${target.user} ${roastText}`)
          .setColor(0xFF4500)
          .setFooter({ text: 'Toolmetry AI Bot' })
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        lastRoasted.set(target.user.id, now);
      }
    }

    if (message.guild) {
      const key = `xp-${message.guild.id}-${userId}`;
      const currentData = levelStorage.get(key);
      const gainedXP = Math.floor(Math.random() * 10) + 5;
      const xpNeeded = 5 * Math.pow(currentData.level, 2) + 50 * currentData.level + 100;
      let newLevel = currentData.level;
      let newXP = currentData.xp + gainedXP;
      let newMessages = (currentData.messages || 0) + 1;

      if (newXP >= xpNeeded) {
        newLevel++;
        newXP = newXP - xpNeeded;
      }

      levelStorage.set(key, { level: newLevel, xp: newXP, messages: newMessages });
    }
  }
};
