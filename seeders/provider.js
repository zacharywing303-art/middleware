const { Provider } = require('../models');

const providers = [
    {
        name: 'Whop',
    },
    {
        name: 'Fiat Onramp',
    },
    {
        name: 'Crypto',
    }
]   

const seedProviders = async () => {
    await Provider.destroy({ where: {} });
    await Provider.bulkCreate(providers);
}

module.exports = seedProviders;