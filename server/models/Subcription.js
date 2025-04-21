const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account'},
  start_date: Date,
  expired_date: Date,}, { versionKey: false }
);

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

module.exports = Subscription;