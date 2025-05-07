const mongoose = require('mongoose');
const User = require('../models/User');
const Story = require('../models/Story');
const Rating = require('../models/Rating');
const { contentBasedRecommend } = require('./contentBased');
const { collaborativeRecommend } = require('./collaborative');
const { getCachedRecommendations, saveRecommendationsToCache } = require('./cache');

async function hybridRecommend(userId, topN = 5, trainStories = null, trainRatings = null) {
    const cached = await getCachedRecommendations(userId, 'hybrid');
    if (cached) return cached;

    try {
        const user = await User.findById(userId).populate('story_reading');
        if (!user) return [];

        const numInteractions = user.story_reading.length + (await Rating.countDocuments({ user_id: userId }));
        const alpha = numInteractions < 4 ? 0.3 : 0.1;

        const cbResults = await contentBasedRecommend(userId, topN * 2, trainStories) || [];
        const cfResults = await collaborativeRecommend(userId, topN * 2, 5, trainRatings) || [];

        const maxCbScore = Math.max(...cbResults.map((_, i) => 1 / (i + 1)), 1);
        const cbScores = cbResults.reduce((acc, story, index) => {
            acc[story._id.toString()] = (1 / (index + 1)) / maxCbScore;
            return acc;
        }, {});
        const maxCfScore = Math.max(...cfResults.map((_, i) => 1 / (i + 1)), 1);
        const cfScores = cfResults.reduce((acc, story, index) => {
            acc[story._id.toString()] = (1 / (index + 1)) / maxCfScore;
            return acc;
        }, {});

        const combined = [...new Set([...cbResults.map(s => s._id.toString()), ...cfResults.map(s => s._id.toString())])];
        const hybridScores = combined.map(id => {
            const cbScore = cbScores[id] || 0;
            const cfScore = cfScores[id] || 0;
            return { id, score: alpha * cbScore + (1 - alpha) * cfScore };
        });

        const topStories = hybridScores
            .sort((a, b) => b.score - a.score)
            .slice(0, topN)
            .map(s => s.id);
        const results = await Story.find({ _id: { $in: topStories } }).populate('categories');
        await saveRecommendationsToCache(userId, 'hybrid', results);
        return results;
    } catch (error) {
        console.error('Error in hybridRecommend:', error.message);
        return [];
    }
}

module.exports = { hybridRecommend };