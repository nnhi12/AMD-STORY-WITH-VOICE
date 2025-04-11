const mongoose = require('mongoose');
const storyModel = require('../models/Story');

mongoose.connect('mongodb+srv://reading_story_db:reading_story_db@readingstory.yg6b6.mongodb.net/READING_STORY', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateStories() {
  try {
    await storyModel.updateMany(
      { age_range: { $exists: false }, gender_preference: { $exists: false } },
      { $set: { age_range: '18-25', gender_preference: 'both' } }
    );
    console.log('Updated stories with age_range and gender_preference fields');
  } catch (error) {
    console.error('Error updating stories:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateStories();