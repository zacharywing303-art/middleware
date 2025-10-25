
const handlerWhop = require('./whop-handler');
const handlerOnramp = require('./onramp-handler');
const handlerCryptoSubscription = require('./crypto-handler').handlerCryptoSubscription;
const handlerCryptoInvoice = require('./crypto-handler').handlerCryptoInvoice;

module.exports = {
    whop: handlerWhop,
    onramp: handlerOnramp,
    'crypto-subscription': handlerCryptoSubscription,
    'crypto-invoice': handlerCryptoInvoice
}
