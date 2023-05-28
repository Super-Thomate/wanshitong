const { SlashCommandBuilder, codeBlock } = require('discord.js');
const fs = require('node:fs') ;
const path = require('node:path');


const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display help for the bot')
    .addStringOption(option => 
      option
        .setName('command')
        .setDescription('Dissplay help for the command')
    )
    .setDMPermission(false)
    ;

module.exports = {
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    const commandGiven = interaction.options.getString('command');
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
        // message += `${command.data.name} :: ${command.data.description}\n` ;
        // console.log (JSON.stringify(command.data, null, 1)) ;
        maxLength = Math.max(maxLength, command.data.name.length);
        commandsFields.push(command.data);
      }
      allFields.set (folder, commandsFields);
    }
    const embedHelp = {
      title: 'Help',
      color: 0x02C08B,
      description: '*Some commands might not be accessible to you.\nIf you think this is a mistake, contact an admin.*',
      fields: []
    } ;
    // console.log(maxLength) ;
    // console.log(allFields) ;
    if (commandGiven === null) {
      allFields.forEach((commandsFields, folder) => {
        // console.log (folder) ;
        // console.log (commandsFields) ;

        // message += `\n== ${folder.toProperCase()} ==\n` ;
        // var message = '' ;
        for (const command of commandsFields) {
          embedHelp.fields.push({name: `/${command.name}`, value: command.description}) ;
          // message += `${command.name}${" ".repeat(maxLength - command.name.length)} :: ${command.description}\n` ;
        }
      }) ;
    } else {
      allFields.forEach((commandsFields, folder) => {
        // console.log (folder) ;
        // console.log (commandsFields) ;
        for (const command of commandsFields) {
          if (command.name === commandGiven) {
            embedHelp.title = command.name.toProperCase();
            embedHelp.description = command.description ;
            // const maxLength = 40 ;
            // console.log ('give character <characterid> [<member>]'.length);
            console.log (JSON.stringify(command, null, 2)) ;
            // message += `\n== ${command.name.toProperCase()} ==\n` ;
            for (const option of command.options) {
              var line = '' ;
              // var line = `${command.name} ${option.name}` ;
                console.log (option);
              if (Array.isArray(option.options) && option.options.length) {
                option.options.forEach(op => {
                  line += ` ${op.required ? '' : '['}${op.name}${op.required ? '' : ']'}` ;
                }) ;
              }
              embedHelp.fields.push({name: `/${command.name} ${(option.type > 2 && !option.required) ? '[' : ''}${option.name}${(option.type > 2 && !option.required) ? ']' : ''} ${line}`, value: option.description}) ;
              // message += `${line}${" ".repeat(Math.max(0, maxLength - line.length))} :: ${option.description}\n` ;
            }
            if (! embedHelp.fields.length) {
              embedHelp.fields.push({name: `/${command.name}`, value: command.description}) ;
            }
          }
        }
        if (! embedHelp.fields.length) {
          embedHelp.fields.push({name: `/${commandGiven}`, value: ':x: No command found'}) ;
        }
      }) ;

    }
    await interaction.editReply({embeds: [embedHelp]});
  }
}