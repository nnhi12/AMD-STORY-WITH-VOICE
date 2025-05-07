const mongoose = require('mongoose');
const Story = require('../models/Story');
const User = require('../models/User');
const natural = require('natural');
const { getCachedRecommendations, saveRecommendationsToCache } = require('./cache');

const TfIdf = natural.TfIdf;

async function contentBasedRecommend(userId, topN = 5, trainStories = null) {
    const cached = await getCachedRecommendations(userId, 'content-based');
    if (cached) return cached;

    try {
        console.log('Bắt đầu gợi ý dựa trên nội dung cho user:', userId);

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('userId không hợp lệ');
        }

        const user = await User.findById(userId).populate('story_reading preferred_categories');
        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }

        const stories = await Story.find({}, 'description categories view createdAt').populate('categories');
        if (!stories.length) {
            return [];
        }

        if (!user.story_reading.length && user.preferred_categories.length) {
            const filteredStories = stories
                .filter(story => story.categories.some(cat => 
                    user.preferred_categories.some(pc => pc._id.equals(cat._id))))
                .sort((a, b) => (b.view || 0) - (a.view || 0) || b.createdAt - a.createdAt);
            const results = filteredStories.slice(0, topN);
            await saveRecommendationsToCache(userId, 'content-based', results);
            return results;
        }

        const storiesToUse = trainStories || user.story_reading;

        let tfidf = new TfIdf();
        if (!global.tfidfCache || global.tfidfCacheVersion !== stories.length) {
            stories.forEach(story => {
                const text = `${story.description || ''} ${story.categories.map(c => c.name || '').join(' ')}`;
                tfidf.addDocument(text || '');
            });
            global.tfidfCache = tfidf;
            global.tfidfCacheVersion = stories.length;
        } else {
            tfidf = global.tfidfCache;
        }

        const userDocs = storiesToUse.map(story => {
            const index = stories.findIndex(s => s._id.equals(story._id));
            return tfidf.documents[index] || {};
        });
        const userVector = userDocs.reduce((acc, doc) => {
            Object.keys(doc).forEach(key => {
                acc[key] = (acc[key] || 0) + (doc[key] || 0);
            });
            return acc;
        }, {});

        const similarities = stories.map((story, index) => {
            let score = 0;
            Object.keys(userVector).forEach(term => {
                score += (userVector[term] || 0) * (tfidf.tfidf(term, index) || 0);
            });
            if (user.preferred_categories.length) {
                const matches = story.categories.filter(cat => 
                    user.preferred_categories.some(pc => pc._id.equals(cat._id))).length;
                score += matches * 0.5; // Tăng trọng số từ 0.2 lên 0.5
            }
            return { id: story._id, score };
        });

        const unreadStories = stories.filter(story => 
            !storiesToUse.some(s => s._id.equals(story._id)));

        const topStories = unreadStories
            .map(story => ({
                id: story._id,
                score: similarities.find(s => s.id.equals(story._id)).score,
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topN)
            .map(s => s.id);

        const results = await Story.find({ _id: { $in: topStories } }).populate('categories');
        await saveRecommendationsToCache(userId, 'content-based', results);
        return results;
    } catch (error) {
        console.error('Lỗi trong contentBasedRecommend:', error.message);
        throw new Error(`Không thể tạo gợi ý: ${error.message}`);
    }
}

module.exports = { contentBasedRecommend };