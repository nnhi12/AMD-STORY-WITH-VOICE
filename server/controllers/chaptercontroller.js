const express = require('express');
const router = express.Router();

const storyModel = require('../models/Story.js');
const chapterModel = require('../models/Chapter.js');

router.put('/chapters/:chapterId/increment-view', async (req, res) => {
    const { chapterId } = req.params;
    try {
        // Find the chapter and increment the view count
        const chapter = await chapterModel.findById(chapterId);
        if (!chapter) {
            return res.status(404).json({ message: 'Chương không tồn tại' });
        }
        chapter.view += 1; // Increment the view count
        await chapter.save(); // Save the changes to the database

        // Find the story from the chapter
        const story = await storyModel.findOne({ chapters: chapterId });
        if (!story) {
            return res.status(404).json({ message: 'Truyện không tồn tại' });
        }
        const totalViews = await chapterModel.aggregate([
            { $match: { _id: { $in: story.chapters } } },
            { $group: { _id: null, totalViews: { $sum: '$view' } } }
        ]);
        story.view = totalViews[0]?.totalViews || 0;
        story.updated_at = new Date(); // Update the timestamp

        await story.save(); // Save the changes to the story

        res.status(200).json({ message: 'Số lượt xem của chapter và story đã được cập nhật', chapter, story });
    } catch (error) {
        console.error('Lỗi khi cập nhật số lượt xem:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

module.exports = router;