module.exports = (sequelize, DataTypes) => {
	return sequelize.define('availability', {
    character_id: {
      type: DataTypes.INTEGER,
      primareyKey: true
    },
    guild_id: {
      type: DataTypes.BIGINT,
      primareyKey: true
    },
    available: DataTypes.BOOLEAN
  }, {
    timestamps: false,
  });
};