const { randomUUID } = require('crypto');
const callSessionService = require('../../services/callSession.service');
const callService = require('../../services/call.service');
const presenceService = require('../../services/presence.service');
const events = require('../../constants/events');

const RING_TIMEOUT_MS = 30000;

const emitToUser = (io, phoneNumber, event, payload) => {
  presenceService.getSocketIds(phoneNumber).forEach((socketId) => io.to(socketId).emit(event, payload));
};

const otherParty = (session, me) => (session.caller === me ? session.receiver : session.caller);

// The server only relays signaling messages and tracks call *state*
// (ringing/active/who's busy) — it never inspects call:signal payloads
// (SDP/ICE), and never touches media. Registered per-connection like the
// other handlers.
const registerCallHandlers = (io, socket) => {
  const me = socket.user.phoneNumber;

  socket.on(events.CALL_INITIATE, async ({ recipient, type }) => {
    try {
      if (!recipient || !['audio', 'video'].includes(type)) return;

      if (callSessionService.isUserBusy(recipient)) {
        socket.emit(events.CALL_BUSY, { recipient });
        await callService.logCall({
          caller: me,
          receiver: recipient,
          type,
          status: 'busy',
          startedAt: new Date(),
          endedAt: new Date(),
        });
        return;
      }

      if (!presenceService.isOnline(recipient)) {
        socket.emit(events.CALL_ENDED, { reason: 'offline' });
        await callService.logCall({
          caller: me,
          receiver: recipient,
          type,
          status: 'missed',
          startedAt: new Date(),
          endedAt: new Date(),
        });
        return;
      }

      const callId = randomUUID();
      callSessionService.create(callId, { caller: me, receiver: recipient, type });

      emitToUser(io, recipient, events.CALL_INCOMING, { callId, from: me, type });

      const ringTimeout = setTimeout(async () => {
        const session = callSessionService.end(callId);
        if (!session || session.status !== 'ringing') return;

        emitToUser(io, session.caller, events.CALL_ENDED, { callId, reason: 'timeout' });
        emitToUser(io, session.receiver, events.CALL_ENDED, { callId, reason: 'timeout' });

        await callService.logCall({
          caller: session.caller,
          receiver: session.receiver,
          type: session.type,
          status: 'missed',
          startedAt: session.startedAt,
          endedAt: new Date(),
        });
      }, RING_TIMEOUT_MS);

      callSessionService.setRingTimeout(callId, ringTimeout);
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  });

  socket.on(events.CALL_ACCEPT, ({ callId }) => {
    const session = callSessionService.get(callId);
    if (!session || session.receiver !== me || session.status !== 'ringing') return;

    callSessionService.accept(callId);
    emitToUser(io, session.caller, events.CALL_ACCEPTED, { callId });
  });

  socket.on(events.CALL_REJECT, async ({ callId }) => {
    const session = callSessionService.get(callId);
    if (!session || session.receiver !== me) return;

    callSessionService.end(callId);
    emitToUser(io, session.caller, events.CALL_REJECTED, { callId });

    await callService.logCall({
      caller: session.caller,
      receiver: session.receiver,
      type: session.type,
      status: 'rejected',
      startedAt: session.startedAt,
      endedAt: new Date(),
    });
  });

  socket.on(events.CALL_CANCEL, async ({ callId }) => {
    const session = callSessionService.get(callId);
    if (!session || session.caller !== me) return;

    callSessionService.end(callId);
    emitToUser(io, session.receiver, events.CALL_CANCELLED, { callId });

    await callService.logCall({
      caller: session.caller,
      receiver: session.receiver,
      type: session.type,
      status: 'cancelled',
      startedAt: session.startedAt,
      endedAt: new Date(),
    });
  });

  socket.on(events.CALL_END, async ({ callId }) => {
    const session = callSessionService.end(callId);
    if (!session) return;

    emitToUser(io, otherParty(session, me), events.CALL_ENDED, { callId });

    await callService.logCall({
      caller: session.caller,
      receiver: session.receiver,
      type: session.type,
      status: session.status === 'active' ? 'completed' : 'cancelled',
      startedAt: session.startedAt,
      endedAt: new Date(),
    });
  });

  socket.on(events.CALL_SIGNAL, ({ callId, data }) => {
    const session = callSessionService.get(callId);
    if (!session) return;
    emitToUser(io, otherParty(session, me), events.CALL_SIGNAL, { callId, data });
  });

  // If this user drops mid-call (tab closed, network loss), the other side
  // still needs to know the call is over instead of ringing/hanging forever.
  socket.on('disconnect', async () => {
    const session = callSessionService.getActiveCallForUser(me);
    if (!session) return;

    callSessionService.end(session.callId);
    emitToUser(io, otherParty(session, me), events.CALL_ENDED, { callId: session.callId, reason: 'disconnected' });

    await callService.logCall({
      caller: session.caller,
      receiver: session.receiver,
      type: session.type,
      status: session.status === 'active' ? 'completed' : 'missed',
      startedAt: session.startedAt,
      endedAt: new Date(),
    });
  });
};

module.exports = registerCallHandlers;
