const express = require('express');
const router = express.Router();

const storyModel = require('../models/Story.js')
const accountModel = require('../models/Account.js');
const userModel = require('../models/User.js');

router.get('/users/:accountId/followingstories', async (req, res) => {
    try {
        const accountId = req.params.accountId;

        // Kiểm tra tài khoản tồn tại
        const account = await accountModel.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        // Tìm user và populate các truyện đang theo dõi cùng chapters
        const user = await userModel.findOne({ account: accountId }).populate({
            path: 'story_following',
            populate: { path: 'chapters', select: 'name' } // Lấy tên chapter
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Lọc các truyện đã hết hạn
        const currentDate = new Date();
        const followingStories = user.story_following.filter(story => {
            if (!story.date_closed) return true; // Truyện không có ngày đóng
            const endDate = new Date(story.date_closed);
            return endDate > currentDate; // Nếu ngày đóng >= ngày hiện tại, truyện còn mở
        }).map(story => ({
            ...story.toObject(),
            image: story.image ? story.image.toString('base64') : null, // Convert ảnh sang base64
            chapters: story.chapters.map(chapter => ({
                id: chapter._id,
                name: chapter.name
            }))
        }));

        res.json(followingStories);
    } catch (err) {
        console.error('Error fetching followed stories:', err.message);
        res.status(500).send(`Server error: ${err.message}`);
    }
});

router.post('/add-to-follow-list', async (req, res) => {
    const { accountId, storyId } = req.body;
    const user = await userModel.findOne({ account: accountId });
    const story = await storyModel.findById(storyId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    try {
        if (user.story_following.includes(storyId)) {
            return res.status(400).json({ message: "Story already in reading list." });
        }
        // Find the user and update the reading list
        await userModel.findByIdAndUpdate(user._id, { $push: { story_following: storyId } });

        if (story.user_follow.includes(user._id)) {
            return res.status(400).json({ message: "User already in reading list." });
        }
        // Find the user and update the following list
        await storyModel.findByIdAndUpdate(storyId, { $push: { user_follow: user._id } });

        if (user) {
            res.status(200).json({ message: 'Story added to reading list successfully.', user });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error adding story to reading list.', error });
    }
});

router.post('/remove-from-follow-list', async (req, res) => {
    const { accountId, storyId } = req.body;
    const user = await userModel.findOne({ account: accountId });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    try {
        // Find the user and remove the story from the following list
        await userModel.findByIdAndUpdate(user._id, { $pull: { story_following: storyId } });
        await storyModel.findByIdAndUpdate(storyId, { $pull: { user_follow: user._id } });

        res.status(200).json({ message: 'Story removed from following list successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing story from following list.', error });
    }
});

module.exports = router;