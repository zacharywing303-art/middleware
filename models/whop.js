'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    class Whop extends Model {
        static associate(models) {
            Whop.hasMany(models.Payment, { foreignKey: 'whopId' });
        }
    }   

  Whop.init(
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
      api_key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      webhook_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      product_id: {
        type: DataTypes.STRING,
        allowNull: true,
      }
    },
    {
      sequelize,
      modelName: 'Whop',
      tableName: 'whops',
      timestamps: false,
    }
  );

  return Whop;
};