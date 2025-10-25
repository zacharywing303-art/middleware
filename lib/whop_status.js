const whop_status = {
    FAILED:       'payment.failed',
    PENDING:      'payment.pending',
    PAID:         'payment.paid'
  };
  
  const allowedTransitions = {
    [whop_status.PENDING]: [
      whop_status.PAID,
      whop_status.FAILED
    ],
    [whop_status.PAID]: [],
    [whop_status.FAILED]: []
  };
  
  function whop_status_transit_to(state, newState) {
    const nextStates = allowedTransitions[state] || [];
    if (nextStates.includes(newState)) {
      return newState;
    } else {
      console.error(`Invalid transition: ${state} → ${newState}`);
      return state;
    }
  }
  
  module.exports = {
    whop_status,
    whop_status_transit_to
  };