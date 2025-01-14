const mongoose = require('mongoose')

const chapterSchema = new mongoose.Schema({
    name: String,
    content: String,
    view: Number,
    status: Boolean,
    posted_at: Date,
    updated_at: Date,
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
}, { versionKey: false }
);

const chapterModel = mongoose.model("Chapter", chapterSchema)
module.exports = chapterModel