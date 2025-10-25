// nowpayment_status.js
const nowpayment_status = {
  WAITING:        'waiting',        // initial, waiting for user payment
  CONFIRMING:     'confirming',     // tx seen, waiting confirmations
  CONFIRMED:      'confirmed',      // tx confirmed, not yet settled
  SENDING:        'sending',        // sending to merchant wallet
  PARTIALLY_PAID: 'partially_paid', // user underpaid
  FINISHED:       'finished',       // settled, done
  FAILED:         'failed',         // error
  REFUNDED:       'refunded',       // refunded to user
  EXPIRED:        'expired'         // timed out (7d)
};

const allowedTransitions = {
  [nowpayment_status.WAITING]:        [
    nowpayment_status.CONFIRMING,
    nowpayment_status.PARTIALLY_PAID,
    nowpayment_status.FAILED,
    nowpayment_status.EXPIRED
  ],
  [nowpayment_status.PARTIALLY_PAID]: [
    nowpayment_status.CONFIRMING,
    nowpayment_status.FAILED,
    nowpayment_status.EXPIRED,
    nowpayment_status.FINISHED,
    nowpayment_status.REFUNDED
  ],
  [nowpayment_status.CONFIRMING]:     [
    nowpayment_status.CONFIRMED,
    nowpayment_status.FAILED,
    nowpayment_status.EXPIRED
  ],
  [nowpayment_status.CONFIRMED]:      [
    nowpayment_status.SENDING,
    nowpayment_status.FAILED,
    nowpayment_status.EXPIRED,
    nowpayment_status.REFUNDED
  ],
  [nowpayment_status.SENDING]:        [
    nowpayment_status.FINISHED,
    nowpayment_status.FAILED
  ],
  [nowpayment_status.FINISHED]:       [
    nowpayment_status.REFUNDED
  ],
  [nowpayment_status.FAILED]:         [], // terminal
  [nowpayment_status.REFUNDED]:       [], // terminal
  [nowpayment_status.EXPIRED]:        []  // terminal
};

function nowpayment_status_transit_to(state, newState) {
  const nextStates = allowedTransitions[state] || [];

  if (nextStates.includes(newState)) {
    return newState;
  } else {
    console.error(`Invalid transition: ${state} → ${newState}`);
    return state; // keep old state or throw error
  }
}

module.exports = {
  nowpayment_status,
  nowpayment_status_transit_to
};