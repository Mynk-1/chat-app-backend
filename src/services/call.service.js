const CallLog = require('../models/callLog.model');

// Written once a call concludes, however it concluded — there's no
// in-progress DB record to reconcile, callSession.service.js is the source
// of truth for live state.
const logCall = async ({ caller, receiver, type, status, startedAt, endedAt }) => {
  const durationSeconds =
    status === 'completed' && endedAt ? Math.max(0, Math.round((endedAt - startedAt) / 1000)) : 0;

  await CallLog.create({
    participants: [caller, receiver],
    caller,
    receiver,
    type,
    status,
    startedAt,
    endedAt,
    durationSeconds,
  });
};

const getCallHistory = async (phoneNumber, limit = 50) => {
  return CallLog.find({ participants: phoneNumber }).sort({ startedAt: -1 }).limit(limit).lean();
};

module.exports = { logCall, getCallHistory };
