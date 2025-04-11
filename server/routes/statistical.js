const express = require('express');
const router = express.Router();
const storyModel = require('../models/Story.js');

router.get('/for-kids', async (req, res) => {
    try {
        const ageRange = '<13';

        // Gợi ý: bỏ recommendStories nếu không cần cá nhân hoá cho từng user
        const stories = await storyModel.find({ age_range: ageRange });

        // Chuyển ảnh Buffer sang base64 nếu có
        const storiesWithImages = stories.map((story) => {
            if (Buffer.isBuffer(story.image)) {
                return {
                    ...story.toObject(),
                    image: story.image.toString('base64'),
                };
            }
            return story;
        });

        res.json(storiesWithImages);
    } catch (err) {
        console.error('🔥 Lỗi trong /recommend/for-kids:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
});


router.get('/by-age', async (req, res) => {
    try {
        const age = parseInt(req.query.age); // Lấy tuổi từ query parameter

        // Kiểm tra tuổi hợp lệ
        if (isNaN(age) || age < 0) {
            console.log('Tuổi không hợp lệ:', age);
            return res.status(400).json({ message: 'Tuổi không hợp lệ' });
        }

        // Xác định ageRange
        let ageRange;
        if (age < 13) {
            ageRange = '<13';
        } else if (age >= 13 && age <= 17) {
            ageRange = '13-17';
        } else if (age >= 18 && age <= 20) {
            ageRange = '18+';
        } else {
            ageRange = '21+';
        }

        // Tìm truyện
        console.log('Bước 3: Tìm truyện...');
        const stories = await storyModel
            .find({ age_range: ageRange })
            .sort({ view: -1 })
            .limit(5);

        const storiesWithBase64 = stories.map(story => {
            const storyObj = story.toObject();
            if (storyObj.image) {
                storyObj.image = storyObj.image.toString('base64');
            }
            return storyObj;
        });
        res.json(storiesWithBase64);
    } catch (error) {
        console.error('Lỗi trong /recommend/by-age:', error.stack);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

module.exports = router;