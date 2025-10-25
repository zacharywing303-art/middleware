const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    
    class WhopPlan extends Model {
        static associate(models) {
            WhopPlan.belongsTo(models.Whop, { foreignKey: 'whopId' });
        }
    }

    WhopPlan.init({
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
        },
        whopId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        currency: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    }, {
        sequelize,
        modelName: 'WhopPlan',
    });

    return WhopPlan;
}


