const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {

    class UserWhopMap extends Model {
        static associate(models) {
            UserWhopMap.belongsTo(models.User, { foreignKey: 'userId' });
            UserWhopMap.belongsTo(models.Whop, { foreignKey: 'whopId' });
        }
    }

    UserWhopMap.init({
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        whopId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'UserWhopMap',
    });

    return UserWhopMap; 
}