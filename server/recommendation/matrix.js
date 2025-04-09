const User = require('../models/User');
const Story = require('../models/Story');

async function getUserStoryMatrix() {
  const users = await User.find().populate('story_reading');
  const stories = await Story.find();

  const matrix = {};
  users.forEach(user => {
    matrix[user._id] = {};
    stories.forEach(story => {
      matrix[user._id][story._id] = user.story_reading.some(s => s._id.equals(story._id)) ? 1 : 0;
    });
  });
  return matrix;
}

module.exports = { getUserStoryMatrix };