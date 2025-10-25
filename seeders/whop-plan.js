const { WhopPlan } = require('../models');

const whopPlan = [
    {
        id: 'plan_RcsgVSvrJryCq',
        name: '25$ Plan',
        price: 25,
        currency: 'USD'
    },
    {
        id: 'plan_EwIouhd6GXwSX',
        name: '50$ Plan',
        price: 50,
        currency: 'USD'
    },  
    {
        id: 'plan_SiYBztFqluMZa',   
        name: '100$ Plan',
        price: 100,
        currency: 'USD'
    },
    {
        id: 'plan_AqdtVNCDpRtQd',
        name: '250$ Plan',
        price: 250,
        currency: 'USD'
    },
    {
        id: 'plan_3xlLdZK29A6xg',
        name: '500$ Plan',
        price: 500,
        currency: 'USD'
    },
    {
        id: 'plan_VWAEKJzj3npFO',
        name: '1000$ Plan',
        price: 1000,
        currency: 'USD'
    }
]

const seedWhopPlan = async (whopId) => {
    return await WhopPlan.bulkCreate(whopPlan.map(plan => ({ ...plan, whopId })));
}

module.exports = seedWhopPlan;