const mongoose = require('mongoose')

const readingchapterSchema = new mongoose.Schema({
    user_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    story_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Story' }],
    chapter_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' }],
    count_row: Number,
    last_interaction: Date
}, { versionKey: false }
);

const readingchapterModel = mongoose.model("Readingchapter", readingchapterSchema)
module.exports = readingchapterModel