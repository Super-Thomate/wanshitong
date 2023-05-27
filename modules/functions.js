const {Blacklist, Personnage, Item, Configuration, Availability, Inventory, Leaderboard} = require('../dbObjects.js');
const {Op, where, col} = require('sequelize');
const { EmbedBuilder } = require('discord.js');

module.exports = (client) => {

  /*
  PERMISSION LEVEL FUNCTION

  This is a very basic permission system for commands which uses "levels"
  "spaces" are intentionally left black so you can add them if you want.
  NEVER GIVE ANYONE BUT OWNER THE LEVEL 10! By default this can run any
  command including the VERY DANGEROUS `eval` and `exec` commands!

  */
  client.permlevel = message => {
    let permlvl = 0;

    const permOrder = client.config.permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);

    while (permOrder.length) {
      const currentLevel = permOrder.shift();
      if (message.guild && currentLevel.guildOnly) continue;
      if (currentLevel.check(message)) {
        permlvl = currentLevel.level;
        break;
      }
    }
    return permlvl;
  };

  // client.loadCommand = (commandName) => {
  //   try {
  //     client.logger.log(`Loading Command: ${commandName}`);
  //     const props = require(`../commands/${commandName}`);
  //     if (props.init) {
  //       props.init(client);
  //     }
  //     client.commands.set(props.help.name, props);
  //     props.conf.aliases.forEach(alias => {
  //       client.aliases.set(alias, props.help.name);
  //     });
  //     return false;
  //   } catch (e) {
  //     return `Unable to load command ${commandName}: ${e}`;
  //   }
  // };

  // client.unloadCommand = async (commandName) => {
  //   let command;
  //   if (client.commands.has(commandName)) {
  //     command = client.commands.get(commandName);
  //   } else if (client.aliases.has(commandName)) {
  //     command = client.commands.get(client.aliases.get(commandName));
  //   }
  //   if (!command) return `The command \`${commandName}\` doesn"t seem to exist, nor is it an alias. Try again!`;
    
  //   if (command.shutdown) {
  //     await command.shutdown(client);
  //   }
  //   const mod = require.cache[require.resolve(`../commands/${command.help.name}`)];
  //   delete require.cache[require.resolve(`../commands/${command.help.name}.js`)];
  //   for (let i = 0; i < mod.parent.children.length; i++) {
  //     if (mod.parent.children[i] === mod) {
  //       mod.parent.children.splice(i, 1);
  //       break;
  //     }
  //   }
  //   return false;
  // };

  /* MISCELANEOUS NON-CRITICAL FUNCTIONS */
  
  // EXTENDING NATIVE TYPES IS BAD PRACTICE. Why? Because if JavaScript adds this
  // later, this conflicts with native code. Also, if some other lib you use does
  // this, a conflict also occurs. KNOWING THIS however, the following 2 methods
  // are, we feel, very useful in code. 
  
  // <String>.toPropercase() returns a proper-cased string such as: 
  // "Mary had a little lamb".toProperCase() returns "Mary Had A Little Lamb"
  Object.defineProperty(String.prototype, "toProperCase", {
    value: function() {
      return this.replace(/([^\W_]+[^\s-]*) */g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
  });
  
  Object.defineProperty(String.prototype, "upperCaseFirstLetter", {
    value: function() {
      return this.charAt(0).toUpperCase() + this.slice(1);
    }
  });
  
  Object.defineProperty(String.prototype, "lowerCaseFirstLetter", {
    value: function() {
      return this.charAt(0).toLowerCase() + this.slice(1);
    }
  });

  // <Array>.random() returns a single random element from an array
  // [1, 2, 3, 4, 5].random() can return 1, 2, 3, 4 or 5.
  Object.defineProperty(Array.prototype, "random", {
    value: function() {
      return this[Math.floor(Math.random() * this.length)];
    }
  });
  
  Array.prototype.removeItem = function (item) {
    var indexOf = this.indexOf(item) ;
    if (indexOf === -1) return this ;
    var rest = this.slice((indexOf || indexOf) + 1 || this.length);
    this.length = indexOf < 0 ? this.length + indexOf : indexOf;
    return this.push.apply(this, rest) ;
  };
  
  Array.prototype.removeAllItem = function (item) {
    var indexOf = this.indexOf(item) ;
    if (indexOf === -1) return this ;
    while (indexOf != -1) {
      var rest = this.slice((indexOf || indexOf) + 1 || this.length);
      this.length = indexOf < 0 ? this.length + indexOf : indexOf;
      this.push.apply(this, rest)
      indexOf = this.indexOf(item) ;
      console.log (indexOf) ;
    }
    return this.length ;
  };

  // `await client.wait(1000);` to "pause" for 1 second.
  client.wait = require("util").promisify(setTimeout);

  // These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
  process.on("uncaughtException", (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
    // client.logger.error(`Uncaught Exception: ${errorMsg}`);
    console.error(`Uncaught Exception: ${errorMsg}`);
    // Always best practice to let the code crash on uncaught exceptions. 
    // Because you should be catching them anyway.
    process.exit(1);
  });

  process.on("unhandledRejection", err => {
    // client.logger.error(`Unhandled rejection: ${err}`);
    console.error(`Unhandled rejection: ${err}`);
  });
  
  // GAME
  // client.getRandomRarity = (rarityRate, retKey=false) => {
  //   let currentScore = 0 , i = 0 ;
  //   const number = Math.floor(Math.random() * 100) + 1;
  //   console.log ("Random number:",number) ;
  //   console.log (rarityRate) ;
  //   for (let key in rarityRate) {
  //     currentScore+= parseInt (rarityRate [key]) ;
  //     i++ ;
  //     // console.log ("currentScore:", currentScore) ;
  //     // console.log ("key:", key) ;
  //     // console.log ("key:", i) ;
  //     if (number <= currentScore) return retKey ? key : i ;
  //   }
  //   return -1 ;
  // } ;
  client.getRandomRarityForCharacter = (rarityRate, retKey=false) => {
    let currentScore = 0 , i = 0 ;
    const number = Math.floor(Math.random() * 100) + 1;
    const orderedSearch = [
      'high',
      'regular',
      'low',
      'event'
    ] ;
    // console.log ("Random number:",number) ;
    // console.log (rarityRate) ;
    for (const key of orderedSearch) {
      currentScore+= parseInt (rarityRate [key]) ;
      i++ ;
      // console.log ("currentScore:", currentScore) ;
      console.log ("key:", key) ;
      // console.log ("key:", i) ;
      if (number <= currentScore) return retKey ? key : i ;
    }
    return -1 ;
  } ;
  client.getRandomRarityForItem = (rarityRate, retKey=false) => {
    let currentScore = 0 , i = 0 ;
    const number = Math.floor(Math.random() * 100) + 1;
    const orderedSearch = [
      'common',
      'uncommon',
      'rare',
      'epic'
    ] ;
    // console.log ("Random number:",number) ;
    // console.log (rarityRate) ;
    for (const key of orderedSearch) {
      currentScore+= parseInt (rarityRate [key]) ;
      i++ ;
      // console.log ("currentScore:", currentScore) ;
      // console.log ("key:", key) ;
      // console.log ("key:", i) ;
      if (number <= currentScore) return retKey ? key : i ;
    }
    return -1 ;
  } ;
  
  client.getRarityFromName = (rarityName) => {
    return  ["high","regular","low","event"].indexOf (rarityName)+1 ;
  } ;
  
  client.getItemRarityFromName = (rarityName) => {
    return  ["common","uncommon","rare","epic"].indexOf (rarityName)+1 ;
  } ;
  
  client.getRarityCharacter = (rarity) => {
    return ["Haut","Régulier","Bas","Événementiel"] [rarity-1] ;
  } ;
  client.getRarityItem = (rarity) => {
    return ["Commun","Non commun","Rare","Épique"] [rarity-1] ;
  } ;
  
  client.getRarityEmoji = (rarity) => {
    return ["<:common:578905506022948874>", "<:uncommon:578905506165293076>", "<:rare:578905506706358282>", "<:epic:578905506693775360>"] [rarity-1] ;
  }
  
  const colors = {
   "base": "#DDA624",
   1: "#CFCFCD", // common
   2: "#9AEE3F", // uncommon
   3:  "#2794CD", // rare
   4: "#9F59DD", // epic
   "left": "#B20C20"
  } ;
  
  client.dropCharacter = async (channel, options = {}) => {
    const configuration = await Configuration.findOne({where: {guildId: channel.guild.id}}) ;
    const commandClaim = configuration.commandClaim.random() ;
    const characterRarity = options.characterRarity || client.getRandomRarityForCharacter (configuration.characterRate) ;
    const itemRarity = options.itemRarity || client.getRandomRarityForItem (configuration.itemRate) ;
    const givenId = options.givenId || null ;
    const guildId = channel.guild.id ;
    // console.log (options) ;
    const filter = async (m) => {
      return (    m.content.startsWith (`-`)
               && isCommandClaim (m.content.toLowerCase(), configuration.commandClaim)
               && ! await client.isBlackList (m.author.id, guildId, "game")
             ) ;
      
    } ;
    if (givenId === null && (characterRarity === -1 || itemRarity === -1)) throw new Error("An error occured ! Check your rates.") ;
    const whereClausePersonnage = {} ;
    if (givenId === null) {
      whereClausePersonnage.rarity = characterRarity ;
    } else {
      whereClausePersonnage.id = givenId ;
    }
    const personnages = await Personnage.findAll({
      where: whereClausePersonnage,
      include: [
        {
          model: Availability,
          where: {[Op.and]: [{guildId: guildId}, {available: true}]},
          as: 'availability'
        },
        {
          model: Item,
          where: {rarity: itemRarity}
        }
      ]
    }) ;
    // console.log (personnages) ;
    if (!personnages.length) {
      // console.error ("Error on dropCharacter get a character => rows = []") ;
      // console.error ("select:\n", whereClausePersonnage) ;
      throw new Error (`Found 0 character for ${givenId ? `id ${givenId}` : `rarity ${client.getRarityCharacter(characterRarity)}`} ! Check if series are loaded !`) ;
    }
    const personnage = personnages.random() ; //get one among all the possibilities
    if (typeof personnage.items === 'undefined' || personnage.items === null || !personnage.items.length)  {
      throw new Error (`Found no item for ${personnage.name} with rarity ${client.getRarityItem(itemRarity)} ! Impossibru !`) ;
    }
    const item = personnage.items[0] ;
    console.log (`${personnage.name} s'approche.`) ;
    console.log (`${personnage.name} apporte l'item ${item.name}#${item.id}`) ;
    const characterEmbed = new EmbedBuilder()
                             .setColor(colors.base)
                             .setTitle(`${personnage.name} s'approche.`)
                             .setDescription(`${personnage.name} souhaite vous offrir quelque chose.\nTapez \`-${commandClaim}\` pour le récupérer.`)
                             .setImage(personnage.image)
                             ;
    const msgEmbed = await channel.send ({embeds: [characterEmbed]}) ;
    const collector = channel.createMessageCollector({filter, max:1, time: configuration.claimTime, errors: ["time"]});
    const handleDelete = (msg) => {
      if (msg.id === msgEmbed.id) {
        console.log ("Something deleted the character") ;
        collector.stop ("erased") ;
      }
      client.off ("messageDelete", handleDelete) ;
    } ;
    client.on ("messageDelete", handleDelete) ;
    collector.on('collect', async (message) => {
      answer = message.content.toLowerCase();
      uanswer = answer.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
      check = `-${commandClaim.toLowerCase()}`;
      ucheck = check.normalize('NFD').replace(/[\u0300-\u036f]/g, "");

      if (uanswer !== ucheck) {
        return collector.stop ("wrong answer") ;
      }
      // Add to inventory
      // console.log (message)
      const owner = message.author ;
      // console.log (owner.id);
      try {
        // console.log (owner.id);
        // console.log (item.id);
        const inventory = await Inventory.findOne({
          where: {
            [Op.and]: [{ownerId: owner.id}, {guildId: guildId}, {itemId: item.id}]
          }
        }) ;
        const created = inventory === null ;
        if (created) {
          // insert into inventory
          // console.log (item.id);
          await Inventory.create(
            {
              ownerId: owner.id,
              guildId: guildId,
              itemId: item.id
            }
          ) ;
          // update leaderbord
          const [leaderboard, createdLeaderboard] = await Leaderboard.findOrCreate({
            where: {[Op.and]: [{ownerId: owner.id}, {guildId: guildId}]},
            defaults: {
              ownerId: owner.id,
              guildId: guildId
            }
          }) ;
          // console.log (leaderboard) ;
          await leaderboard.update({
            items: leaderboard.items+1
          }) ;
          // check if complete
          const allItems = await Item.count({
            include: {
              model: Personnage,
              where: {rarity: {[Op.not]: 4}}, // event excluded
              required: true,
              include: {
                model: Availability,
                where: {[Op.and]: [{guildId: guildId}, {available: true}]},
                as: 'availability',
                required: true
              }
            }
          }) ;
          if (leaderboard.items == allItems) {
            // COMPLETED
            await leaderboard.update({
              completed: true
            }) ;
            const roleComplete = configuration.roleComplete ;
            if (roleComplete !== null) {
              const role = await channel.guild.roles.cache.find (r => r.id === roleComplete) ;
              await channel.send(`Félicitations **${owner}** ! Ta persévérance dans la quête des nombreux artéfacts t'octroie le privilège d'intégrer les rangs de mes serviles ${role}.`) ;
            } else {
              await channel.send(`Félicitations **${owner}** !`) ;
            }
          }
        }
        // const inventoryTest = await Inventory.findOne({
        //   where: {
        //     [Op.and]: [{ownerId: owner.id}, {guildId: guildId}, {itemId: item.id}]
        //   }
        // }) ;
        // console.log (inventoryTest);
        characterEmbed
          .setTitle (`${personnage.name} repart.`)
          .setDescription (`<@${owner.id}> ${personnage.name} t'a offert ${item.name}.\n${client.getRarityEmoji(itemRarity)} C'est un objet **${client.getRarityItem(itemRarity).lowerCaseFirstLetter()}** ${client.getRarityEmoji(itemRarity)}. ${!created?"\n*Vous lui rendez parce que vous l'avez déjà.*":""}`)
          .setColor (colors[itemRarity]) ;
        msgEmbed.edit ({embeds: [characterEmbed]}) ;
        collector.stop ("claimed") ;
      } catch (err) {
        collector.stop ("wrong answer") ;
        throw new Error (err) ;
      }
    }) ;
    
    collector.on('end', (collected, reason) => {
      if (reason == "erased") {
        client.off ("messageDelete", handleDelete) ;
        if (typeof client.alreadyDropped [channel.guild.id] !== "undefined" && client.alreadyDropped [channel.guild.id] !== null) {
          client.alreadyDropped [channel.guild.id] = null ;
        }
        return ;
      }
      let msgCollected = collected.first() ;
      if ((reason === "time") || (reason === "wrong answer")) {
        characterEmbed
          .setTitle (`${personnage.name} disparaît.`) // est parti·e
          .setDescription (`${(reason === "time")?"Oh non, vous n'avez pas été assez rapide !":"Ce n'était pas la réponse attendue !"}`)
          .setColor (colors.left) ;
        msgEmbed.edit ({embeds: [characterEmbed]}) ;
      }
      if ((reason !== "time"))
        msgCollected.delete({timeout:500})
          .then(msg => console.log(`Deleted message ${msg.content}`))
          .catch(console.error);
      if (typeof client.alreadyDropped [channel.guild.id] !== "undefined" && client.alreadyDropped [channel.guild.id] !== null) {
        client.alreadyDropped [channel.guild.id] = null ;
      }
      client.off ("messageDelete", handleDelete) ;
    });
  } ;
  
  
  function isCommandClaim (content, commandClaim) {
    let isIt = false ;
    commandClaim.forEach (c => {
      answer = content.slice(1);
      uanswer = answer.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
      check = c.toLowerCase() ;
      ucheck = check.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
      if (uanswer === ucheck) {
        isIt = true ;
      }        
    }) ;
    return isIt ;
  }
  
  client.isBlackList = async (memberId, guildId, command) => {
    const user = await Blacklist.findOne({where: {[Op.and]: [
      {userId: memberId},
      {guildId: guildId},
      {command: command}
    ]}});
    return user !== null ;
  }

  client.populateMaxItem = async (guildId) => {
    const allItems = await Item.count({
      include: {
        model: Personnage,
        where: {rarity: {[Op.not]: 4}}, // event excluded
        required: true,
        include: {
          model: Availability,
          where: {[Op.and]: [{guildId: guildId}, {available: true}]},
          as: 'availability',
          required: true
        }
      }
    }) ;
    client.maxItem [guildId] = allItems ;
  }
  
};
