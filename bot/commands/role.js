const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Manage user roles')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a role to a user')
        .addUserOption(option => option.setName('user').setDescription('User').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('Role to add').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a role from a user')
        .addUserOption(option => option.setName('user').setDescription('User').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('Role to remove').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('all')
        .setDescription('Add/remove a role from all members')
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Action')
            .setRequired(true)
            .addChoices(
              { name: 'Add', value: 'add' },
              { name: 'Remove', value: 'remove' }
            ))
        .addRoleOption(option => option.setName('role').setDescription('Role').setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'add') {
      const user = interaction.options.getUser('user');
      const role = interaction.options.getRole('role');
      const member = await interaction.guild.members.fetch(user.id);

      if (member.roles.cache.has(role.id)) {
        return interaction.reply({ content: `${user.tag} already has this role.`, ephemeral: true });
      }
      if (role.position >= interaction.member.roles.highest.position) {
        return interaction.reply({ content: 'You cannot assign this role.', ephemeral: true });
      }

      await member.roles.add(role);

      const embed = new EmbedBuilder()
        .setTitle('✅ Role Added')
        .setDescription(`Added ${role.name} to ${user.tag}`)
        .setColor(role.color || 0x00ff00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'remove') {
      const user = interaction.options.getUser('user');
      const role = interaction.options.getRole('role');
      const member = await interaction.guild.members.fetch(user.id);

      if (!member.roles.cache.has(role.id)) {
        return interaction.reply({ content: `${user.tag} doesn't have this role.`, ephemeral: true });
      }
      if (role.position >= interaction.member.roles.highest.position) {
        return interaction.reply({ content: 'You cannot remove this role.', ephemeral: true });
      }

      await member.roles.remove(role);

      const embed = new EmbedBuilder()
        .setTitle('✅ Role Removed')
        .setDescription(`Removed ${role.name} from ${user.tag}`)
        .setColor(role.color || 0xff0000)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'all') {
      const action = interaction.options.getString('action');
      const role = interaction.options.getRole('role');

      if (role.position >= interaction.member.roles.highest.position) {
        return interaction.reply({ content: 'You cannot manage this role.', ephemeral: true });
      }

      await interaction.deferReply();

      const members = await interaction.guild.members.fetch();
      let count = 0;

      for (const [id, member] of members) {
        try {
          if (action === 'add' && !member.roles.cache.has(role.id)) {
            await member.roles.add(role);
            count++;
          } else if (action === 'remove' && member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
            count++;
          }
        } catch {}
      }

      const embed = new EmbedBuilder()
        .setTitle(`✅ Role ${action === 'add' ? 'Added' : 'Removed'}`)
        .setDescription(`${action === 'add' ? 'Added' : 'Removed'} ${role.name} ${action === 'add' ? 'to' : 'from'} ${count} members`)
        .setColor(role.color || 0x00ff00)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  }
};
