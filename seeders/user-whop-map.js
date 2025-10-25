const { UserWhopMap } = require("../models");

const seedUserWhopMap = async (userId, whopId) => {
    await UserWhopMap.bulkCreate([
        {
            userId,
            whopId
        }
    ]);
};

module.exports = seedUserWhopMap;
