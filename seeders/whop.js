const { Whop } = require('../models');

const whop = [
    {
        name: 'Whop GirlFriend',
        api_key: 'A6Ac-DVO1S4JyA_aII-KF__3PQ0RR5YUDxiY3BR1R2k',
        webhook_url: 'http://localhost:3000/whop/webhook',
        product_id: 'prod_4wvdtBfP6fWNg'
    }
]   

const seedWhop = async () => {
    return await Whop.bulkCreate(whop);
}

module.exports = seedWhop;