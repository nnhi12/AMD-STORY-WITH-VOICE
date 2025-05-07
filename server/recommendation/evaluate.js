const mongoose = require('mongoose');
const User = require('../models/User');
const Story = require('../models/Story');
const Rating = require('../models/Rating');
const Category = require('../models/Category');
const { contentBasedRecommend } = require('./contentBased');
const { collaborativeRecommend } = require('./collaborative');
const { hybridRecommend } = require('./hybrid');

async function evaluateRecommendation(userId, topN = 5, k = 5) {
    try {
        const user = await User.findById(userId).populate('story_reading preferred_categories');
        if (!user) {
            return { contentBased: { precision: 0, recall: 0, f1: 0 }, collaborative: { precision: 0, recall: 0, f1: 0 }, hybrid: { precision: 0, recall: 0, f1: 0 } };
        }

        // Lấy tất cả truyện
        const allStories = await Story.find().populate('categories');
        // Truyện đã đọc (từ story_reading và Rating)
        const readStoryIds = [
            ...user.story_reading.map(s => s._id.toString()),
            ...(await Rating.find({ user_id: userId })).map(r => r.story_id.toString())
        ];
        const unreadStories = allStories.filter(story => !readStoryIds.includes(story._id.toString()));

        // Tập test (lt): Truyện chưa đọc nhưng liên quan đến preferred_categories
        let lt = [];
        if (user.preferred_categories && user.preferred_categories.length > 0) {
            lt = unreadStories
                .filter(story => story.categories.some(cat => user.preferred_categories.some(pc => pc._id.equals(cat._id))))
                .map(story => story._id.toString());
        }
        if (lt.length === 0) {
            console.log('No unread relevant stories for user:', userId);
            return { contentBased: { precision: 0, recall: 0, f1: 0 }, collaborative: { precision: 0, recall: 0, f1: 0 }, hybrid: { precision: 0, recall: 0, f1: 0 } };
        }

        // Content-based
        const cbResults = await contentBasedRecommend(userId, topN);
        const lrCB = cbResults.map(story => story._id.toString());
        const intersectionCB = lrCB.filter(storyId => lt.includes(storyId));
        const precisionCB = lrCB.length > 0 ? intersectionCB.length / lrCB.length : 0;
        const recallCB = lt.length > 0 ? intersectionCB.length / lt.length : 0;
        const f1CB = (precisionCB + recallCB) > 0 ? (2 * precisionCB * recallCB) / (precisionCB + recallCB) : 0;

        // Collaborative
        const cfResults = await collaborativeRecommend(userId, topN, k);
        const lrCF = cfResults.map(story => story._id.toString());
        const intersectionCF = lrCF.filter(storyId => lt.includes(storyId));
        const precisionCF = lrCF.length > 0 ? intersectionCF.length / lrCF.length : 0;
        const recallCF = lt.length > 0 ? intersectionCF.length / lt.length : 0;
        const f1CF = (precisionCF + recallCF) > 0 ? (2 * precisionCF * recallCF) / (precisionCF + recallCF) : 0;

        // Hybrid
        const hybridResults = await hybridRecommend(userId, topN);
        const lrHybrid = hybridResults.map(story => story._id.toString());
        const intersectionHybrid = lrHybrid.filter(storyId => lt.includes(storyId));
        const precisionHybrid = lrHybrid.length > 0 ? intersectionHybrid.length / lrHybrid.length : 0;
        const recallHybrid = lt.length > 0 ? intersectionHybrid.length / lt.length : 0;
        const f1Hybrid = (precisionHybrid + recallHybrid) > 0 ? (2 * precisionHybrid * recallHybrid) / (precisionHybrid + recallHybrid) : 0;

        console.log('lt:', lt);
        console.log('lrCB:', lrCB);
        console.log('lrCF:', lrCF);
        console.log('lrHybrid:', lrHybrid);

        return {
            contentBased: { precision: precisionCB, recall: recallCB, f1: f1CB },
            collaborative: { precision: precisionCF, recall: recallCF, f1: f1CF },
            hybrid: { precision: precisionHybrid, recall: recallHybrid, f1: f1Hybrid }
        };
    } catch (error) {
        console.error('Error in evaluateRecommendation:', error.message);
        return { contentBased: { precision: 0, recall: 0, f1: 0 }, collaborative: { precision: 0, recall: 0, f1: 0 }, hybrid: { precision: 0, recall: 0, f1: 0 } };
    }
}

module.exports = { evaluateRecommendation };