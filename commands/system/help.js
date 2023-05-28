const { SlashCommandBuilder, codeBlock } = require('discord.js');
const fs = require('node:fs') ;
const path = require('node:path');


const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display help for the bot')
    .setDMPermission(false)
    ;

module.exports = {
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    // Reading the commands
    const foldersPath = path.join(__dirname, '..');
    // console.log (foldersPath) ;
    const commandFolders = fs.readdirSync(foldersPath);
    // console.log (commandFolders) ;
    let message = '' ;
    let maxLength = 0 ;
    const allFields = new Map() ;
    for (const folder of commandFolders) {
      const commandsPath = path.join(foldersPath, folder);
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
      // message += `== ${folder.toUpperCase()} ==\n` ;
      const commandsFields = [] ;
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command) {
          // message += `${command.data.name} :: ${command.data.description}\n` ;
          // console.log (command.data) ;
          maxLength = Math.max(maxLength, command.data.name.length);
          commandsFields.push({
            name: command.data.name,
            description: command.data.description
          });
        }
      }
      allFields.set (folder, commandsFields);
    }
    // console.log(maxLength) ;
    // console.log(allFields) ;
    allFields.forEach((commandsFields, folder) => {
      // console.log (folder) ;
      // console.log (commandsFields) ;
      message += `\n== ${folder.toProperCase()} ==\n` ;
      for (const command of commandsFields) {
        message += `${command.name}${" ".repeat(maxLength - command.name.length)} :: ${command.description}\n` ;
      }
    }) ;
    const messageContent = codeBlock ("asciidoc", 
    `=== Command List ===\n${message}`
    );
    await interaction.editReply(messageContent);
  }
}