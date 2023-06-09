// Require System
const fs = require('node:fs') ;
const path = require('node:path');
// Require Database
// const Sequelize = require('sequelize');
const {Personnage, Item, Inventory, Availability} = require('./dbObjects.js');
// Require Discord
const { Client, Events, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config.json');
const { Console } = require('node:console');

// Create a new client instance
const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMembers,
] ;
const client = new Client({ intents });
// Require usefull methods
require("./modules/functions.js")(client);

client.commands = new Collection();

// Reading the commands
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Readint the events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
// console.log(eventFiles);
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  // console.log(event);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Log in to Discord with your client's token
client.login(config.token);
