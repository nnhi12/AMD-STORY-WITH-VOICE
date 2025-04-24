const mongoose = require('mongoose')

const accountSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: String,
    status: Boolean
}, { versionKey: false }
);

const accountModel = mongoose.model("Account", accountSchema)
module.exports = accountModel