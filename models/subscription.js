// models/subscription.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Subscription extends Model {
    static associate(models) {
      Subscription.belongsTo(models.User, { foreignKey: 'userId' });

      Subscription.hasMany(models.Subscription_NowpaymentPlan_Map, {
        foreignKey: 'subscriptionId',
        as: 'nowpay_maps',
      });
    }
  }

  Subscription.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },

      // your catalog identifiers
      product_id: { type: DataTypes.STRING, allowNull: false },     // e.g. 'pro'

      // cadence
      interval:       { type: DataTypes.STRING, allowNull: false, defaultValue: 'month' }, // 'month' | 'year'
      price_amount:   { type: DataTypes.DECIMAL, allowNull: false }, // '12'
      price_currency: { type: DataTypes.STRING,  allowNull: false }, // 'USD'

      // lifecycle (just one field to keep it simple)
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'inactive' }, // inactive|active|canceled

    },
    {
      sequelize,
      modelName: 'Subscription',
      tableName: 'subscriptions',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['status'] },
        { fields: ['product_id'] },
      ],
    }
  );

  return Subscription;
};