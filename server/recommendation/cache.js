const mongoose = require('mongoose');
const RecommendationCache = require('../models/RecommendationCache');
const Story = require('../models/Story');

async function getCachedRecommendations(userId, method) {
    try {
        console.log(`Checking cache for user: ${userId}, method: ${method}`);
        const cache = await RecommendationCache.findOne({ user_id: userId, method });
        if (cache && cache.updated_at > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
            console.log(`Cache hit for user: ${userId}, method: ${method}`);
            return await Story.find({ _id: { $in: cache.recommended_stories } }).populate('categories');
        }
        console.log(`Cache miss for user: ${userId}, method: ${method}`);
        return null;
    } catch (error) {
        console.error(`Error in getCachedRecommendations (${method}):`, error.message);
        return null;
    }
}

async function saveRecommendationsToCache(userId, method, recommendedStories) {
    try {
        console.log(`Saving recommendations to cache for user: ${userId}, method: ${method}`);
        await RecommendationCache.findOneAndUpdate(
            { user_id: userId, method }, // Tìm theo user_id và method
            {
                user_id: userId,
                method,
                recommended_stories: recommendedStories.map(s => s._id),
                updated_at: new Date(),
            },
            { upsert: true, new: true }
        );
        console.log(`Cache updated for user: ${userId}, method: ${method}`);
    } catch (error) {
        console.error(`Error in saveRecommendationsToCache (${method}):`, error.message);
    }
}

async function clearCacheForUser(userId, method) {
    try {
        console.log(`Clearing cache for user: ${userId}, method: ${method}`);
        await RecommendationCache.deleteOne({ user_id: userId, method });
        console.log(`Cache cleared for user: ${userId}, method: ${method}`);
    } catch (error) {
        console.error(`Error in clearCacheForUser (${method}):`, error.message);
    }
}

module.exports = { getCachedRecommendations, saveRecommendationsToCache, clearCacheForUser };