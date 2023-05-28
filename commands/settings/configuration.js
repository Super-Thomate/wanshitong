const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const {Configuration} = require('../../dbObjects.js');
const { Op } = require("sequelize");

const configurationFiels = {
  'question': 'Magic 8 Ball',
  'occurancedrop': 'Character drop percentage',
  'rolecomplete': 'Role to give when the game is completed',
  'dropchannel': 'Text channel for the game',
  'claimtime': 'Time to claim an item (in ms)',
  'characterrate': 'Rate for character spawn',
  'itemrate': 'Rate for item spawn',
  'commandclaim': 'Commands to claim an item',
} ;

const data = new SlashCommandBuilder()
    .setName('configuration')
    .setDescription('Manage game configuration')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all configuration')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('question')
        .setDescription(configurationFiels['question'])
        .addBooleanOption(option =>
          option
            .setName('enable')
            .setDescription(`Enable or not the ${configurationFiels['question']}`)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('occurancedrop')
        .setDescription(configurationFiels['occurancedrop'])
        .addNumberOption(option =>
          option
            .setName('percentage')
            .setDescription('A number between 0 and 100')
            .setMaxValue(100)
            .setMinValue(0)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('rolecomplete')
        .setDescription(configurationFiels['rolecomplete'])
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('A valid role')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('dropchannel')
        .setDescription(configurationFiels['dropchannel'])
        .addChannelOption(option => 
          option
            .setName('channel')
            .setDescription('A text channel')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('claimtime')
        .setDescription(configurationFiels['claimtime'])
        .addIntegerOption(option =>
          option
            .setName('time')
            .setDescription('An integer greater than 0')
            .setMinValue(0)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
      .setName('characterrate')
      .setDescription(configurationFiels['characterrate'])
      .addStringOption(option =>
        option
          .setName('rarity')
          .setDescription('Rarity')
          .setRequired(true)
          .addChoices(
            {name: 'high', value: 'high'},
            {name: 'regular', value: 'regular'},
            {name: 'low', value: 'low'},
            {name: 'event', value: 'event'},
          )
      )
      .addNumberOption(option =>
        option
          .setName('percentage')
          .setDescription('A number between 0 and 100')
          .setRequired(true)
          .setMaxValue(100)
          .setMinValue(0)
      )
    )
    .addSubcommand(subcommand =>
      subcommand
      .setName('itemrate')
      .setDescription(configurationFiels['itemrate'])
      .addStringOption(option =>
        option
          .setName('rarity')
          .setDescription('Rarity')
          .setRequired(true)
          .addChoices(
            {name: 'common', value: 'common'},
            {name: 'uncommon', value: 'uncommon'},
            {name: 'rare', value: 'rare'},
            {name: 'epic', value: 'epic'},
          )
      )
      .addNumberOption(option =>
        option
          .setName('percentage')
          .setDescription('A number between 0 and 100')
          .setRequired(true)
          .setMaxValue(100)
          .setMinValue(0)
      )
    )
    .addSubcommand(subcommand => 
      subcommand
        .setName('commandclaim')
        .setDescription(configurationFiels['commandclaim'])
        .addStringOption(option =>
          option
            .setName('action')
            .setDescription('Action')
            .setRequired(true)
            .addChoices(
              {name: 'add', value: 'add'},
              {name: 'delete', value: 'delete'},
            )
        )
        .addStringOption(option =>
          option
            .setName('command')
            .setDescription('Command')
            .setRequired(true)
        )
    )
    .setDMPermission(false)
    ;

module.exports = {
  category: 'settings',
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    try {
      const edit = interaction.options.getSubcommand() ;
      // console.log (edit);
      const [configuration, created] = await Configuration.findOrCreate({
        where: {guildId: interaction.guildId}
      });
      // console.log(created);
      if (edit === 'list') {      
        const errorOnCharacterRate = 100 !== (configuration.characterRate.high + configuration.characterRate.regular + configuration.characterRate.low + configuration.characterRate.event) ;
        const errorOnItemRate = 100 !== (configuration.itemRate.common + configuration.itemRate.uncommon + configuration.itemRate.rare + configuration.itemRate.epic) ;
        const embedConfiguration = new EmbedBuilder()
          .setColor(0x7435F6)
          .setTitle(`Configuration`)
          .setDescription(`Game configuration for current guild.`)
          .addFields(
            {name: configurationFiels['question'], value:`${configuration.question ? 'Enabled' : 'Disabled'}`},
            {name: configurationFiels['occurancedrop'], value:`${configuration.occuranceDrop}%`},
            {name: configurationFiels['rolecomplete'], value:`${configuration.roleComplete !== null ? configuration.roleComplete : ':x: Undefined' }`},
            {name: configurationFiels['dropchannel'], value:`${configuration.dropChannel !== null ? configuration.dropChannel : ':x: Undefined' }`},
            {name: configurationFiels['claimtime'], value:`${configuration.claimTime} ms`},
            {name: configurationFiels['characterrate'], value:`High: ${configuration.characterRate.high}%\nRegular: ${configuration.characterRate.regular}%\nLow: ${configuration.characterRate.low}%\nEvent: ${configuration.characterRate.event}%${errorOnCharacterRate ? '\n**The rate does not add up to 100%, error might occur.**' : ''}`},
            {name: configurationFiels['itemrate'], value:`Common: ${configuration.itemRate.common}%\nUncommon: ${configuration.itemRate.uncommon}%\nRare: ${configuration.itemRate.rare}%\nEpic: ${configuration.itemRate.epic}%${errorOnItemRate ? '\n**The rate does not add up to 100%, error might occur.**' : ''}`},
          )
          ;
        const embedCommandClaim = new EmbedBuilder()
          .setColor(0x7435F6 )
          .setTitle(configurationFiels['commandclaim'])
          .setDescription(`${configuration.commandClaim.join(', ').substring(0, 4096)}`)
          ;
        await interaction.editReply({
          embeds: [embedConfiguration, embedCommandClaim],
        });
      } else 
      if (edit === "question") {
        const enabled = interaction.options.getBoolean('enable') ;
        try {
          configuration.update({question: enabled});
          await interaction.editReply({
            content: `Edit field *${configurationFiels[edit]}* `
          });
        } catch (e) {
          console.error(e);
          await interaction.editReply({ content: 'An error occured while updating configuration.question.' });
        }
      } else 
      if (edit === "occurancedrop") {
        const percentage = interaction.options.getNumber('percentage') ;
        try {
          configuration.update({occuranceDrop: percentage});
          await interaction.editReply({
            content: `Edit field *${configurationFiels[edit]}* `
          });
        } catch (e) {
          console.error(e);
          await interaction.editReply({ content: 'An error occured while updating configuration.occuranceDrop.' });
        }
      } else 
      if (edit === "rolecomplete") {
        const role = interaction.options.getRole('role') ;
        // console.log(role) ;
        try {
          configuration.update({roleComplete: role.id});
          await interaction.editReply({
            content: `Edit field *${configurationFiels[edit]}*`
          });
        } catch (e) {
          console.error(e);
          await interaction.editReply({ content: 'An error occured while updating configuration.occuranceDrop.' });
        }
      } else
      if (edit === "dropchannel") {
        const channel = interaction.options.getChannel('channel') ;
        // console.log(channel) ;
        try {
          configuration.update({dropChannel: channel.id});
          await interaction.editReply({
            content: `Edit field *${configurationFiels[edit]}*`
          });
        } catch (e) {
          console.error(e);
          await interaction.editReply({ content: 'An error occured while updating configuration.occuranceDrop.' });
        }
      } else
      if (edit === "claimtime") {
        const time = interaction.options.getInteger('time') ;
        // console.log(time) ;
        try {
          configuration.update({claimTime: time});
          await interaction.editReply({
            content: `Edit field *${configurationFiels[edit]}*`
          });
        } catch (e) {
          console.error(e);
          await interaction.editReply({ content: 'An error occured while updating configuration.occuranceDrop.' });
        }
      } else
      if (edit === "characterrate") {
        const rarity = interaction.options.getString('rarity') ;
        const percentage = interaction.options.getNumber('percentage') ;
        try {
          configuration.set(`characterRate.${rarity}`, percentage) ; // We need to update with the set method. FML
          await configuration.save() ;
          await interaction.editReply({
            content: `Edit field *${configurationFiels[edit]}*`
          });
        } catch (e) {
          console.error(e);
          await interaction.editReply({ content: 'An error occured while updating configuration.occuranceDrop.' });
        }
      } else
      if (edit === "itemrate") {
        const rarity = interaction.options.getString('rarity') ;
        const percentage = interaction.options.getNumber('percentage') ;
        try {
          configuration.set(`itemRate.${rarity}`, percentage) ; // We need to update with the set method. FML
          await configuration.save();
          await interaction.editReply({
            content: `Edit field *${configurationFiels[edit]}*`
          });
        } catch (e) {
          console.error(e);
          await interaction.editReply({ content: 'An error occured while updating configuration.occuranceDrop.' });
        }
      } else
      if (edit === "commandclaim") {
        const action = interaction.options.getString('action') ;
        const command = interaction.options.getString('command') ;
        try {
          if (action === 'delete') {
            configuration.commandClaim = configuration.commandClaim.map(c => c !== command) ;
          } else {
            configuration.commandClaim.push(command) ;
          }
          configuration.changed('commandClaim', true); // We must tell it an array is updated. Wanker
          await configuration.save();
          await interaction.editReply({
            content: `Edit field *${configurationFiels[edit]}*`
          });
        } catch (e) {
          console.error(e);
          await interaction.editReply({ content: 'An error occured while updating configuration.occuranceDrop.' });
        }
      } else {
        await interaction.editReply({
          content: `Subcommand *${edit}* is not available. How did you get there ?`
        });
      }
    } catch (error) {
      console.error(error) ;
      await interaction.editReply('An error occured while retrieving configuration for current guild.');
    }
  }
}