const { contentBasedRecommend } = require('./contentBased');
const { collaborativeRecommend } = require('./collaborative');
const User = require('../models/User');
const Rating = require('../models/Rating');
const Story = require('../models/Story');

async function hybridRecommend(userId, topN = 5) {
    try {
        console.log('Starting hybrid recommendation for user:', userId);
        const user = await User.findById(userId).populate('story_reading');
        if (!user) {
            console.log('User not found:', userId);
            return [];
        }

        const numInteractions = user.story_reading.length + (await Rating.countDocuments({ user_id: userId }));
        const alpha = numInteractions < 10 ? 0.6 : 0.4;
        //console.log('Interaction count:', numInteractions, 'Alpha:', alpha);

        const cbResults = (await contentBasedRecommend(userId, topN * 2)) || [];
        const cfResults = (await collaborativeRecommend(userId, topN * 2)) || [];
        //console.log('Content-based results:', cbResults.length, 'Collaborative results:', cfResults.length);

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
            return { id, score: alpha * cbScore + (1 - alpha) * cfScore + Math.random() * 0.05 };
        });

        const topStories = hybridScores
            .sort((a, b) => b.score - a.score)
            .slice(0, topN)
            .map(s => s.id);
        return await Story.find({ _id: { $in: topStories } }).populate('categories');
    } catch (error) {
        console.error('Error in hybridRecommend:', error.message);
        return [];
    }
}

module.exports = { hybridRecommend };