const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const User = sequelize.define('User', {
  // Telegram User ID will be the primary key
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true, // lastName is optional
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true, // username is optional
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  // Model options
  timestamps: true, // Automatically add createdAt and updatedAt fields
});

module.exports = User;
