const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const roasts = [
  "You're like a cloud. When you disappear, it's a beautiful day.",
  "I'm not saying I hate you, but I would unplug your life support to charge my phone.",
  "You're not stupid; you just have bad luck thinking.",
  "I'd agree with you but then we'd both be wrong.",
  "You're the reason the gene pool needs a lifeguard.",
  "You're not dumb. You just have bad luck when it comes to thinking.",
  "I'm jealous of people who don't know you.",
  "You're like a penny. Two-faced and not worth much.",
  "I'd explain it to you, but I left my crayons at home.",
  "You're not the dumbest person in the world, but you better hope they don't die.",
  "I would have been your dad, but the dog beat me up the stairs.",
  "You're proof that evolution CAN go in reverse.",
  "Your family tree must be a cactus because everybody on it is a prick.",
  "You're as useless as the 'ueue' in 'queue'.",
  "You're not pretty enough to be this stupid.",
  "I bet your brain feels as good as new, seeing that you never use it.",
  "You're so dumb, you tripped over a wireless network.",
  "You're like a slinky. Not really good for much, but brings a smile when pushed down stairs.",
  "You have the right to remain silent because whatever you say will probably be stupid.",
  "I'd tell you to go outside, but you'd probably get lost in your own backyard."
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roast')
    .setDescription('Roast a user (all in good fun!)')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to roast')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const roast = roasts[Math.floor(Math.random() * roasts.length)];

    const embed = new EmbedBuilder()
      .setTitle('🔥 ROAST ALERT!')
      .setDescription(`${targetUser}, ${roast}`)
      .setColor(0xFF4500)
      .setFooter({ 
        text: `Roasted by ${interaction.user.tag} • Toolmetry AI Roast Master`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
