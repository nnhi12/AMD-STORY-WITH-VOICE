const mongoose = require('mongoose')

const connectDB = async () => {
    try{
        const conn = await mongoose.connect('mongodb+srv://reading_story_db:reading_story_db@readingstory.yg6b6.mongodb.net/READING_STORY');
        console.log(`${conn.connection.host}`);
    } catch(e){
        console.log(e)
        process.exit(1)
    }
};

module.exports = connectDB;