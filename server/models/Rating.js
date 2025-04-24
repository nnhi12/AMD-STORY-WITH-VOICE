const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    story_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Story' },
    rating: { type: Number, min: 1, max: 5 },
    created_at: { type: Date, default: Date.now }, // Thêm thời gian đánh giá
}, { versionKey: false });

const ratingModel = mongoose.model("Rating", ratingSchema);
module.exports = ratingModel;