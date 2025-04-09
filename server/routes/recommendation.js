const express = require('express');
const router = express.Router();
const { getUserStoryMatrix } = require('../recommendation/matrix');
const { computeSimilarityMatrix } = require('../recommendation/similarity');
const { recommendStories } = require('../recommendation/recommender');

router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const matrix = await getUserStoryMatrix();
    const similarityMatrix = computeSimilarityMatrix(matrix);
    const recommendedStories = await recommendStories(userId, similarityMatrix, matrix);
    res.json(recommendedStories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;