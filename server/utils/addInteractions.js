const mongoose = require('mongoose');
const User = require('../models/User');
const Story = require('../models/Story');
const Rating = require('../models/Rating');

async function addInteractions() {
    try {
        await mongoose.connect('mongodb+srv://reading_story_db:reading_story_db@readingstory.yg6b6.mongodb.net/READING_STORY', { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        const users = await User.find();
        const stories = await Story.find();
        if (stories.length === 0) {
            console.log('No stories found');
            return;
        }

        for (const user of users) {
            // Đảm bảo mỗi user có ít nhất 5-10 story_reading và rating
            const numStories = Math.floor(Math.random() * 6) + 5; // 5-10 truyện
            const storyIds = [];
            for (let i = 0; i < numStories; i++) {
                const randomStory = stories[Math.floor(Math.random() * stories.length)];
                storyIds.push(randomStory._id);
            }
            const uniqueStoryIds = [...new Set(storyIds)];

            // Cập nhật story_reading
            await User.updateOne(
                { _id: user._id },
                { $set: { story_reading: uniqueStoryIds } },
                { upsert: true }
            );

            // Thêm hoặc cập nhật Rating
            const existingRatings = await Rating.find({ user_id: user._id });
            const existingStoryIds = existingRatings.map(r => r.story_id.toString());
            const newRatings = uniqueStoryIds
                .filter(id => !existingStoryIds.includes(id.toString()))
                .map(storyId => ({
                    user_id: user._id,
                    story_id: storyId,
                    rating: Math.floor(Math.random() * 5) + 1, // Điểm từ 1-5
                }));

            if (newRatings.length > 0) {
                await Rating.insertMany(newRatings);
            }

            console.log(`Added/Updated ${uniqueStoryIds.length} stories and ratings for user ${user.fullname}`);
        }

        console.log('Successfully added interactions for all users');
    } catch (error) {
        console.error('Error adding interactions:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

addInteractions();