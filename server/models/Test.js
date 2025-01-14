const mongoose = require('mongoose')

const testSchema = new mongoose.Schema({
    username: String,
    password: String
}
)

const testModel = mongoose.model("Test", testSchema)
module.exports = testModel