const Story = require('../models/Story');

function getTopKSimilarUsers(userId, similarityMatrix, k) {
  const similarities = similarityMatrix[userId];
  return Object.entries(similarities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(entry => entry[0]);
}

async function recommendStories(userId, similarityMatrix, matrix, k = 5) {
  const similarUsers = getTopKSimilarUsers(userId, similarityMatrix, k);
  const userStories = matrix[userId];
  const recommendations = {};

  similarUsers.forEach(similarUser => {
    for (let story in matrix[similarUser]) {
      if (matrix[similarUser][story] === 1 && userStories[story] === 0) {
        recommendations[story] = (recommendations[story] || 0) + similarityMatrix[userId][similarUser];
      }
    }
  });

  const recommendedStoryIds = Object.entries(recommendations)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);

  const stories = await Story.find({ _id: { $in: recommendedStoryIds } });
  return stories;
}

module.exports = { recommendStories };