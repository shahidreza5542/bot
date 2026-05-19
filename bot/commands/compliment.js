const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const compliments = [
  "You're more fun than a ball pit filled with candy!",
  "You are brighter than the sun!",
  "You have the best laugh!",
  "You're like a warm blanket on a cold day!",
  "Your smile could light up the darkest room!",
  "You're the kind of person who makes the world better just by being in it!",
  "You're absolutely amazing, don't ever forget that!",
  "If you were a vegetable, you'd be a cute-cumber!",
  "You're proof that good things come in amazing packages!",
  "You're the reason people believe in the goodness of humanity!",
  "Your personality is as beautiful as your appearance!",
  "You have an incredible energy that everyone loves!",
  "You're the human equivalent of a warm hug!",
  "The world is a better place with you in it!",
  "You're like a shooting star - rare and beautiful!",
  "You make being awesome look so easy!",
  "You're a limited edition in a world of mass production!",
  "Your kindness is contagious!",
  "You're the kind of friend everyone wishes they had!",
  "You radiate positivity wherever you go!"
];

module.exports = {
  data: new SlashCommandBuilder().setName('compliment').setDescription('Send a compliment to someone')
    .addUserOption(option => option.setName('user').setDescription('User to compliment').setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const compliment = compliments[Math.floor(Math.random() * compliments.length)];

    if (targetUser.id === interaction.user.id) return interaction.reply({ content: `Self-compliment: ${compliment} You deserve it!`, ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('Compliment Time!')
      .setDescription(`<@${targetUser.id}>, ${compliment}`)
      .setColor(0xFF69B4)
      .setFooter({ text: `From @${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ content: `<@${targetUser.id}>`, embeds: [embed] });
  }
};
