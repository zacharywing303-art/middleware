// models/subscriptionNowpaymentPlan.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  
  class Subscription_NowpaymentPlan_Map extends Model {
    static associate(models) {
      Subscription_NowpaymentPlan_Map.belongsTo(models.Subscription, {
        foreignKey: 'subscriptionId',
      });
      Subscription_NowpaymentPlan_Map.belongsTo(models.NowpaymentPlan, {
        foreignKey: 'nowpaymentPlanId',
      });
    }
  }

  Subscription_NowpaymentPlan_Map.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      subscriptionId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      nowpaymentPlanId: {
        type: DataTypes.UUID,
        allowNull: false,
      }
    },
    {
      sequelize,
      modelName: 'Subscription_NowpaymentPlan_Map',
      tableName: 'subscription_nowpayment_plan_map',
      timestamps: true,
      indexes: [
        { fields: ['subscriptionId'] },
        { fields: ['nowpaymentPlanId'] },,
        { name: 'uniq_sub_nowpay', unique: true, fields: ['subscriptionId', 'nowpaymentPlanId'] },
      ],
    }
  );

  return Subscription_NowpaymentPlan_Map;
};