const axios = require('axios');

/**
 * Free GIF API using waifu.pics
 * No API key required, no rate limits
 * Supports: hug, slap, kiss, pat, cuddle, poke, feed, smug, wave, highfive, bite, dance, handhold, kick, lick, nom, stab, blush, smile, tickle
 */

const WAIFU_BASE = 'https://api.waifu.pics/sfw';

// Fallback GIF URLs in case API is down
const fallbackGifs = {
  hug: [
    'https://media.giphy.com/media/od5H3PmEG5Ixn8aMXo/giphy.gif',
    'https://media.giphy.com/media/l4FGpPki5cw1T7gO0U/giphy.gif',
    'https://media.giphy.com/media/3M4NnpLt1L5yK9z94F/giphy.gif',
    'https://media.giphy.com/media/13YqdH3fbS5TE/giphy.gif',
    'https://media.giphy.com/media/PHB7K8Xw6yMq/giphy.gif'
  ],
  slap: [
    'https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif',
    'https://media.giphy.com/media/xT0BKiwgIPGJV3N7rG/giphy.gif',
    'https://media.giphy.com/media/3XlEk2RxPS1m8/giphy.gif',
    'https://media.giphy.com/media/GFs3op0M2sK64/giphy.gif'
  ],
  kiss: [
    'https://media.giphy.com/media/bGm9FuBCGg4SizxnC6/giphy.gif',
    'https://media.giphy.com/media/hnV5sMrb5YkF9NJNss/giphy.gif',
    'https://media.giphy.com/media/FqBTvSNjNzeZG/giphy.gif',
    'https://media.giphy.com/media/wOAl5Zdmot2M8/giphy.gif'
  ],
  pat: [
    'https://media.giphy.com/media/ARSp9T7wwxNFC/giphy.gif',
    'https://media.giphy.com/media/4HP0ddZnNVvKU/giphy.gif'
  ],
  cuddle: [
    'https://media.giphy.com/media/kDI1HhFMfSIt2/giphy.gif',
    'https://media.giphy.com/media/3ov9j安保jY0S/giphy.gif'
  ],
  poke: [
    'https://media.giphy.com/media/nGjHWLdgqKxbfLZ9CN/giphy.gif'
  ],
  feed: [
    'https://media.giphy.com/media/xT0BKkh0ZGRjMyjNNS/giphy.gif'
  ],
  bite: [
    'https://media.giphy.com/media/4Zo41lhzKt6iZ8xff9/giphy.gif'
  ],
  dance: [
    'https://media.giphy.com/media/l0MYt5jPR6QX5APm0/giphy.gif',
    'https://media.giphy.com/media/l4pTfx2qLszoacZRS/giphy.gif'
  ],
  wave: [
    'https://media.giphy.com/media/xUPGGDNsLvqsBOhuU0/giphy.gif'
  ],
  blush: [
    'https://media.giphy.com/media/tIeCLXB8sl5gI/giphy.gif'
  ],
  smile: [
    'https://media.giphy.com/media/Uzq7IgKZvSGuBrhS7F/giphy.gif'
  ],
  tickle: [
    'https://media.giphy.com/media/l0MYt5jPR6QX5APm0/giphy.gif'
  ],
  highfive: [
    'https://media.giphy.com/media/3oEjHV0z8S7WM4MwnK/giphy.gif'
  ],
  kick: [
    'https://media.giphy.com/media/l3V0lsGtTMSB5YNgc/giphy.gif'
  ]
};

/**
 * Fetch a random GIF from waifu.pics API
 * @param {string} type - The type of GIF (hug, slap, kiss, pat, etc.)
 * @returns {Promise<string>} - URL of the GIF
 */
async function fetchGif(type) {
  try {
    const response = await axios.get(`${WAIFU_BASE}/${type}`, {
      timeout: 5000
    });

    if (response.data && response.data.url) {
      return response.data.url;
    }

    // If API returns unexpected format, use fallback
    return getRandomFallback(type);
  } catch (error) {
    console.error(`GIF API Error for "${type}":`, error.message);
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
  // Generic fallback
  return 'https://media.giphy.com/media/3o7btNa0RUYa5E7iiQ/giphy.gif';
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

module.exports = { fetchGif, createActionEmbed, fallbackGifs };
