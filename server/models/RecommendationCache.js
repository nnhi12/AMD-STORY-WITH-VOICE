const mongoose = require('mongoose');

const recommendationCacheSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  method: { type: String, enum: ['content-based', 'collaborative', 'hybrid'], required: true },
  recommended_stories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Story' }],
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RecommendationCache', recommendationCacheSchema);