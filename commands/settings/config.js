const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const {Configuration} = require('../../dbObjects.js');
const { Op } = require("sequelize");

const configurationFiels = {
  'question': 'Magic 8 Ball',
  'occuranceDrop': 'Character drop percentage',
  'roleComplete': 'Role gave when full inventory',
  'dropChannel': 'Channel for game',
  'claimTime': 'Time to claim an item (in ms)',
  'characterRate': 'Rate for character spawn',
  'itemRate': 'Rate for item spawn',
  'commandClaim': 'Commands to claim an item',
} ;

const data = new SlashCommandBuilder()
    .setName('config')
    .setDescription('Manage game configuration.')
    .addStringOption(option =>
      option.setName('edit')
        .setDescription('Edit a field')
        .setRequired(false)
        .addChoices(
          { name: configurationFiels['question'], value: 'question' },
          { name: configurationFiels['occuranceDrop'], value: 'occuranceDrop' },
          { name: configurationFiels['roleComplete'], value: 'roleComplete' },
          { name: configurationFiels['dropChannel'], value: 'dropChannel' },
          { name: configurationFiels['claimTime'], value: 'claimTime' },
          { name: configurationFiels['characterRate'], value: 'characterRate' },
          { name: configurationFiels['itemRate'], value: 'itemRate' },
          { name: configurationFiels['commandClaim'], value: 'commandClaim' },
        )
    )
    ;


module.exports = {
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    try {
      const edit = interaction.options.getString('edit') ;
      // console.log (edit);
      const [configuration, created] = await Configuration.findOrCreate({
        where: {guild_id: interaction.guildId}
      });
      // console.log(configuration);
      if (edit === null) {        
        const embedConfiguration = new EmbedBuilder()
          .setColor(0x7435F6)
          .setTitle(`Configuration`)
          .setDescription(`Game configuration for current guild.`)
          .addFields(
            {name:'Magic 8 ball', value:`${configuration.question ? 'Enabled' : 'Disabled'}`},
            {name:'Drop percentage', value:`${configuration.occuranceDrop}%`},
            {name:'Role gave when full inventory', value:`${configuration.roleComplete !== null ? '' : ':x: Undefined' }`},
            {name:'Channel for game', value:`${configuration.dropChannel !== null ? '' : ':x: Undefined' }`},
            {name:'Time to claim an item (in ms)', value:`${configuration.claimTime} ms`},
            {name:'Rate for character spawn', value:`High: ${configuration.characterRate.high}%\nRegular: ${configuration.characterRate.regular}%\nLow: ${configuration.characterRate.low}%\nEvent: ${configuration.characterRate.event}%`},
            {name:'Rate for item spawn', value:`Common: ${configuration.itemRate.common}%\nUncommon: ${configuration.itemRate.uncommon}%\nRare: ${configuration.itemRate.rare}%\nEpic: ${configuration.itemRate.epic}%`},
          )
          ;
        const embedCommandClaim = new EmbedBuilder()
          .setColor(0x7435F6)
          .setTitle(`Commands to claim an item`)
          .setDescription(`${configuration.commandClaim.join(', ').substring(0, 4096)}`)
          ;
        await interaction.editReply({
          embeds: [embedConfiguration, embedCommandClaim],
        });
      } else {
        await interaction.editReply({
          content: `Edit field *${configurationFiels[edit]}* `
        });
        if (edit === "question") {
          const enabled = new ButtonBuilder()
            .setCustomId('enabled')
            .setLabel('Enabled')
            .setStyle(ButtonStyle.Success)
            ;
          const disabled = new ButtonBuilder()
            .setCustomId('disabled')
            .setLabel('Disabled')
            .setStyle(ButtonStyle.Danger)
            ;
          const row = new ActionRowBuilder()
            .addComponents(enabled, disabled)
            ;
          const response = await interaction.editReply({
            content: `Do you wish to enable *${configurationFiels[edit]}* ?`,
            components: [row]
          });
          const collectorFilter = i => i.user.id === interaction.user.id ;
          try {
            const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60000 });
            try {
              configuration.update({question: confirmation.customId === 'enabled'});
              await confirmation.update({ content: `*${configurationFiels[edit]}* ${confirmation.customId}.`, components: [] });
            } catch (err) {
              console.error(err) ;
              await confirmation.update({ content: 'An error occured while updating configuration.', components: [] });
            }
          } catch (e) {
            console.error(e);
            await interaction.editReply({ content: 'Answer not received within 1 minute, cancelling.', components: [] });
          }
        } else 
        if (edit === "occuranceDrop") {
          await interaction.editReply({
            content: `Enter the new value for *${configurationFiels[edit]}* **(must be a number between 0 and 100)**.`
          });
          const filter = m => m.author.id === interaction.user.id ;
          const collector = interaction.channel.createMessageCollector({ filter, time: 60_000, idle:60_000, max: 1 });
          try {
            // console.log(collector) ;
            collector.on('collect', m => {
              // console.log(`Collected ${m.content}`);
              const percentage = parseFloat(m.content);
              if (isNaN(percentage)) {
                collector.stop('wrong');
              } else {
                configuration.update({occuranceDrop: percentage});
              }
            });
            collector.on('end', (collected, reason) => {
              // console.log(collected.first().content) ;
              if (reason === 'time') {
                interaction.editReply({
                  content: `Time out for *${configurationFiels[edit]}* after 1 minute.`
                }) ;
              } else if (reason === 'limit') {
                interaction.editReply({
                  content: `New value for *${configurationFiels[edit]}*: ${parseFloat(m.content)}%.`
                }) ;
              } else if (reason === 'wrong') {
                interaction.editReply({
                  content: `${collected.first().content} is not a valid argument.`
                }) ;
              } else {
                // console.log(reason) ;
                interaction.editReply({
                  content: `Edit ended with unknown reason **${reason}**.`
                }) ;
              }
              // .then(console.log)
              // .catch(console.error)
              ;
              collected.first().delete().catch(console.error);
            });
          } catch (err) {
            console.error (err) ;
            await interaction.editReply({
              content: `An error occured while editing *${configurationFiels[edit]}*.`
            });
          }
        } else 
        if (edit === "roleComplete") {
          await interaction.editReply({
            content: `Edit field *${configurationFiels[edit]}* SOON `
          });
        } else
        if (edit === "dropChannel") {
          await interaction.editReply({
            content: `Edit field *${configurationFiels[edit]}* SOON `
          });
        } else
        if (edit === "claimTime") {
          await interaction.editReply({
            content: `Edit field *${configurationFiels[edit]}* SOON `
          });
        } else
        if (edit === "characterRate") {
          await interaction.editReply({
            content: `Edit field *${configurationFiels[edit]}* SOON `
          });
        } else
        if (edit === "itemRate") {
          await interaction.editReply({
            content: `Edit field *${configurationFiels[edit]}* SOON `
          });
        } else
        if (edit === "commandClaim") {
          await interaction.editReply({
            content: `Edit field *${configurationFiels[edit]}* SOON `
          });
        } else {
          await interaction.editReply({
            content: `Field *${edit}* is not available. How did you get there ?`
          });
        }
      }
    } catch (error) {
      console.error(error) ;
      await interaction.editReply('An error occured while retrieving configuration for current guild.');
    }
  }
}