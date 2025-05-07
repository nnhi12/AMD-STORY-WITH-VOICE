const mongoose = require('mongoose');
const RecommendationCache = require('../models/RecommendationCache');
const Story = require('../models/Story');

async function getCachedRecommendations(userId, method) {
    try {
        const cache = await RecommendationCache.findOne({ user_id: userId, method });
        if (cache && cache.updated_at > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            return await Story.find({ _id: { $in: cache.recommended_stories } }).populate('categories');
        }
        return null;
    } catch (error) {
        console.error(`Error in getCachedRecommendations (${method}):`, error.message);
        return null;
    }
}

async function saveRecommendationsToCache(userId, method, recommendedStories) {
    try {
        await RecommendationCache.findOneAndUpdate(
            { user_id: userId, method },
            {
                user_id: userId,
                method,
                recommended_stories: recommendedStories.map(s => s._id),
                updated_at: new Date(),
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error(`Error in saveRecommendationsToCache (${method}):`, error.message);
    }
}

async function clearCacheForUser(userId, method) {
    try {
        await RecommendationCache.deleteOne({ user_id: userId, method });
    } catch (error) {
        console.error(`Error in clearCacheForUser (${method}):`, error.message);
    }
}

module.exports = { getCachedRecommendations, saveRecommendationsToCache, clearCacheForUser };