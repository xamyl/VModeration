const fs = require('fs');
const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const prefix = 'v';

// Define commands and their aliases
const commands = {
  kick: ['vkick'],
  ban: ['vban'],
  mute: ['vmute'],
  unban: ['vunban'],
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const inputCommand = args.shift().toLowerCase();

  // Resolve the actual command from aliases
  const command = Object.keys(commands).find((key) => commands[key].includes(inputCommand));

  if (command === 'kick') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      return message.reply('You do not have permission to kick members.');
    }
    const user = message.mentions.members.first();
    if (!user) return message.reply('Please mention a user to kick.');
    if (!user.kickable) return message.reply('I cannot kick this user.');
    try {
      await user.kick();
      message.channel.send(`${user.user.tag} has been kicked.`);
    } catch (error) {
      console.error(error);
      message.reply('An error occurred while trying to kick the user.');
    }
  }

  if (command === 'ban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('You do not have permission to ban members.');
    }
    const user = message.mentions.members.first();
    if (!user) return message.reply('Please mention a user to ban.');
    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!user.bannable) return message.reply('I cannot ban this user.');
    try {
      await user.ban({ reason });
      message.channel.send(`${user.user.tag} has been banned for: **${reason}**.`);
      try {
        await user.user.send(`You have been banned from **${message.guild.name}** for reason: **${reason}**.`);
      } catch (dmError) {
        console.error('Failed to send DM:', dmError);
        message.channel.send('Could not send a DM to the banned user.');
      }
    } catch (error) {
      console.error(error);
      message.reply('An error occurred while trying to ban the user.');
    }
  }

  if (command === 'mute') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return message.reply('You do not have permission to mute members.');
    }
    const user = message.mentions.members.first();
    if (!user) return message.reply('Please mention a user to mute.');
    const duration = parseInt(args[0]);
    if (isNaN(duration)) return message.reply('Please specify a duration in minutes.');
    try {
      await user.timeout(duration * 60 * 1000); // Duration in milliseconds
      message.channel.send(`${user.user.tag} has been muted for ${duration} minute(s).`);
    } catch (error) {
      console.error(error);
      message.reply('An error occurred while trying to mute the user.');
    }
  }

  if (command === 'unban') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return message.reply('You do not have permission to unban members.');
    }
    const userId = args[0];
    if (!userId) return message.reply('Please provide the user ID to unban.');
    try {
      await message.guild.members.unban(userId);
      message.channel.send(`User with ID ${userId} has been unbanned.`);
    } catch (error) {
      console.error(error);
      message.reply('An error occurred while trying to unban the user.');
    }
  }

  if (inputCommand === 'help') {
    message.channel.send(
      'Available commands:\n' +
        '`vhelp` - Displays this message\n' +
        '`vk / vkick @user` - Kicks a user\n' +
        '`vb / vban @user [reason]` - Bans a user with a reason\n' +
        '`vm / vmute @user [duration in minutes]` - Mutes a user for the specified duration\n' +
        '`vmember` - Displays the total number of members in the server\n' +
        '`vu / vunban [user ID]` - Unbans a user by their ID\n' +
        '`vtop` - Shows the top message senders in the server\n' +
        '`vtope` - Shows the most commonly used emojis in the server'
    );
  }
});

client.login(process.env.TOKEN);
