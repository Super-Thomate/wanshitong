const { SlashCommandBuilder, codeBlock } = require('discord.js');
const {Blacklist} = require('../../dbObjects.js');
const { Op } = require("sequelize");

const commandToString = {
  'magic_8_ball': 'Magic 8 Ball',
  'game': 'Game'
} ;

const data = new SlashCommandBuilder()
    .setName('gameban')
    .setDescription('Manage blacklist')
    .addSubcommand(subcommand => 
      subcommand
        .setName('ban')
        .setDescription('Blacklist a user so they cannot claim any item. Don\'t forget to unban...')
        .addStringOption(option =>
          option.setName('command')
            .setDescription('The blacklisted command')
            .setRequired(true)
            .addChoices(
              { name: 'Game', value: 'game' },
              { name: 'Magic 8 Ball', value: 'magic_8_ball' },
            )
        )
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The soon to be blacklisted user')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => 
      subcommand
        .setName('unban')
        .setDescription('Remove a user from the blacklist for a command.')
        .addStringOption(option =>
          option.setName('command')
            .setDescription('The blacklisted command')
            .setRequired(true)
            .addChoices(
              { name: 'Game', value: 'game' },
              { name: 'Magic 8 Ball', value: 'magic_8_ball' },
            )
        )
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The blacklisted user (not for long)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => 
      subcommand
        .setName('list')
        .setDescription('List all blacklisted users for a command')
        .addStringOption(option =>
          option.setName('command')
            .setDescription('The blacklisted command')
            .setRequired(true)
            .addChoices(
              { name: 'Game', value: 'game' },
              { name: 'Magic 8 Ball', value: 'magic_8_ball' },
            )
        )
    )
    .addSubcommand(subcommand => 
      subcommand
        .setName('status')
        .setDescription('Dsplay if a user is blacklisted or not for a command')
        .addStringOption(option =>
          option.setName('command')
            .setDescription('The blacklisted command')
            .setRequired(true)
            .addChoices(
              { name: 'Game', value: 'game' },
              { name: 'Magic 8 Ball', value: 'magic_8_ball' },
            )
        )
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The potentially blacklisted user')
            .setRequired(true)
        )
    )
    ;


module.exports = {
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    const command = interaction.options.getString('command') ;
    // console.log (keyword)
    if (interaction.options.getSubcommand() === "ban") {
      const user = interaction.options.getUser('user') ;
      // console.log(user.id);
      // console.log(interaction.guildId)
      try {
        const already = await Blacklist.findOne({where: {[Op.and]: [
          {user_id: user.id},
          {guild_id: interaction.guildId},
          {command: command}
        ]}}) ;
        if (already === null) {
          const blacklist = await Blacklist.create({
            user_id: user.id,
            guild_id: interaction.guildId,
            command: command,
          }) ;
          // await blacklist.save();
          await interaction.editReply(`${user.username} is now blacklisted from ${commandToString[command]}.`);
        } else {
          await interaction.editReply(`${user.username} is **already** blacklisted from ${commandToString[command]}.`);
        }
      } catch (error) {
        console.error(error);
        await interaction.editReply('An error occured while performing ban.');
      }
    } else if (interaction.options.getSubcommand() === "unban") {
      const user = interaction.options.getUser('user') ;
      try {
        await Blacklist.destroy({where: {[Op.and]: [
          {user_id: user.id},
          {guild_id: interaction.guildId},
          {command: command}
        ]}}) ;
        await interaction.editReply(`${user.username} is no more blacklisted from ${commandToString[command]}.`);
      } catch (error) {
        console.error(error);
        await interaction.editReply('An error occured while performing unban.');
      }
    } else if (interaction.options.getSubcommand() === "list") {
      try {
        const all = await Blacklist.findAll({where: {[Op.and]: [
          {guild_id: interaction.guildId},
          {command: command}
        ]}}) ;
        // console.log (all) ;
        console.log(command);
        const messageContent = codeBlock ("asciidoc", 
        `= Blacklist ${commandToString[command]} =\n${
          all.length ?
          all.map(blacklist => {
            const user = interaction.message.guild.members.cache.find (u => u.id === blacklist.user_id) ; 
            return `* ${user !== null ? user.username : 'UNDEFINED'} (${blacklist.user_id})\n` ;  
          }).join('')
          : 'No result.'
        }`
        );
        await interaction.editReply(messageContent);
        codeBlock ("asciidoc", `= Blacklist ${commandToString[command]} =\nNo result`);
      } catch (error) {
        console.error(error);
        await interaction.editReply('An error occured while performing list.');
      }
    } else if (interaction.options.getSubcommand() === "status") {
      const user = interaction.options.getUser('user') ;
      try {
        const blacklist = await Blacklist.findOne({where: {[Op.and]: [
          {user_id: user.id},
          {guild_id: interaction.guildId},
          {command: command}
        ]}}) ;
        await interaction.editReply(`${user.username} is ${blacklist === null ? '**not** ' : ''}blacklisted from ${commandToString[command]}.`);
      } catch (error) {
        console.error(error);
        await interaction.editReply('An error occured while performing status.');
      }
      
    } else {
      const messageContent = codeBlock ("asciidoc", 
      `= Invalid subcommand =\n"${interaction.options.getSubcommand()}" is not a valid subcommand: ban, unban, status or list.`
      );
      await interaction.editReply(messageContent);
    }
    // await interaction.editReply('Soon TM');
  }
}