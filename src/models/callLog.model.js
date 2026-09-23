const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  participants: { type: [String], required: true },
  caller: { type: String, required: true },
  receiver: { type: String, required: true },
  type: { type: String, enum: ['audio', 'video'], required: true },
  status: {
    type: String,
    enum: ['completed', 'missed', 'rejected', 'busy', 'cancelled'],
    required: true,
  },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date },
  durationSeconds: { type: Number, default: 0 },
});

// Powers "my call history" (find by either side) sorted newest first.
callLogSchema.index({ participants: 1, startedAt: -1 });

module.exports = mongoose.model('CallLog', callLogSchema);
