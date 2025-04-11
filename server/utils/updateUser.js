const mongoose = require('mongoose');
const userModel = require('../models/User');

mongoose.connect('mongodb+srv://reading_story_db:reading_story_db@readingstory.yg6b6.mongodb.net/READING_STORY', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateUsers() {
  try {
    await userModel.updateMany(
      { gender: { $exists: false } },
      { $set: { gender: 'other' } }
    );
    console.log('Updated users with gender field');
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateUsers();