const axios = require('axios');

const NEKOS_BASE = 'https://nekos.best/api/v2';


const categoryMap = {
  hug: 'hug',
  slap: 'slap',
  kiss: 'kiss',
  pat: 'pat',
  cuddle: 'cuddle',
  poke: 'poke',
  feed: 'feed',
  bite: 'bite',
  dance: 'dance',
  wave: 'wave',
  highfive: 'highfive',
  tickle: 'tickle',
  blush: 'blush',
  smile: 'happy',
  kick: 'kick',
  handhold: 'holdhand',
  nom: 'nom',
  smug: 'smug',
  stare: 'stare',
  think: 'think',
  wink: 'wink',
  cringe: 'cringe',
  cry: 'cry',
  pout: 'pout',
  shoot: 'shoot',
  shrug: 'shrug',
  sleep: 'sleep',
  laugh: 'laugh',
  punch: 'punch',
  snuggle: 'snuggle',
  glomp: 'glomp',
  peck: 'peck',
  lick: 'lick',
  nuzzle: 'nuzzle'
};

// Fallback GIF URLs in case API is down
const fallbackGifs = {
  hug: [
    'https://nekos.best/api/v2/hug/0c0095a3-d0f5-4b4d-a33a-1e6b6e85e4ef.gif',
    'https://nekos.best/api/v2/hug/0c6cd3e3-4441-4a4d-a5dc-d9e31e0e0ef0.gif'
  ],
  slap: [
    'https://nekos.best/api/v2/slap/00cc4b13-7d0e-4f47-8a90-a6e6c2e5c0ea.gif',
    'https://nekos.best/api/v2/slap/00e4ee4e-7b1e-4a3d-a8a0-f5279d15e570.gif'
  ],
  kiss: [
    'https://nekos.best/api/v2/kiss/00e4ee4e-7b1e-4a3d-a8a0-f5279d15e570.gif',
    'https://nekos.best/api/v2/kiss/0c0095a3-d0f5-4b4d-a33a-1e6b6e85e4ef.gif'
  ],
  pat: [
    'https://nekos.best/api/v2/pat/00cc4b13-7d0e-4f47-8a90-a6e6c2e5c0ea.gif',
    'https://nekos.best/api/v2/pat/0c6cd3e3-4441-4a4d-a5dc-d9e31e0e0ef0.gif'
  ],
  cuddle: [
    'https://nekos.best/api/v2/cuddle/00cc4b13-7d0e-4f47-8a90-a6e6c2e5c0ea.gif',
    'https://nekos.best/api/v2/cuddle/0c6cd3e3-4441-4a4d-a5dc-d9e31e0e0ef0.gif'
  ],
  poke: [
    'https://nekos.best/api/v2/poke/00cc4b13-7d0e-4f47-8a90-a6e6c2e5c0ea.gif'
  ],
  feed: [
    'https://nekos.best/api/v2/feed/00cc4b13-7d0e-4f47-8a90-a6e6c2e5c0ea.gif'
  ],
  bite: [
    'https://nekos.best/api/v2/bite/00cc4b13-7d0e-4f47-8a90-a6e6c2e5c0ea.gif'
  ],
  dance: [
    'https://nekos.best/api/v2/dance/00cc4b13-7d0e-4f47-8a90-a6e6c2e5c0ea.gif'
  ],
  wave: [
    'https://nekos.best/api/v2/wave/00cc4b13-7d0e-4f47-8a90-a6e6c2e5c0ea.gif'
  ],
  highfive: [
    'https://nekos.best/api/v2/highfive/00cc4b13-7d0e-4f47-8a90-a6e6c2e5c0ea.gif'
  ],
  tickle: [
    'https://nekos.best/api/v2/tickle/00cc4b13-7d0e-4f47-8a90-a6e6c2e5c0ea.gif'
  ],
  blush: [
    'https://nekos.best/api/v2/blush/00cc4b13-7d0e-4f47-8a90-a6e6c2e5c0ea.gif'
  ],
  smile: [
    'https://nekos.best/api/v2/happy/00cc4b13-7d0e-4f47-8a90-a6e6c2e5c0ea.gif'
  ],
  kick: [
    'https://nekos.best/api/v2/kick/00cc4b13-7d0e-4f47-8a90-a6e6c2e5c0ea.gif'
  ]
};

/**
 * Fetch a random GIF from nekos.best API v2
 * @param {string} type - The type of GIF (hug, slap, kiss, pat, etc.)
 * @returns {Promise<string>} - URL of the GIF
 */
async function fetchGif(type) {
  try {
    // Map our gifType to nekos.best category
    const category = categoryMap[type] || type;

    const response = await axios.get(`${NEKOS_BASE}/${category}`, {
      params: { amount: 1 },
      timeout: 8000
    });

    // nekos.best v2 returns { results: [{ url: "...", anime_name: "..." }] }
    if (response.data && response.data.results && response.data.results.length > 0) {
      const gifUrl = response.data.results[0].url;
      if (gifUrl) return gifUrl;
    }

    // If API returns unexpected format, use fallback
    console.warn(`nekos.best: Unexpected response format for "${type}", using fallback`);
    return getRandomFallback(type);
  } catch (error) {
    console.error(`nekos.best GIF API Error for "${type}":`, error.message);
    return getRandomFallback(type);
  }
}

/**
 * Get a random fallback GIF
 * @param {string} type - The type of GIF
 * @returns {string} - URL of the fallback GIF
 */
function getRandomFallback(type) {
  const gifs = fallbackGifs[type];
  if (gifs && gifs.length > 0) {
    return gifs[Math.floor(Math.random() * gifs.length)];
  }
  // Generic fallback - use a nekos.best hug as safe default
  return 'https://nekos.best/api/v2/hug/0c0095a3-d0f5-4b4d-a33a-1e6b6e85e4ef.gif';
}

/**
 * Create an action embed with a random GIF
 * @param {object} options - Embed options
 * @param {string} options.title - Embed title (e.g. "🤗 Hug!")
 * @param {string} options.description - Embed description
 * @param {number} options.color - Embed color
 * @param {string} options.gifType - Type of GIF to fetch
 * @param {string} options.footerText - Footer text
 * @returns {Promise<EmbedBuilder>}
 */
async function createActionEmbed({ title, description, color, gifType, footerText }) {
  const { EmbedBuilder } = require('discord.js');
  const gifUrl = await fetchGif(gifType);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setImage(gifUrl)
    .setColor(color)
    .setFooter({ text: footerText || 'Toolmetry AI Bot' })
    .setTimestamp();

  return embed;
}

module.exports = { fetchGif, createActionEmbed, fallbackGifs, categoryMap };
