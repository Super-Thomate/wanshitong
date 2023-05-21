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

const force = process.argv.includes('--force') || process.argv.includes('-f');
const datas = [] ;
fs.createReadStream('wst.csv')
  .pipe(csv())
  .on('data', (row) => {
    datas.push({
      name: row ["Perso"],
      set: row ["serie"],
      image: row ["URL image"],
      rarity: getRarityCharacter (row ["classe"]),
      itemCommon: row ["Commun"],
      itemUncommon: row ["Non-commun"],
      itemRare: row ["Rare"],
      itemEpic: row ["Épique"],
      current: row ["#"]
    }) ;
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
    console.log('Syncing database');
    sequelize.sync({ force }).then(async () => {
      const personnages = [];
      const items = [];
      // console.log (datas.length)
      for (const key in datas) {
        const data = datas [key];
        personnages.push(Personnage.upsert({serie: data.set, name: data.name, image: data.image, rarity: data.rarity})) ;
        items.push(Item.upsert({name: data.itemCommon, rarity: 1, personnageId: data.current})) ;
        items.push(Item.upsert({name: data.itemUncommon, rarity: 2, personnageId: data.current})) ;
        items.push(Item.upsert({name: data.itemRare, rarity: 3, personnageId: data.current})) ;
        items.push(Item.upsert({name: data.itemEpic, rarity: 4, personnageId: data.current})) ;
      }
    
      await Promise.all(personnages);
      await Promise.all(items);
      console.log('Database synced');
    
      sequelize.close();
    }).catch(console.error);
  });


function getRarityCharacter (rarity) {
  return ["high", "regular", "low", "event"].indexOf (rarity)+1 ;
}