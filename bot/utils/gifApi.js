const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

const NEKOS_BASE = 'https://nekos.best/api/v2';
const PURRBOT_BASE = 'https://api.purrbot.site/v2/img/sfw';

const nekosCategoryMap = {
  hug: 'hug', slap: 'slap', kiss: 'kiss', pat: 'pat',
  cuddle: 'cuddle', poke: 'poke', feed: 'feed', bite: 'bite',
  dance: 'dance', wave: 'wave', highfive: 'highfive', tickle: 'tickle',
  blush: 'blush', smile: 'happy', kick: 'kick', cry: 'cry',
  pout: 'pout', lick: 'lick', smug: 'smug', stare: 'stare',
  wink: 'wink', think: 'think', shrug: 'shrug', sleep: 'sleep',
  cringe: 'cringe', shoot: 'shoot', laugh: 'laugh', punch: 'punch',
  snuggle: 'snuggle', glomp: 'glomp', peck: 'peck', nuzzle: 'nuzzle',
  nom: 'nom', handhold: 'holdhand'
};

const purrbotCategoryMap = {
  hug: 'hug', slap: 'slap', kiss: 'kiss', pat: 'pat',
  cuddle: 'cuddle', poke: 'poke', feed: 'feed', bite: 'bite',
  dance: 'dance', tickle: 'tickle', blush: 'blush', smile: 'smile',
  cry: 'cry', pout: 'pout', lick: 'lick'
};

const fallbackGifs = {
  hug: ['https://cdn.purrbot.site/sfw/hug/gif/hug_028.gif', 'https://cdn.purrbot.site/sfw/hug/gif/hug_014.gif', 'https://cdn.purrbot.site/sfw/hug/gif/hug_040.gif'],
  slap: ['https://cdn.purrbot.site/sfw/slap/gif/slap_014.gif', 'https://cdn.purrbot.site/sfw/slap/gif/slap_025.gif'],
  kiss: ['https://cdn.purrbot.site/sfw/kiss/gif/kiss_029.gif', 'https://cdn.purrbot.site/sfw/kiss/gif/kiss_015.gif'],
  pat: ['https://cdn.purrbot.site/sfw/pat/gif/pat_064.gif', 'https://cdn.purrbot.site/sfw/pat/gif/pat_030.gif'],
  cuddle: ['https://cdn.purrbot.site/sfw/cuddle/gif/cuddle_040.gif', 'https://cdn.purrbot.site/sfw/cuddle/gif/cuddle_025.gif'],
  poke: ['https://cdn.purrbot.site/sfw/poke/gif/poke_025.gif', 'https://cdn.purrbot.site/sfw/poke/gif/poke_010.gif'],
  feed: ['https://cdn.purrbot.site/sfw/feed/gif/feed_006.gif', 'https://cdn.purrbot.site/sfw/feed/gif/feed_003.gif'],
  bite: ['https://cdn.purrbot.site/sfw/bite/gif/bite_007.gif', 'https://cdn.purrbot.site/sfw/bite/gif/bite_003.gif'],
  dance: ['https://cdn.purrbot.site/sfw/dance/gif/dance_013.gif', 'https://cdn.purrbot.site/sfw/dance/gif/dance_025.gif'],
  wave: ['https://cdn.purrbot.site/sfw/pat/gif/pat_064.gif'],
  highfive: ['https://cdn.purrbot.site/sfw/hug/gif/hug_028.gif'],
  tickle: ['https://cdn.purrbot.site/sfw/tickle/gif/tickle_013.gif', 'https://cdn.purrbot.site/sfw/tickle/gif/tickle_025.gif'],
  blush: ['https://cdn.purrbot.site/sfw/blush/gif/blush_022.gif', 'https://cdn.purrbot.site/sfw/blush/gif/blush_010.gif'],
  smile: ['https://cdn.purrbot.site/sfw/smile/gif/smile_006.gif', 'https://cdn.purrbot.site/sfw/smile/gif/smile_015.gif'],
  kick: ['https://cdn.purrbot.site/sfw/slap/gif/slap_014.gif'],
  cry: ['https://cdn.purrbot.site/sfw/cry/gif/cry_010.gif', 'https://cdn.purrbot.site/sfw/cry/gif/cry_025.gif'],
  pout: ['https://cdn.purrbot.site/sfw/pout/gif/pout_010.gif', 'https://cdn.purrbot.site/sfw/pout/gif/pout_025.gif'],
  lick: ['https://cdn.purrbot.site/sfw/lick/gif/lick_010.gif', 'https://cdn.purrbot.site/sfw/lick/gif/lick_025.gif']
};

async function fetchFromNekosBest(type) {
  const category = nekosCategoryMap[type] || type;
  const response = await axios.get(`${NEKOS_BASE}/${category}`, { params: { amount: 1 }, timeout: 6000 });
  if (response.data?.results?.length > 0 && response.data.results[0].url) {
    return response.data.results[0].url;
  }
  return null;
}

async function fetchFromPurrbot(type) {
  const category = purrbotCategoryMap[type];
  if (!category) return null;
  const response = await axios.get(`${PURRBOT_BASE}/${category}/gif`, { timeout: 6000 });
  if (response.data?.link && !response.data.error) return response.data.link;
  return null;
}

function getRandomFallback(type) {
  const gifs = fallbackGifs[type];
  if (gifs && gifs.length > 0) return gifs[Math.floor(Math.random() * gifs.length)];
  return 'https://cdn.purrbot.site/sfw/hug/gif/hug_028.gif';
}

async function fetchGif(type) {
  try {
    const url = await fetchFromNekosBest(type);
    if (url) return url;
  } catch (error) {
    console.warn(`GIF nekos.best failed "${type}": ${error.message}`);
  }

  try {
    const url = await fetchFromPurrbot(type);
    if (url) return url;
  } catch (error) {
    console.warn(`GIF purrbot failed "${type}": ${error.message}`);
  }

  return getRandomFallback(type);
}

async function createActionEmbed({ title, description, color, gifType, footerText }) {
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

module.exports = { fetchGif, createActionEmbed };
