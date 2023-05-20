module.exports = (sequelize, DataTypes) => {
	return sequelize.define('personnage', {
    id:{
      type: DataTypes.INTEGER,
      // unique: true,
      autoIncrement: true,
      primaryKey: true
    },
    serie: DataTypes.STRING,
    name: DataTypes.STRING,
    image: DataTypes.STRING,
    rarity: DataTypes.INTEGER
  }, {
    timestamps: false,
  });
};