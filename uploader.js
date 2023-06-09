const Sequelize = require('sequelize');
const config = require('./config.json');
const csv = require('csv-parser');
const fs = require('node:fs') ;

// Initialize connections
const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: 'postgresql',
  logging: false,
});

const Personnage = require('./models/Personnage.js')(sequelize, Sequelize.DataTypes);
const Item = require('./models/Item.js')(sequelize, Sequelize.DataTypes);
const Inventory = require('./models/Inventory.js')(sequelize, Sequelize.DataTypes);
const Availability = require('./models/Availability.js')(sequelize, Sequelize.DataTypes);
const Blacklist = require('./models/Blacklist.js')(sequelize, Sequelize.DataTypes);
const Configuration = require('./models/Configuration.js')(sequelize, Sequelize.DataTypes);
const Leaderboard = require('./models/Leaderboard.js')(sequelize, Sequelize.DataTypes);


Personnage.hasMany(Item);
Item.belongsTo(Personnage);

// Personnage.hasMany(Availability);
// Availability.belongsTo(Personnage);

const force = process.argv.includes('--force') || process.argv.includes('-f');
const datas = [] ;
fs.createReadStream('availability.csv')
  .pipe(csv({
    separator: ";"
  }))
  .on('data', (row) => {
    datas.push({
      personnageId: row ["character_id"],
      guildId: row ["guild_id"],
      available: row ["is_available"],
    }) ;
    // console.log(row) ;
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
    console.log('Syncing database');
    sequelize.sync({ force }).then(async () => {
      for (const data of datas) {
        // const data = datas [key];
        // personnages.push(Personnage.upsert({serie: data.set, name: data.name, image: data.image, rarity: data.rarity})) ;
        const [availability, createdAvailability] = await Availability.upsert({guildId: data.guildId, available: data.available, personnageId: data.personnageId}) ;
      }
    
      // await Promise.all(personnages);
      // await Promise.all(items);
      console.log('Database synced');
    
      // sequelize.close();
    }).catch(console.error);
  });

const datasInventory = [] ;
fs.createReadStream('inventory.csv')
  .pipe(csv({
    separator: ";"
  }))
  .on('data', (row) => {
    datasInventory.push({
      ownerId: row ["owner_id"],
      guildId: row ["guild_id"],
      itemId: row ["item_id"],
    }) ;
    // console.log(row) ;
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
    console.log('Syncing database');
    sequelize.sync({ force }).then(async () => {
      for (const data of datasInventory) {
        // const data = datas [key];
        // personnages.push(Personnage.upsert({serie: data.set, name: data.name, image: data.image, rarity: data.rarity})) ;
        const [inventory, createdInventory] = await Inventory.upsert({guildId: data.guildId, itemId: data.itemId, ownerId: data.ownerId}) ;
      }
    
      // await Promise.all(personnages);
      // await Promise.all(items);
      console.log('Database synced');
    
      // sequelize.close();
    }).catch(console.error);
  });

const datasLeaderboard = [] ;
fs.createReadStream('gamelb.csv')
  .pipe(csv({
    separator: ";"
  }))
  .on('data', (row) => {
    datasLeaderboard.push({
      ownerId: row ["user_id"],
      items: row ["items"],
      guildId: row ["guild_id"],
      completed: row ["complete"],
    }) ;
    // console.log(row) ;
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
    console.log('Syncing database');
    sequelize.sync({ force }).then(async () => {
      for (const data of datasLeaderboard) {
        // const data = datas [key];
        // personnages.push(Personnage.upsert({serie: data.set, name: data.name, image: data.image, rarity: data.rarity})) ;
        const [leaderboard, createdLeaderboard] = await Leaderboard.upsert({guildId: data.guildId, completed: data.completed, ownerId: data.ownerId, items: data.items}) ;
      }
    
      // await Promise.all(personnages);
      // await Promise.all(items);
      console.log('Database synced');
    
      // sequelize.close();
    }).catch(console.error);
  });

function getRarityCharacter (rarity) {
  return ["high", "regular", "low", "event"].indexOf (rarity)+1 ;
}