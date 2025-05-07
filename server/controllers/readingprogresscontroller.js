const express = require('express');
const router = express.Router();

const accountModel = require('../models/Account.js');
const userModel = require('../models/User.js');
const readingchapterModel = require('../models/Readingchapter.js');

router.get('/users/:accountId/stories/:storyId/reading-chapter', async (req, res) => {
    try {
        const { accountId, storyId } = req.params;
        const account = await accountModel.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }
        const user = await userModel.findOne({ account: accountId });
        const record = await readingchapterModel.findOne({ user_id: user._id, story_id: storyId }).populate('chapter_id');
        if (!record) {
            return res.json({ chapter: null, count_row: 0 }); // No reading progress
        }
        res.json({ chapter: record.chapter_id, count_row: record.count_row }); // Current reading progress
    } catch (err) {
        console.error('Error fetching reading chapter:', err);
        res.status(500).send('Server error');
    }
});

router.put('/users/:accountId/stories/:storyId/reading-chapter', async (req, res) => {
    try {
        const { accountId, storyId } = req.params;
        const { chapterId, countRow } = req.body;

        // Kiểm tra xem tài khoản có tồn tại không
        const account = await accountModel.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        // Tìm người dùng từ tài khoản
        const user = await userModel.findOne({ account: accountId });

        // Nếu storyId không có trong danh sách story_reading của người dùng, dừng không thực hiện PUT
        if (!user.story_reading.includes(storyId)) {
            return res.status(200).json({ message: "Story is not in the reading list, no update performed" });
        }

        // Cập nhật hoặc thêm mới record trong readingchapterModel
        const record = await readingchapterModel.findOneAndUpdate(
            { user_id: user._id, story_id: storyId },
            { chapter_id: chapterId, count_row: countRow },
            { new: true, upsert: true } // Cập nhật hoặc chèn nếu không tồn tại
        );

        res.json({ message: 'Reading progress updated successfully', record });
    } catch (err) {
        console.error('Error updating reading chapter:', err);
        res.status(500).send('Server error');
    }
});

//check xem nguoi dung da doc truyen chua
router.get('/checkstory/:userId/stories/:storyId/reading-chapter', async (req, res) => {
    try {
      const { userId, storyId } = req.params;
      const readingData = await readingchapterModel.find({
        user_id: userId,
        story_id: storyId,
      }).populate('chapter_id');
      res.json({ chapter: readingData });
    } catch (error) {
      console.error('Error fetching reading chapter:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

module.exports = router;