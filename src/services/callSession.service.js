// In-memory registry of live call sessions: callId -> session, plus a
// reverse index so "is this user already on a call" is O(1). Same
// single-process caveat as presence.service.js — swap for a shared store
// (e.g. Redis) if this ever runs on more than one instance; every call site
// below is the whole interface the rest of the app depends on.
const sessions = new Map();
const activeCallByUser = new Map();

const create = (callId, { caller, receiver, type }) => {
  const session = {
    callId,
    caller,
    receiver,
    type,
    status: 'ringing',
    startedAt: new Date(),
    ringTimeout: null,
  };
  sessions.set(callId, session);
  activeCallByUser.set(caller, callId);
  activeCallByUser.set(receiver, callId);
  return session;
};

const get = (callId) => sessions.get(callId);

const getActiveCallForUser = (phoneNumber) => {
  const callId = activeCallByUser.get(phoneNumber);
  return callId ? sessions.get(callId) : undefined;
};

const isUserBusy = (phoneNumber) => activeCallByUser.has(phoneNumber);

const accept = (callId) => {
  const session = sessions.get(callId);
  if (!session) return undefined;
  clearTimeout(session.ringTimeout);
  session.status = 'active';
  return session;
};

const setRingTimeout = (callId, handle) => {
  const session = sessions.get(callId);
  if (session) session.ringTimeout = handle;
};

// Removes the session and returns its final snapshot for logging. Safe to
// call more than once for the same callId (e.g. both the ring-timeout and a
// concurrent 'call:end' racing) — only the first call returns a session.
const end = (callId) => {
  const session = sessions.get(callId);
  if (!session) return undefined;

  clearTimeout(session.ringTimeout);
  sessions.delete(callId);
  if (activeCallByUser.get(session.caller) === callId) activeCallByUser.delete(session.caller);
  if (activeCallByUser.get(session.receiver) === callId) activeCallByUser.delete(session.receiver);

  return session;
};

module.exports = { create, get, getActiveCallForUser, isUserBusy, accept, setRingTimeout, end };
