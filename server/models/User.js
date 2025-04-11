const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    account: String,
    fullname: String,
    image: { type: Buffer, default: Buffer.from('') },
    age: { type: Number, default: 0 }, // Đặt về 0 nếu không có độ tuổi
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
    email: String,
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    story_reading: { type: [mongoose.Schema.Types.ObjectId], ref: 'Story'},
    story_following: { type: [mongoose.Schema.Types.ObjectId], ref: 'Story' }
}, { versionKey: false }
);

const userModel = mongoose.model("User", userSchema)
module.exports = userModel