const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
    message: String,
    created_at: Date
}, { versionKey: false }
);

const commentModel = mongoose.model("Comment", commentSchema)
module.exports = commentModel