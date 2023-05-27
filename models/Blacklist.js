module.exports = (sequelize, DataTypes) => {
	return sequelize.define('blacklist', {
    userId: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    guildId: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    command: DataTypes.STRING
  }, {
    timestamps: false,
  });
};