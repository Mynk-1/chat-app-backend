// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  socketId: { type: String },
});

module.exports = mongoose.model('User', userSchema);
