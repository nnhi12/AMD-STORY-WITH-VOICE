const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: String,
    description: String,
    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Story' }]
}, { versionKey: false });

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;