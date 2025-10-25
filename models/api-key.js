// models/apiKey.js
'use strict';
const { Model, DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  class ApiKey extends Model {
    static associate(models) {
      ApiKey.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  ApiKey.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      key_id: {
        type: DataTypes.STRING,
        allowNull: false
      },

      secret_hash: {
        type: DataTypes.STRING,
        allowNull: false
      },

      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      last_used_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      label: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'ApiKey',
      tableName: 'api_keys',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['key_id'] },
        { fields: ['active'] },
      ],
    }
  );

  return ApiKey;
};