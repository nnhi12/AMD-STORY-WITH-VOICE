const mongoose = require('mongoose')

const authorSchema = new mongoose.Schema({
    name: String,
    description: String,
    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Story' }]
}, { versionKey: false }
);

const authorModel = mongoose.model("Author", authorSchema)
module.exports = authorModel