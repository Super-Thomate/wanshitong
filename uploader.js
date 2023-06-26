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
    separator: "; "
  }))
  .on('data', (row) => {
    // datas.push({
    //   name: row ["Perso"],
    //   set: row ["serie"],
    //   image: row ["URL image"],
    //   rarity: getRarityCharacter (row ["classe"]),
    //   itemCommon: row ["Commun"],
    //   itemUncommon: row ["Non-commun"],
    //   itemRare: row ["Rare"],
    //   itemEpic: row ["Épique"],
    //   current: row ["#"]
    // }) ;
    console.log(row)
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
    console.log('Syncing database');
    // sequelize.sync({ force }).then(async () => {
    //   if (force) {
    //     // console.log (datas.length)
    //     for (const data of datas) {
    //       // const data = datas [key];
    //       // personnages.push(Personnage.upsert({serie: data.set, name: data.name, image: data.image, rarity: data.rarity})) ;
    //       const [personnage, createdPersonnage] = await Personnage.upsert({serie: data.set, name: data.name, image: data.image, rarity: data.rarity}) ;
    //       // console.log(personnage);
    //       const [itemCommon, createdItemCommon] = await Item.upsert({name: data.itemCommon, rarity: 1, personnageId: personnage.id}, {include: Personnage}) ;
    //       // console.log(itemCommon);
    //       const [itemUncommon, createdItemUncommon] = await Item.upsert({name: data.itemUncommon, rarity: 2, personnageId: personnage.id}, {include: Personnage}) ;
    //       // console.log(itemUncommon);
    //       const [itemRare, createdItemRare] = await Item.upsert({name: data.itemRare, rarity: 3, personnageId: personnage.id}, {include: Personnage}) ;
    //       // console.log(itemRare);
    //       const [itemEpic, createdItemEpic] = await Item.upsert({name: data.itemEpic, rarity: 4, personnageId: personnage.id}, {include: Personnage}) ;
    //       // console.log(itemEpic);
    //     }
    //   }
    
    //   // await Promise.all(personnages);
    //   // await Promise.all(items);
    //   console.log('Database synced');
    
    //   sequelize.close();
    // }).catch(console.error);
  });


function getRarityCharacter (rarity) {
  return ["high", "regular", "low", "event"].indexOf (rarity)+1 ;
}