require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️  Skipping ${file} — missing "data" or "execute" export.`);
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
      throw new Error('DISCORD_TOKEN and CLIENT_ID must be set in .env before deploying commands.');
    }

    console.log(`Deploying ${commands.length} application (/) commands...`);

    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID);

    const data = await rest.put(route, { body: commands });

    console.log(`✅ Successfully registered ${data.length} commands${process.env.GUILD_ID ? ` to guild ${process.env.GUILD_ID}` : ' globally'}.`);
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
    process.exit(1);
  }
})();
