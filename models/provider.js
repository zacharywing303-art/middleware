'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {

  class Provider extends Model {
    static associate(models) {
      Provider.hasMany(models.Payment, { foreignKey: 'providerId' });
    }
  }

  Provider.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Provider',
      tableName: 'providers',
      timestamps: false,
    }
  );

  return Provider;
};