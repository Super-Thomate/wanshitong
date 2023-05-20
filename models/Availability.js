module.exports = (sequelize, DataTypes) => {
	return sequelize.define('availability', {
    personnageId: {
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