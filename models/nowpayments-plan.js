// models/nowpaymentPlan.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class NowpaymentPlan extends Model {
    static associate(models) {
      NowpaymentPlan.hasMany(models.Subscription_NowpaymentPlan_Map, {
        foreignKey: 'nowpaymentPlanId',
        as: 'sub_nps',
      });
    }
  }

  NowpaymentPlan.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false, // e.g. "Pro Monthly"
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Billing config
      interval: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'month', // 'day' | 'week' | 'month' | 'year'
      },
      interval_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1, // every 1 month, every 12 months, etc.
      },

      // Pricing
      price_amount: {
        type: DataTypes.DECIMAL,
        allowNull: false,
      },
      price_currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'USD',
      },

      // NOWPayments specific references
      provider_code: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'nowpayments',
      },
      provider_plan_id: {
        type: DataTypes.STRING, // if NOWPayments returns a plan/subscription identifier
        allowNull: true,
      },

      // Lifecycle
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      // Extra info (limits, features, metadata)
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'NowpaymentPlan',
      tableName: 'nowpayment_plans',
      timestamps: true,
      indexes: [
        { fields: ['provider_code'] },
        { fields: ['active'] },
        { unique: true, fields: ['provider_code', 'provider_plan_id'] },
      ],
    }
  );

  return NowpaymentPlan;
};