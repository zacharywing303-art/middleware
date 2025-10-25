'use strict';
const { Model, DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Payment, { foreignKey: 'user_id' });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      client_secret: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      callback_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      svix_app_id: {
        type: DataTypes.STRING,
        allowNull: true,
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
    }

  );

  return User;
};