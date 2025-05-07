const mongoose = require('mongoose');
const User = require('../models/User');
const Story = require('../models/Story');
const Rating = require('../models/Rating');
const Category = require('../models/Category');
async function autoGenerateRatings() {
    try {
        // Kết nối MongoDB nếu chưa kết nối
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb+srv://reading_story_db:reading_story_db@readingstory.yg6b6.mongodb.net/READING_STORY', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('Connected to MongoDB');
        }

        // Lấy tất cả người dùng và truyện
        const users = await User.find().populate('story_reading preferred_categories');
        const stories = await Story.find().populate('categories');
        if (!users.length || !stories.length) {
            console.log('No users or stories found');
            return;
        }

        // Xác định 9 truyện mới (dựa trên created_at hoặc _id)
        const sortedStories = stories.sort((a, b) => b.created_at - a.created_at);
        const newStories = sortedStories.slice(0, 9); // 9 truyện mới nhất
        const newStoryIds = newStories.map(s => s._id.toString());
        console.log('New Stories:', newStoryIds);

        // Lấy tất cả rating hiện có để tránh trùng lặp
        const existingRatings = await Rating.find();
        const existingRatingMap = new Map();
        existingRatings.forEach(r => {
            const key = `${r.user_id.toString()}-${r.story_id.toString()}`;
            existingRatingMap.set(key, true);
        });

        const newRatings = [];

        // Tạo rating cho mỗi người dùng
        for (const user of users) {
            const userId = user._id.toString();
            const storyReadingIds = user.story_reading.map(s => s._id.toString());
            const preferredCategoryIds = user.preferred_categories.map(c => c._id.toString());

            // 1. Rating cho truyện trong story_reading
            for (const storyId of storyReadingIds) {
                const key = `${userId}-${storyId}`;
                if (!existingRatingMap.has(key)) {
                    const story = stories.find(s => s._id.toString() === storyId);
                    const matchesCategories = story.categories.some(c => preferredCategoryIds.includes(c._id.toString()));
                    const rating = matchesCategories ? Math.floor(Math.random() * 2) + 4 : 3; // 4-5 nếu khớp, 3 nếu không
                    newRatings.push({
                        user_id: userId,
                        story_id: storyId,
                        rating,
                        created_at: new Date()
                    });
                    existingRatingMap.set(key, true);
                }
            }

            // 2. Rating cho 1-3 truyện mới
            const shuffledNewStories = newStories.sort(() => Math.random() - 0.5); // Xáo trộn để ngẫu nhiên
            const numNewRatings = Math.floor(Math.random() * 3) + 1; // 1-3 truyện
            for (let i = 0; i < numNewRatings && i < shuffledNewStories.length; i++) {
                const story = shuffledNewStories[i];
                const storyId = story._id.toString();
                const key = `${userId}-${storyId}`;
                if (!existingRatingMap.has(key) && !storyReadingIds.includes(storyId)) {
                    const matchesCategories = story.categories.some(c => preferredCategoryIds.includes(c._id.toString()));
                    const rating = matchesCategories ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 2) + 2; // 4-5 nếu khớp, 2-3 nếu không
                    newRatings.push({
                        user_id: userId,
                        story_id: storyId,
                        rating,
                        created_at: new Date()
                    });
                    existingRatingMap.set(key, true);
                }
            }

            // 3. Rating ngẫu nhiên cho 0-2 truyện ban đầu
            const oldStories = stories.filter(s => !newStoryIds.includes(s._id.toString()));
            const shuffledOldStories = oldStories.sort(() => Math.random() - 0.5);
            const numOldRatings = Math.floor(Math.random() * 3); // 0-2 truyện
            for (let i = 0; i < numOldRatings && i < shuffledOldStories.length; i++) {
                const story = shuffledOldStories[i];
                const storyId = story._id.toString();
                const key = `${userId}-${storyId}`;
                if (!existingRatingMap.has(key) && !storyReadingIds.includes(storyId)) {
                    const matchesCategories = story.categories.some(c => preferredCategoryIds.includes(c._id.toString()));
                    const rating = matchesCategories ? Math.floor(Math.random() * 2) + 3 : Math.floor(Math.random() * 2) + 1; // 3-4 nếu khớp, 1-2 nếu không
                    newRatings.push({
                        user_id: userId,
                        story_id: storyId,
                        rating,
                        created_at: new Date()
                    });
                    existingRatingMap.set(key, true);
                }
            }
        }

        // Lưu rating mới vào database
        if (newRatings.length > 0) {
            await Rating.insertMany(newRatings);
            console.log(`Created ${newRatings.length} new ratings`);
        } else {
            console.log('No new ratings created');
        }

        // Ngắt kết nối MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error in autoGenerateRatings:', error.message);
    }
}

// Chạy hàm
autoGenerateRatings();