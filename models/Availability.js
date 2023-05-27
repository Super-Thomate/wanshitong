module.exports = (sequelize, DataTypes) => {
	return sequelize.define('availability', {
    guildId: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    available: DataTypes.BOOLEAN,
    personnageId: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
  }, {
    timestamps: false,
  });
};