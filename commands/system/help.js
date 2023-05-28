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
  category: 'system',
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    const commandGiven = interaction.options.getString('command');
    const embedHelp = {
      title: 'Help',
      color: 0x02C08B,
      description: '*Some commands might not be accessible to you.\nIf you think this is a mistake, contact an admin.*',
      fields: []
    } ;

    // console.log (interaction.client.commands) ;

    if (commandGiven === null) {
      interaction.client.commands.forEach((command, name) => {
        embedHelp.fields.push({name: `/${command.data.name}`, value: command.data.description}) ;
      }) ;
    } else {
      const command = interaction.client.commands.get(commandGiven) ;
      if (!command) {
        embedHelp.fields.push({name: `/${commandGiven}`, value: ':x: No command found'}) ;
      } else {
        embedHelp.title = command.data.name.toProperCase();
        embedHelp.description = command.data.description ;
        for (const option of command.data.options) {
          var line = '' ;
            console.log (option);
          if (Array.isArray(option.options) && option.options.length) {
            option.options.forEach(op => {
              line += ` ${op.required ? '' : '['}<${op.name}>${op.required ? '' : ']'}` ;
            }) ;
          }
          embedHelp.fields.push({name: `/${command.data.name} ${(option.type > 2) ? option.required ? `<${option.name}>` : `[<${option.name}>]` : option.name} ${line}`, value: option.description}) ;
        }
        if (! embedHelp.fields.length) {
          embedHelp.fields.push({name: `/${command.data.name}`, value: command.data.description}) ;
        }

      }
    }
    await interaction.editReply({embeds: [embedHelp]});
  }
}