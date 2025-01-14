const mongoose = require('mongoose')

const accountSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: String,
    status: Boolean,
    start_date: Date,
    end_date: Date
}, { versionKey: false }
);

const accountModel = mongoose.model("Account", accountSchema)
module.exports = accountModel