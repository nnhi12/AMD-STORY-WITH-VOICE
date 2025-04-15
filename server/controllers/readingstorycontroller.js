const express = require('express');
const router = express.Router();

const storyModel = require('../models/Story.js')
const accountModel = require('../models/Account.js');
const userModel = require('../models/User.js');
const readingchapterModel = require('../models/Readingchapter.js');

router.get('/users/:accountId/readingstories', async (req, res) => {
    try {
        const accountId = req.params.accountId;

        // Kiểm tra tài khoản tồn tại
        const account = await accountModel.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        // Tìm user và populate các truyện đọc cùng chapters
        const user = await userModel.findOne({ account: accountId }).populate({
            path: 'story_reading',
            populate: { path: 'chapters', select: 'name' } // Lấy tên chapter
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const currentDate = new Date();
        const readStories = user.story_reading.filter(story => {
            if (!story.date_closed) return true; // Truyện không có ngày đóng
            const endDate = new Date(story.date_closed);
            return endDate >= currentDate; // Nếu ngày đóng >= ngày hiện tại, truyện còn mở
        }).map(story => ({
            ...story.toObject(),
            image: story.image ? story.image.toString('base64') : null, // Convert ảnh sang base64
            chapters: story.chapters.map(chapter => ({
                id: chapter._id,
                name: chapter.name
            }))
        }));

        res.json(readStories);
    } catch (err) {
        console.error('Error fetching followed stories:', err.message);
        res.status(500).send(`Server error: ${err.message}`);
    }
});

router.post('/add-to-reading-list', async (req, res) => {
    const { accountId, storyId } = req.body;
    const user = await userModel.findOne({ account: accountId });
    const story = await storyModel.findById(storyId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    try {

        if (user.story_reading.includes(storyId)) {
            return res.status(400).json({ message: "Story already in reading list." });
        }
        // Find the user and update the reading list
        await userModel.findByIdAndUpdate(user._id, { $push: { story_reading: storyId } });
        if (story.user_reading.includes(user._id)) {
            return res.status(400).json({ message: "User already in reading list." });
        }
        // Find the user and update the reading list
        await storyModel.findByIdAndUpdate(storyId, { $push: { user_reading: user._id } });
        if (user) {
            res.status(200).json({ message: 'Story added to reading list successfully.', user });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }



    } catch (error) {
        res.status(500).json({ message: 'Error adding story to reading list.', error });
    }
});

router.post('/remove-from-reading-list', async (req, res) => {
    const { accountId, storyId } = req.body;
    const user = await userModel.findOne({ account: accountId });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    try {
        // Xóa truyện khỏi danh sách đọc của người dùng
        await userModel.findByIdAndUpdate(user._id, { $pull: { story_reading: storyId } });
        // Xóa người dùng khỏi danh sách đọc của truyện
        await storyModel.findByIdAndUpdate(storyId, { $pull: { user_reading: user._id } });
        // Xóa các bản ghi trong readingchapter có story_id tương ứng
        await readingchapterModel.deleteMany({ story_id: storyId });

        res.status(200).json({ message: 'Story removed from reading list and related records in readingchapter deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing story from reading list.', error });
    }
});

router.get('/users/:accountId/get-reading-progress', async (req, res) => {
    const { accountId } = req.params;
    try {
        // Tìm tài khoản
        const account = await accountModel.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        // Tìm người dùng liên kết với tài khoản
        const user = await userModel.findOne({ account: accountId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Lấy tất cả reading data của người dùng
        const readingDataList = await readingchapterModel.find({ user_id: user._id }).sort({ updated_at: -1 });

        if (!readingDataList || readingDataList.length === 0) {
            return res.status(404).json({ message: 'No reading data found for this user' });
        }

        const progressList = [];

        for (const readingData of readingDataList) {
            const currentChapterId = readingData.chapter_id[0];
            const storyId = readingData.story_id[0];

            // Lấy thông tin truyện
            const story = await storyModel.findById(storyId).populate('chapters');
            if (!story) continue; // Bỏ qua nếu không tìm thấy truyện

            const totalChapters = story.chapters.length;
            const currentChapterIndex = story.chapters.findIndex(chapter => chapter._id.toString() === currentChapterId.toString());

            // Tính tiến trình
            const progress = ((currentChapterIndex + 1) / totalChapters) * 100;

            progressList.push({
                storyId: story._id,
                storyTitle: story.title,
                progress: progress.toFixed(2),
            });
        }

        // Trả về danh sách tiến trình
        res.json(progressList);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error calculating reading progress' });
    }
});

router.get('/users/:accountId/search-reading-story', async (req, res) => {
    try {
      const { accountId } = req.params;
      const { name } = req.query; // Tên truyện để tìm kiếm
  
      if (!name) {
        return res.status(400).json({ message: 'Vui lòng cung cấp tên truyện để tìm kiếm.' });
      }
  
      // Kiểm tra tài khoản tồn tại
      const account = await accountModel.findById(accountId);
      if (!account) {
        return res.status(404).json({ message: 'Tài khoản không tồn tại.' });
      }
  
      // Tìm user và populate story_reading
      const user = await userModel.findOne({ account: accountId }).populate({
        path: 'story_reading',
        select: 'name _id', // Chỉ lấy name và _id của truyện
      });
  
      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại.' });
      }
  
      // Lọc truyện trong story_reading khớp với tên (không phân biệt hoa thường)
      const matchedStories = user.story_reading.filter(story =>
        story.name.toLowerCase().includes(name.toLowerCase())
      );
  
      if (matchedStories.length === 0) {
        return res.status(404).json({ message: `Không tìm thấy truyện ${name} trong thư viện.` });
      }
  
      // Trả về danh sách truyện khớp
      const result = matchedStories.map(story => ({
        _id: story._id,
        name: story.name,
      }));
  
      res.status(200).json(result);
    } catch (err) {
      console.error('Lỗi khi tìm truyện trong thư viện:', err.message);
      res.status(500).json({ message: `Lỗi server: ${err.message}` });
    }
  });

module.exports = router;