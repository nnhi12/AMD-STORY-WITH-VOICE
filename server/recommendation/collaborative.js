const mongoose = require('mongoose');
const User = require('../models/User');
const Story = require('../models/Story');
const Rating = require('../models/Rating');
const { getCachedRecommendations, saveRecommendationsToCache } = require('./cache');

async function getUserStoryMatrix(trainRatings = []) {
    try {
        // Đảm bảo trainRatings là mảng; nếu null/undefined, lấy từ DB
        const ratings = Array.isArray(trainRatings) && trainRatings.length 
            ? trainRatings 
            : await Rating.find().populate('user_id story_id');

        // Log để kiểm tra dữ liệu
        console.log('Ratings:', ratings);

        // Kiểm tra nếu ratings là null hoặc rỗng
        if (!ratings || !Array.isArray(ratings) || !ratings.length) {
            console.warn('Không có đánh giá nào được tìm thấy.');
            return {};
        }

        // Lọc các đánh giá hợp lệ
        const validRatings = ratings.filter(r => 
            r.user_id && r.story_id && typeof r.rating === 'number'
        );
        console.log('Valid Ratings:', validRatings.length);

        if (!validRatings.length) {
            console.warn('Không có đánh giá hợp lệ.');
            return {};
        }

        // Tạo danh sách user và story
        const users = [...new Set(validRatings.map(r => r.user_id._id.toString()))];
        const stories = [...new Set(validRatings.map(r => r.story_id._id.toString()))];
        console.log('Users:', users.length, 'Stories:', stories.length);

        // Tạo ma trận user-story
        const matrix = {};
        users.forEach(userId => {
            matrix[userId] = {};
            stories.forEach(storyId => {
                const rating = validRatings.find(r => 
                    r.user_id._id.toString() === userId && 
                    r.story_id._id.toString() === storyId
                );
                matrix[userId][storyId] = rating ? rating.rating : 0;
            });
        });

        return matrix;
    } catch (error) {
        console.error('Lỗi trong getUserStoryMatrix:', error.message);
        return {};
    }
}

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let key in vecA) {
        dotProduct += vecA[key] * (vecB[key] || 0);
        normA += vecA[key] * vecA[key];
        normB += (vecB[key] || 0) * (vecB[key] || 0);
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    return normA && normB ? dotProduct / (normA * normB) : 0;
}

function computeSimilarityMatrix(matrix) {
    try {
        const similarityMatrix = {};
        const users = Object.keys(matrix);
        for (let i = 0; i < users.length; i++) {
            const userA = users[i];
            similarityMatrix[userA] = {};
            for (let j = 0; j < users.length; j++) {
                const userB = users[j];
                if (userA !== userB) {
                    similarityMatrix[userA][userB] = cosineSimilarity(matrix[userA], matrix[userB]);
                }
            }
        }
        return similarityMatrix;
    } catch (error) {
        console.error('Lỗi trong computeSimilarityMatrix:', error.message);
        return {};
    }
}

function getTopKSimilarUsers(userId, similarityMatrix, k) {
    try {
        if (!similarityMatrix[userId]) return [];
        const similarUsers = Object.entries(similarityMatrix[userId])
            .filter(([otherUser]) => otherUser !== userId)
            .sort((a, b) => b[1] - a[1])
            .slice(0, k)
            .map(entry => entry[0]);
        return similarUsers;
    } catch (error) {
        console.error('Lỗi trong getTopKSimilarUsers:', error.message);
        return [];
    }
}

async function collaborativeRecommend(userId, topN = 5, k = 5, trainRatings = null) {
    const cached = await getCachedRecommendations(userId, 'collaborative');
    if (cached) return cached;

    try {
        const user = await User.findById(userId).populate('preferred_categories');
        if (!user) {
            console.warn('Không tìm thấy user:', userId);
            return [];
        }

        const matrix = await getUserStoryMatrix(trainRatings);
        console.log('Matrix size:', Object.keys(matrix).length);

        if (Object.keys(matrix).length === 0) {
            console.log('Ma trận rỗng, fallback sang gợi ý theo danh mục.');
            const stories = await Story.find().populate('categories');
            const filteredStories = stories
                .filter(story => 
                    story.categories.some(cat => 
                        user.preferred_categories.some(pc => pc._id.equals(cat._id))
                    )
                )
                .sort((a, b) => b.view - a.view)
                .slice(0, topN);
            await saveRecommendationsToCache(userId, 'collaborative', filteredStories);
            return filteredStories;
        }

        const similarityMatrix = computeSimilarityMatrix(matrix);
        if (!similarityMatrix[userId]) {
            console.warn('Không có ma trận tương tự cho user:', userId);
            return [];
        }

        const similarUsers = getTopKSimilarUsers(userId, similarityMatrix, k);
        if (!similarUsers.length) {
            console.warn('Không tìm thấy user tương tự.');
            return [];
        }

        const userStories = matrix[userId] || {};
        const recommendations = {};
        similarUsers.forEach(similarUser => {
            for (let story in matrix[similarUser]) {
                if (!(story in userStories) || userStories[story] === 0) {
                    const similarity = similarityMatrix[userId][similarUser];
                    const rating = matrix[similarUser][story];
                    if (!recommendations[story]) {
                        recommendations[story] = { sumSim: 0, sumSimRating: 0 };
                    }
                    recommendations[story].sumSim += similarity;
                    recommendations[story].sumSimRating += similarity * rating;
                }
            }
        });

        const predictedRatings = {};
        for (let story in recommendations) {
            if (recommendations[story].sumSim > 0) {
                predictedRatings[story] = recommendations[story].sumSimRating / recommendations[story].sumSim;
            }
        }

        const recommendedStoryIds = Object.entries(predictedRatings)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(entry => entry[0]);

        const results = await Story.find({ _id: { $in: recommendedStoryIds } }).populate('categories');
        await saveRecommendationsToCache(userId, 'collaborative', results);
        return results;
    } catch (error) {
        console.error('Lỗi trong collaborativeRecommend:', error.message);
        return [];
    }
}

module.exports = { collaborativeRecommend };