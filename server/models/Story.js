const mongoose = require('mongoose')

const storySchema = new mongoose.Schema({
    name: String,
    description: String,
    view: Number,
    status: Boolean,
    image: Buffer,
    created_at: Date,
    updated_at: Date,
    chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    user_reading: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    user_follow: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    date_opened: Date,
    date_closed: Date,
    fee: Number,
    age_range: { type: String, enum: ['<13', '13-17', '18+', '21+'], default: '18+' }, // Thêm trường age_range
    gender_preference: { type: String, enum: ['male', 'female', 'both'], default: 'both' } // Thêm trường gender_preference
}, { versionKey: false }
);

const storyModel = mongoose.model("Story", storySchema)
module.exports = storyModel