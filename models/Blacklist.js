module.exports = (sequelize, DataTypes) => {
	return sequelize.define('blacklist', {
    user_id: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    guild_id: {
      type: DataTypes.BIGINT,
      primaryKey: true
    },
    command: DataTypes.STRING
  }, {
    timestamps: false,
  });
};