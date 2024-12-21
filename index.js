const { Client, GatewayIntentBits, REST, Routes, PermissionsBitField, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const commands = [
  {
    name: 'kick',
    description: 'Kick a user from the server',
    options: [
      {
        name: 'user',
        type: 6,
        description: 'The user to kick',
        required: true,
      },
    ],
  },
  {
    name: 'ban',
    description: 'Ban a user from the server',
    options: [
      {
        name: 'user',
        type: 6,
        description: 'The user to ban',
        required: true,
      },
      {
        name: 'reason',
        type: 3,
        description: 'The reason for the ban',
        required: true,
      },
    ],
  },
  {
    name: 'unban',
    description: 'Unban a user from the server',
    options: [
      {
        name: 'userid',
        type: 3,
        description: 'The ID of the user to unban',
        required: true,
      },
    ],
  },
  {
    name: 'mute',
    description: 'Mute a user for a specific duration',
    options: [
      {
        name: 'user',
        type: 6,
        description: 'The user to mute',
        required: true,
      },
      {
        name: 'duration',
        type: 4,
        description: 'The duration of the mute in minutes',
        required: true,
      },
    ],
  },
  {
    name: 'membercount',
    description: 'Displays the total number of members in the server',
  },
];

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'kick') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return interaction.reply('You do not have permission to kick members.');
    }
    const user = options.getMember('user');
    if (!user) return interaction.reply('User not found.');
    if (!user.kickable) return interaction.reply('I cannot kick this user.');
    try {
      await user.kick();
      interaction.reply(`${user.user.tag} has been kicked.`);
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while trying to kick the user.');
    }
  }

  if (commandName === 'ban') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply('You do not have permission to ban members.');
    }
    const user = options.getMember('user');
    const reason = options.getString('reason');
    if (!user) return interaction.reply('User not found.');
    if (!user.bannable) return interaction.reply('I cannot ban this user.');
    try {
      await user.ban({ reason });
      interaction.reply(`${user.user.tag} has been banned for: **${reason}**.`);
      try {
        await user.user.send(`You have been banned from **${interaction.guild.name}** for reason: **${reason}**.`);
      } catch (dmError) {
        console.error('Failed to send DM:', dmError);
        interaction.followUp('Could not send a DM to the banned user.');
      }
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while trying to ban the user.');
    }
  }

  if (commandName === 'unban') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply('You do not have permission to unban members.');
    }
    const userId = options.getString('userid');
    try {
      await interaction.guild.members.unban(userId);
      interaction.reply(`User with ID ${userId} has been unbanned.`);
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while trying to unban the user.');
    }
  }

  if (commandName === 'mute') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply('You do not have permission to mute members.');
    }
    const user = options.getMember('user');
    const duration = options.getInteger('duration');
    if (!user) return interaction.reply('User not found.');
    try {
      await user.timeout(duration * 60 * 1000);
      interaction.reply(`${user.user.tag} has been muted for ${duration} minute(s).`);
    } catch (error) {
      console.error(error);
      interaction.reply('An error occurred while trying to mute the user.');
    }
  }

  if (commandName === 'membercount') {
    interaction.reply(`This server has ${interaction.guild.memberCount} members.`);
  }
});

client.login(process.env.TOKEN);
