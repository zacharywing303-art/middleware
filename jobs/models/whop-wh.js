// models/payment.js
"use strict";
const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class WhopWh extends Model {
    static associate(models) {
      // WhopWh.belongsTo(models.User, { foreignKey: "user_id_local" });
    }
  }

  WhopWh.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      whop_payment_id: { type: DataTypes.STRING, allowNull: false }, // "pay_..."
      action: { type: DataTypes.STRING, allowNull: true },
      raw: { type: DataTypes.JSONB },
    },
    {
      sequelize,
      modelName: "WhopWh",
      tableName: "whop_wh",
      underscored: true,
      timestamps: true, // created_at, updated_at
      indexes: [
        { name: "uniq_whop_payment_id", unique: true, fields: ["whop_payment_id"] },
      ],
    }
  );

  return WhopWh;
};