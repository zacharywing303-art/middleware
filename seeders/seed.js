const seedUsers = require('./user');
const seedProviders = require('./provider');
const seedWhop = require('./whop');
const seedUserWhopMap = require('./user-whop-map');
const seedWhopPlan = require('./whop-plan');
const seedSubscriptions = require('./subscription');
const seedNowpaymentPlan = require('./nowpayments-plan');
const seedSubscriptionNowpaymentPlanMap = require('./subscription-nowpayment-map');

const seed = async () => {
  const user = await seedUsers();
  const providers = await seedProviders();
  const whops = await seedWhop();
  await seedUserWhopMap(user.id, whops[0].id);
  await seedWhopPlan(whops[0].id);
  await seedSubscriptions(user.id);
  await seedNowpaymentPlan();
  await seedSubscriptionNowpaymentPlanMap();

  console.log('✅ All models synced to the database');
};

seed();