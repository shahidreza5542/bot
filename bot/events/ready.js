const { ActivityType } = require('discord.js');
const cron = require('node-cron');
const Guild = require('../../models/Guild');
const Level = require('../../models/Level');
const Parser = require('rss-parser');

const parser = new Parser();

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    console.log(`Bot logged in as ${client.user.tag}`);
    
    // Set bot activity
    client.user.setActivity('/help | Toolmetry AI Bot', {
      type: ActivityType.Playing
    });

    // Check for expired bans every minute
    cron.schedule('* * * * *', async () => {
      await checkExpiredBans(client);
    });

    // Check YouTube notifications every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await checkYouTubeNotifications(client);
    });

    // Save guilds to database
    await syncGuilds(client);

    console.log('Bot is fully ready!');
  }
};

async function checkExpiredBans(client) {
  try {
    const Ban = require('../../models/Ban');
    const expiredBans = await Ban.find({
      active: true,
      type: 'tempban',
      expiresAt: { $lte: new Date() }
    });

    for (const ban of expiredBans) {
      try {
        const guild = client.guilds.cache.get(ban.guildId);
        if (guild) {
          await guild.members.unban(ban.userId, 'Temporary ban expired');
        }

        ban.active = false;
        ban.unbannedAt = new Date();
        ban.unbanReason = 'Temporary ban expired';
        await ban.save();
      } catch (err) {
        console.error('Error unbanning user:', err);
      }
    }
  } catch (err) {
    console.error('Error checking expired bans:', err);
  }
}

async function checkYouTubeNotifications(client) {
  try {
    const guilds = await Guild.find({ 'youtube.enabled': true });

    for (const guild of guilds) {
      try {
        if (!guild.youtube?.channelId) continue;

        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${guild.youtube.channelId}`;
        const feed = await parser.parseURL(feedUrl);

        if (!feed.items || feed.items.length === 0) continue;

        const latestVideo = feed.items[0];
        const latestVideoId = latestVideo.link?.split('v=')[1];

        if (latestVideoId && latestVideoId !== guild.youtube.lastVideoId) {
          // New video detected
          const discordGuild = client.guilds.cache.get(guild.guildId);
          if (!discordGuild) continue;

          const channel = discordGuild.channels.cache.get(guild.youtube.discordChannelId);
          if (!channel) continue;

          const message = guild.youtube.message
            .replace('{channel}', feed.title)
            .replace('{title}', latestVideo.title)
            .replace('{url}', latestVideo.link);

          await channel.send(message);

          // Update last video ID
          guild.youtube.lastVideoId = latestVideoId;
          await guild.save();
        }
      } catch (err) {
        console.error(`Error checking YouTube for guild ${guild.guildId}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error checking YouTube notifications:', err);
  }
}

async function syncGuilds(client) {
  try {
    for (const [guildId, discordGuild] of client.guilds.cache) {
      let guild = await Guild.findOne({ guildId });
      
      if (!guild) {
        guild = new Guild({
          guildId,
          name: discordGuild.name,
          icon: discordGuild.icon,
          ownerId: discordGuild.ownerId
        });
        await guild.save();
        console.log(`Added guild to database: ${discordGuild.name}`);
      } else {
        // Update guild info
        guild.name = discordGuild.name;
        guild.icon = discordGuild.icon;
        guild.ownerId = discordGuild.ownerId;
        await guild.save();
      }
    }
  } catch (err) {
    console.error('Error syncing guilds:', err);
  }
}
