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
    fee: Number
}, { versionKey: false }
);

const storyModel = mongoose.model("Story", storySchema)
module.exports = storyModel