const mongoose = require('mongoose')

const categroySchema = new mongoose.Schema({
    name: String,
    description: String,
    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Story' }]
}, { versionKey: false }
);

const categoryModel = mongoose.model("Category", categroySchema)
module.exports = categoryModel