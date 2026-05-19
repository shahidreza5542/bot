const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('activity').setDescription('Server activity commands for fun engagement')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand => subcommand.setName('mention-all-joke').setDescription('Mention everyone with a random joke')
      .addChannelOption(option => option.setName('channel').setDescription('Channel to send').addChannelTypes(ChannelType.GuildText).setRequired(false)))
    .addSubcommand(subcommand => subcommand.setName('mention-all-msg').setDescription('Mention everyone with custom message')
      .addStringOption(option => option.setName('message').setDescription('Message to send').setRequired(true))
      .addChannelOption(option => option.setName('channel').setDescription('Channel to send').addChannelTypes(ChannelType.GuildText).setRequired(false)))
    .addSubcommand(subcommand => subcommand.setName('fun-fact').setDescription('Send a fun fact to everyone')
      .addChannelOption(option => option.setName('channel').setDescription('Channel to send').addChannelTypes(ChannelType.GuildText).setRequired(false))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "Why did the scarecrow win an award? He was outstanding in his field!",
      "What do you call a fake noodle? An impasta!",
      "Why did the bicycle fall over? It was two tired!",
      "What do you call a bear with no teeth? A gummy bear!",
      "Why don't skeletons fight each other? They don't have the guts!",
      "What did the ocean say to the beach? Nothing, it just waved!"
    ];

    const facts = [
      "Honey never spoils! Archaeologists found 3000-year-old honey in Egyptian tombs that was still edible.",
      "Octopuses have three hearts, blue blood, and nine brains!",
      "Bananas are berries, but strawberries aren't!",
      "A day on Venus is longer than a year on Venus!",
      "The Eiffel Tower can be 15 cm taller during the summer due to heat expansion!",
      "A group of flamingos is called a 'flamboyance'!",
      "Cows have best friends and get stressed when they're separated!",
      "The shortest war in history lasted only 38 minutes!",
      "A jiffy is an actual unit of time - 1/100th of a second!",
      "Wombat poop is cube-shaped!"
    ];

    if (subcommand === 'mention-all-joke') {
      const joke = jokes[Math.floor(Math.random() * jokes.length)];
      const embed = new EmbedBuilder().setTitle('Joke Time!').setDescription(`**${joke}**`).setColor(0xFFD700).setFooter({ text: `Joke by ${interaction.user.tag}` }).setTimestamp();
      await targetChannel.send({ embeds: [embed], content: '@everyone' });
      await interaction.reply({ content: `Joke sent to ${targetChannel}`, ephemeral: true });
    } else if (subcommand === 'mention-all-msg') {
      const message = interaction.options.getString('message');
      await targetChannel.send({ content: `@everyone ${message}` });
      await interaction.reply({ content: `Message sent to ${targetChannel}`, ephemeral: true });
    } else if (subcommand === 'fun-fact') {
      const fact = facts[Math.floor(Math.random() * facts.length)];
      const embed = new EmbedBuilder().setTitle('Did You Know?').setDescription(`**${fact}**`).setColor(0x4F46E5).setFooter({ text: `Fact shared by ${interaction.user.tag}` }).setTimestamp();
      await targetChannel.send({ embeds: [embed] });
      await interaction.reply({ content: `Fun fact sent to ${targetChannel}`, ephemeral: true });
    }
  }
};
