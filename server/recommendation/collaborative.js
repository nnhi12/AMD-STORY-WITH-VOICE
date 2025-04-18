const mongoose = require('mongoose');
const User = require('../models/User');
const Story = require('../models/Story');
const Rating = require('../models/Rating');

async function getUserStoryMatrix() {
    try {
        console.log('Đang lấy đánh giá cho ma trận người dùng-truyện');
        const ratings = await Rating.find().populate('user_id story_id');
        console.log('Đánh giá gốc:', ratings.map(r => ({
            _id: r._id,
            user_id: r.user_id?._id.toString(),
            story_id: r.story_id?._id.toString(),
            rating: r.rating,
        })));

        if (!ratings.length) {
            console.log('Không tìm thấy đánh giá trong cơ sở dữ liệu');
            return {};
        }

        const validRatings = ratings.filter(r => {
            const isValid = r.user_id && r.story_id && typeof r.rating === 'number';
            if (!isValid) {
                console.warn('Bản ghi đánh giá không hợp lệ:', {
                    _id: r._id,
                    user_id: r.user_id?._id.toString(),
                    story_id: r.story_id?._id.toString(),
                    rating: r.rating,
                });
            }
            return isValid;
        });

        console.log('Đánh giá hợp lệ:', validRatings.map(r => ({
            user_id: r.user_id._id.toString(),
            story_id: r.story_id._id.toString(),
            rating: r.rating,
        })));

        if (!validRatings.length) {
            console.log('Không có đánh giá hợp lệ sau khi lọc');
            return {};
        }

        const users = [...new Set(validRatings.map(r => r.user_id._id.toString()))];
        const stories = [...new Set(validRatings.map(r => r.story_id._id.toString()))];
        console.log('Người dùng trong ma trận:', users);
        console.log('Truyện trong ma trận:', stories);

        const matrix = {};
        users.forEach(userId => {
            matrix[userId] = {};
            stories.forEach(storyId => {
                const rating = validRatings.find(
                    r => r.user_id._id.toString() === userId && r.story_id._id.toString() === storyId
                );
                matrix[userId][storyId] = rating ? rating.rating : 0;
            });
        });

        console.log('Ma trận người dùng-truyện:', matrix); // Ghi lại toàn bộ ma trận
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
        console.log('Computing similarity matrix');
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
        console.log('Similarity matrix computed');
        return similarityMatrix;
    } catch (error) {
        console.error('Error in computeSimilarityMatrix:', error.message);
        return {};
    }
}

function getTopKSimilarUsers(userId, similarityMatrix, k) {
    try {
        if (!similarityMatrix[userId]) {
            console.log('No similarity data for user:', userId);
            return [];
        }
        const similarUsers = Object.entries(similarityMatrix[userId])
            .filter(([otherUser]) => otherUser !== userId)
            .sort((a, b) => b[1] - a[1])
            .slice(0, k)
            .map(entry => entry[0]);
        console.log('Top', k, 'similar users for', userId, ':', similarUsers);
        return similarUsers;
    } catch (error) {
        console.error('Error in getTopKSimilarUsers:', error.message);
        return [];
    }
}

async function collaborativeRecommend(userId, topN = 5, k = 5) {
    try {
        console.log('Starting collaborative recommendation for user:', userId);
        const user = await User.findById(userId);
        if (!user) {
            console.log('User not found:', userId);
            return [];
        }

        const matrix = await getUserStoryMatrix();
        if (Object.keys(matrix).length === 0) {
            console.log('No ratings available for collaborative filtering');
            return [];
        }

        const similarityMatrix = computeSimilarityMatrix(matrix);
        if (!similarityMatrix[userId]) {
            console.log('No similarity data for user:', userId);
            return [];
        }

        const similarUsers = getTopKSimilarUsers(userId, similarityMatrix, k);
        if (!similarUsers.length) {
            console.log('No similar users found for:', userId);
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
                predictedRatings[story] = recommendations[story].sumSimRating / recommendations[story].sumSim + Math.random() * 0.05;
            }
        }

        const recommendedStoryIds = Object.entries(predictedRatings)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topN)
            .map(entry => entry[0]);

        console.log('Collaborative recommended stories:', recommendedStoryIds);
        return await Story.find({ _id: { $in: recommendedStoryIds } }).populate('categories');
    } catch (error) {
        console.error('Error in collaborativeRecommend:', error.message);
        return [];
    }
}

module.exports = { collaborativeRecommend };