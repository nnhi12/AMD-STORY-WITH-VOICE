const mongoose = require('mongoose');
const Story = require('../models/Story');
const User = require('../models/User');
const natural = require('natural');

const TfIdf = natural.TfIdf;

async function contentBasedRecommend(userId, topN = 5) {
    try {
        console.log('Starting content-based recommendation for user:', userId);
        const user = await User.findById(userId).populate('story_reading preferred_categories');
        if (!user) {
            console.log('User not found:', userId);
            return [];
        }

        const stories = await Story.find().populate('categories');
        if (!stories.length) {
            console.log('No stories available');
            return [];
        }

        // Cold-start: Dựa trên preferred_categories
        if (!user.story_reading.length && user.preferred_categories.length) {
            console.log('Using preferred categories for cold-start');
            const filteredStories = stories
                .filter(story => story.categories.some(cat => user.preferred_categories.some(pc => pc._id.equals(cat._id))))
                .sort((a, b) => b.view - a.view);
            const shuffled = filteredStories.sort(() => 0.5 - Math.random());
            //console.log('Cold-start recommendations:', shuffled.slice(0, topN).map(s => s._id));
            return shuffled.slice(0, topN);
        }

        // TF-IDF
        const tfidf = new TfIdf();
        stories.forEach(story => {
            const text = `${story.description || ''} ${story.tags ? story.tags.join(' ') : ''} ${story.categories.map(c => c.name || '').join(' ')}`;
            tfidf.addDocument(text || '');
        });

        const userDocs = user.story_reading.map(story => {
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
                const matches = story.categories.filter(cat => user.preferred_categories.some(pc => pc._id.equals(cat._id))).length;
                score += matches * 0.2;
            }
            // Tăng yếu tố ngẫu nhiên để giảm trùng lặp
            score += Math.random() * 0.1;
            return { id: story._id, score };
        });

        const unreadStories = stories.filter(story => !user.story_reading.some(s => s._id.equals(story._id)));
        const topStories = unreadStories
            .map(story => ({
                id: story._id,
                score: similarities.find(s => s.id.equals(story._id)).score,
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topN)
            .map(s => s.id);

        return await Story.find({ _id: { $in: topStories } }).populate('categories');
    } catch (error) {
        console.error('Error in contentBasedRecommend:', error.message);
        return [];
    }
}

module.exports = { contentBasedRecommend };