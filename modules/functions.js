const {Blacklist} = require('../dbObjects.js');
const {Op} = require('sequelize');

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

  /*
  GUILD SETTINGS FUNCTION

  This function merges the default settings (from config.defaultSettings) with any
  guild override you might have for particular guild. If no overrides are present,
  the default settings are used.

  */
  
  // THIS IS HERE BECAUSE SOME PEOPLE DELETE ALL THE GUILD SETTINGS
  // And then they're stuck because the default settings are also gone.
  // So if you do that, you're resetting your defaults. Congrats.
  const defaultSettings = {
    "prefix": "/",
    "modLogChannel": "mod-log",
    "modRole": "Moderator",
    "adminRole": "Administrator",
    "systemNotice": "true",
    "welcomeChannel": "welcome",
    "welcomeMessage": "Say hello to {{user}}, everyone! We all need a warm welcome sometimes :D",
    "welcomeEnabled": "false",
    "questionEnabled": "false",
    // Everything for Minigame
    "occuranceDrop": 10.0, // Drop rate of a character after a message
    "roleComplete": "Renard-Esprit", // Role for completing the game
    "toggleCommandTrigger": "false", // Toggle for whether or not a bot command will trigger the drop
    "dropChannel": "library", // The channel where the bot will drop a character
    "claimTime": 10000, // Time in ms to claim an item after character drop
    "characterRate": {"high":25.0, "regular":25.0, "low":25.0, "event":25.0}, // Character drop rate depending on rarity
    "itemRate": {"common":25.0, "uncommon":25.0, "rare":25.0, "epic":25.0}, // Item drop rate depending on rarity
    "commandClaim": ["foo", "bar"] // Command word to claim
  };

  // getSettings merges the client defaults with the guild settings. guild settings in
  // enmap should only have *unique* overrides that are different from defaults.
  client.getSettings = (guild) => {
    client.settings.ensure("default", defaultSettings);
    if(!guild) return client.settings.get("default");
    const guildConf = client.settings.get(guild.id) || {};
    // This "..." thing is the "Spread Operator". It's awesome!
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
    return ({...client.settings.get("default"), ...guildConf});
  };

  /*
  SINGLE-LINE AWAITMESSAGE

  A simple way to grab a single reply, from the user that initiated
  the command. Useful to get "precisions" on certain things...

  USAGE

  const response = await client.awaitReply(msg, "Favourite Color?");
  msg.reply({content: `Oh, I really love ${response} too!`});

  */
  client.awaitReply = async (msg, question, limit = 60000) => {
    const filter = m => m.author.id === msg.author.id;
    await msg.channel.send({content: question});
    try {
      const collected = await msg.channel.awaitMessages({filter, max: 1, time: limit, errors: ["time"] });
      return collected.first().content;
    } catch (e) {
      return false;
    }
  };


  /*
  MESSAGE CLEAN FUNCTION

  "Clean" removes @everyone pings, as well as tokens, and makes code blocks
  escaped so they're shown more easily. As a bonus it resolves promises
  and stringifies objects!
  This is mostly only used by the Eval and Exec commands.
  */
  client.clean = async (client, text) => {
    if (text && text.constructor.name == "Promise")
      text = await text;
    if (typeof text !== "string")
      text = require("util").inspect(text, {depth: 1});

    text = text
      .replace(/`/g, "`" + String.fromCharCode(8203))
      .replace(/@/g, "@" + String.fromCharCode(8203))
      .replace(client.token, "mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0");

    return text;
  };

  client.loadCommand = (commandName) => {
    try {
      client.logger.log(`Loading Command: ${commandName}`);
      const props = require(`../commands/${commandName}`);
      if (props.init) {
        props.init(client);
      }
      client.commands.set(props.help.name, props);
      props.conf.aliases.forEach(alias => {
        client.aliases.set(alias, props.help.name);
      });
      return false;
    } catch (e) {
      return `Unable to load command ${commandName}: ${e}`;
    }
  };

  client.unloadCommand = async (commandName) => {
    let command;
    if (client.commands.has(commandName)) {
      command = client.commands.get(commandName);
    } else if (client.aliases.has(commandName)) {
      command = client.commands.get(client.aliases.get(commandName));
    }
    if (!command) return `The command \`${commandName}\` doesn"t seem to exist, nor is it an alias. Try again!`;
    
    if (command.shutdown) {
      await command.shutdown(client);
    }
    const mod = require.cache[require.resolve(`../commands/${command.help.name}`)];
    delete require.cache[require.resolve(`../commands/${command.help.name}.js`)];
    for (let i = 0; i < mod.parent.children.length; i++) {
      if (mod.parent.children[i] === mod) {
        mod.parent.children.splice(i, 1);
        break;
      }
    }
    return false;
  };

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
    console.error(err);
    // Always best practice to let the code crash on uncaught exceptions. 
    // Because you should be catching them anyway.
    process.exit(1);
  });

  process.on("unhandledRejection", err => {
    client.logger.error(`Unhandled rejection: ${err}`);
    console.error(err);
  });
  
  // GAME
  client.getRandomRarity = (rarityRate, retKey=false) => {
    let currentScore = 0 , i = 0 ;
    const number = Math.floor(Math.random() * 100) + 1;
    // console.log ("Random number:",number) ;
    for (let key in rarityRate) {
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
  
  client.dropCharacter = async (channel, setting, givenRarity=null, givenId=null, givenItemRarity=null) => {
    const commandClaim = setting.commandClaim.random() ;
    var character = givenRarity || client.getRandomRarity (setting.characterRate) ;
    const item = givenItemRarity || client.getRandomRarity (setting.itemRate) ;
    const guild_id = channel.guild.id ;
    const prefix = setting.prefix || defaultSettings.prefix ;
    const filter = async (m) => {
      return (    m.content.startsWith (`${prefix}`)
               && isCommandClaim (m.content.toLowerCase(), setting.commandClaim)
               && ! await client.isBlackList (m.member, "game")
             ) ;
      
    } ;
    if (givenId === null && (character === -1 || item === -1)) return channel.send ({content: "An error occured ! Check your rate."}) ;
    if (givenId === null) {
      var select = "select A.`id` as characterId , A.`name` as characterName , A.`image` as characterImage , B.`id` as itemId , B.`name` as itemName , B.`rarity` as itemRarity  from `character` as A, `item` as B, `availability` as C where A.id=B.character_id and A.id=C.character_id and C.is_available=1 and A.rarity="+character+" and B.rarity="+item+" and C.guild_id="+guild_id+";" ;
    }
    else {
      var select = "select A.`id` as characterId , A.`name` as characterName , A.`image` as characterImage , A.`rarity` as characterRarity, B.`id` as itemId , B.`name` as itemName , B.`rarity` as itemRarity  from `character` as A, `item` as B, `availability` as C where A.id="+givenId+" and A.id=B.character_id and A.id=C.character_id and C.is_available=1 and B.rarity="+item+" and C.guild_id="+guild_id+";" ;
    }
    var [rows,fields] =
      await client
            .connection
            .promise ()
            .execute (select) ;
    /*
    console.log ("select", select) ;
    console.log ("guild_id", guild_id) ;
    console.log ("givenId", givenId) ;
    console.log ("character", character) ;
    console.log ("item", item) ;
    */
    if (!rows.length) {
      console.error ("Error on dropCharacter get a character => rows = []") ;
      console.error ("select:\n", select) ;
      return await channel.send ({content: "Found 0 character ! Check if series is loaded !"}) ;
    }
    const row = rows.random() ; //get one among all the possibilities
    // need to redefine character
    character = row ['characterRarity'] || character ;
    // console.log ("character:", character) ;
    var characterEmbed = new client.Discord.MessageEmbed()
                             .setColor(colors.base)
                             .setTitle(`${row.characterName} s'approche.`)
                             .setDescription(`${row.characterName} souhaite vous offrir quelque chose.\nTapez \`${prefix}${commandClaim}\` pour le récupérer.`)
                             .setImage(row.characterImage)
                             ;
    const msgEmbed = await channel.send ({embeds: [characterEmbed]}) ;
    let already = false ;
    const collector = channel.createMessageCollector({filter, max:1, time: setting.claimTime, errors: ["time"]});
    const handleDelete = (msg) => {
      if (msg.id === msgEmbed.id) {
        console.log ("Something deleted the character") ;
        collector.stop ("erased") ;
      }
      client.off ("messageDelete", handleDelete) ;
    } ;
    client.on ("messageDelete", handleDelete) ;
    collector.on('collect', async (collected) => {
      answer = collected.content.toLowerCase();
      uanswer = answer.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
      check = `${prefix}${commandClaim.toLowerCase()}`;
      ucheck = check.normalize('NFD').replace(/[\u0300-\u036f]/g, "");

      if (uanswer !== ucheck) {
        return collector.stop ("wrong answer") ;
      }
      // Add to inventory
      const author = collected.author ;
      [rows,fields] = await client.connection.promise().query ("select count (*) as already from wanshitong.inventory"+((character == 4)?"_event":"")+" where owner_id=? and item_id=? and guild_id=?;", [author.id, row.itemId, guild_id]) ;
      // console.log (`for character ${character}:`, rows) ;
      already = rows[0].already ;
      if (! already) {
        await client.connection.promise().execute ("insert into wanshitong.inventory"+((character === 4)?"_event":"")+" (owner_id, item_id, guild_id) values (?, ?, ?) ;", [author.id, row.itemId, guild_id]) ;
        if (character !== 4) {
          [rows,fields] = await client.connection.promise().query ("select items from wanshitong.gamelb where user_id=? and guild_id=?;", [author.id, guild_id]) ;
          if (rows.length) {
            const complete = (rows [0].items +1 == client.maxItem [guild_id]) ;
            await client.connection.promise().execute ("update wanshitong.gamelb set items=items+1, complete=?"+(complete?", date_completed=NOW()":"")+" where user_id=? and guild_id=? ;", [complete, author.id, guild_id]) ;
            if (complete) {
              const roleComplete = setting.roleComplete ;
              const role = channel.guild.roles.cache.find (r => r.name === roleComplete) ;
              collected.member.roles.add(role).catch(console.error);
              channel.send ({content: `Félicitations **${collected.member.displayName}** ! Ta persévérance dans la quête des nombreux artéfacts t'octroie le privilège d'intégrer les rangs de mes serviles ${role.toString()}.`}) ;
            }
          } else {
            await client.connection.promise().execute ("insert into wanshitong.gamelb (user_id, guild_id) values (?, ?) on duplicate key update items=items ;", [author.id, guild_id]) ;
          }
        }
      }
      characterEmbed
        .setTitle (`${row.characterName} repart.`)
        .setDescription (`<@${author.id}> ${row.characterName} t'a offert ${row.itemName}.\n${client.getRarityEmoji(item)} C'est un objet **${client.getRarityItem(item).lowerCaseFirstLetter()}** ${client.getRarityEmoji(item)}. ${already?"\n*Vous lui rendez parce que vous l'avez déjà.*":""}`)
        .setColor (colors[item]) ;
      msgEmbed.edit ({embeds: [characterEmbed]}) ;
      collector.stop ("claimed") ;
    });
    
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
          .setTitle (`${row.characterName} disparaît.`) // est parti·e
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
  
  client.isBlackList = async (member, command) => {
    const user = await Blacklist.findOne({where: {[Op.and]: [
      {user_id: member.id},
      {guild_id: member.guild.id},
      {command: command}
    ]}});
    console.log (user) ;
    return user !== null ;
  }

  client.populateMaxItem = async (guild_id) => {
    client.connection.execute ("select count(*) as allItems from `item` as A, `character` as B, `availability` as C where A.character_id=B.id and C.character_id=B.id and C.is_available=1 and B.rarity<>4 and C.guild_id="+guild_id+";", (err, rows) => {
      if (err) console.log ("err on function::populateMaxItem:",err) ;
      if (rows && rows.length) {
        client.maxItem [guild_id] = rows [0].allItems ;
      }
    });
  }
  
};
