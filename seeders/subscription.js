const { Subscription } = require('../models');

let subscriptions = [
    {
        product_id: 'tier_1',
        interval: 'month',
        price_amount: 299,
        price_currency: 'USD',
        status: 'active'
    },
    {
        product_id: 'tier_2',
        interval: 'month',
        price_amount: 599,
        price_currency: 'USD',
        status: 'active'
    },
    {
        product_id: 'tier_3',
        interval: 'month',
        price_amount: 1599,
        price_currency: 'USD',
        status: 'active'
    },
    {
        product_id: 'tier_1',
        interval: 'year',
        price_amount: 2490,
        price_currency: 'USD',
        status: 'active'
    },
    {
        product_id: 'tier_2',
        interval: 'year',
        price_amount: 4990,
        price_currency: 'USD',
        status: 'active'
    },
    {
        product_id: 'tier_3',
        interval: 'year',
        price_amount: 12990,
        price_currency: 'USD',
        status: 'active'
    }
];
    
const seedSubscriptions = async (userId) => {
    subscriptions.forEach((subscription) => {
        subscription.userId = userId;
    });

    await Subscription.destroy({ where: {} });
    await Subscription.bulkCreate(subscriptions);
};

module.exports = seedSubscriptions;