const changelly_status = {
    WAITING:    'waiting',
    CONFIRMING: 'confirming',
    EXCHANGING: 'exchanging',
    SENDING:    'sending',
    FINISHED:   'finished',
    FAILED:     'failed',
    REFUNDED:   'refunded',
    HOLD:       'hold',
    OVERDUE:    'overdue',
    EXPIRED:    'expired'
  };
  
  const allowedTransitions = {
    [changelly_status.WAITING]: [
      changelly_status.CONFIRMING,
      changelly_status.HOLD,
      changelly_status.OVERDUE,
      changelly_status.EXPIRED,
      changelly_status.FAILED
    ],
  
    [changelly_status.CONFIRMING]: [
      changelly_status.EXCHANGING,
      changelly_status.HOLD,
      changelly_status.FAILED,
      changelly_status.REFUNDED
    ],
  
    [changelly_status.EXCHANGING]: [
      changelly_status.SENDING,
      changelly_status.HOLD,
      changelly_status.FAILED,
      changelly_status.REFUNDED
    ],
  
    [changelly_status.SENDING]: [
      changelly_status.FINISHED,
      changelly_status.HOLD,
      changelly_status.FAILED
    ],
  
    [changelly_status.FINISHED]: [
      changelly_status.REFUNDED // rare, but sometimes post-settlement refund
    ],
  
    [changelly_status.HOLD]: [
      changelly_status.CONFIRMING,
      changelly_status.EXCHANGING,
      changelly_status.SENDING,
      changelly_status.FAILED,
      changelly_status.REFUNDED
    ],
  
    // Terminal states
    [changelly_status.FAILED]:   [],
    [changelly_status.REFUNDED]: [],
    [changelly_status.OVERDUE]:  [],
    [changelly_status.EXPIRED]:  []
  };
  
  function changelly_status_transit_to(state, newState) {
    const nextStates = allowedTransitions[state] || [];
    if (nextStates.includes(newState)) {
      return newState;
    } else {
      console.error(`Invalid transition: ${state} → ${newState}`);
      return state;
    }
  }
  
  module.exports = {
    changelly_status,
    changelly_status_transit_to
  };