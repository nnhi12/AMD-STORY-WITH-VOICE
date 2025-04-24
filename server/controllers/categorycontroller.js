const express = require('express');
const router = express.Router();

const storyModel = require('../models/Story.js');
const categoryModel = require('../models/Category.js');
const userModel = require('../models/User.js');

// Hàm hỗ trợ để lấy danh sách age_range phù hợp dựa trên tuổi của user
function getSuitableAgeRanges(userAge) {
    const ageRanges = ['<13', '13-17', '18+', '21+'];
    if (userAge < 13) return ['<13'];
    if (userAge <= 17) return ['<13', '13-17'];
    if (userAge <= 20) return ['<13', '13-17', '18+'];
    return ageRanges; // age >= 21, phù hợp với tất cả
}

router.get('/categories', async (req, res) => {
    try {
        const categories = await categoryModel.find({}, 'name'); // Fetch only category names
        console.log('Fetched categories:', categories);
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error.message);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách thể loại' });
    }
});

// Thể loại
router.get('/categories/:categoryId/stories', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const { userID } = req.query;
        console.log('Categories stories - Received userID:', userID);

        // Yêu cầu userID bắt buộc
        if (!userID) {
            return res.status(401).json({ message: 'UserID là bắt buộc để lấy danh sách truyện' });
        }

        // Lấy thông tin user
        const user = await userModel.findById(userID);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        const suitableAgeRanges = getSuitableAgeRanges(user.age);
        console.log('User age:', user.age, 'Suitable age ranges:', suitableAgeRanges);

        // Tìm truyện theo thể loại, độ tuổi, và date_closed
        const stories = await storyModel.find({
            categories: categoryId,
            age_range: { $in: suitableAgeRanges },
            $or: [
                { date_closed: { $gt: new Date() } }, // Ngày đóng lớn hơn ngày hiện tại
                { date_closed: { $eq: null } } // Không có ngày đóng
            ]
        });

        // Chuyển đổi hình ảnh sang Base64
        const modifiedStories = stories.map(story => ({
            ...story._doc,
            image: story.image ? story.image.toString('base64') : null,
        }));

        console.log('Fetched stories for category:', modifiedStories);
        res.json(modifiedStories);
    } catch (err) {
        console.error('Error fetching stories for category:', err.message);
        res.status(500).json({ message: `Lỗi server: ${err.message}` });
    }
});

router.get('/category-by-name', async (req, res) => {
    try {
        const { name } = req.query; // Lấy tham số name từ query string
        console.log('Category by name - Received name:', name);

        if (!name) {
            return res.status(400).json({ message: 'Vui lòng cung cấp tên thể loại' });
        }

        // Tìm thể loại với tên khớp (không phân biệt hoa thường)
        const category = await categoryModel.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') } // Tìm chính xác, không phân biệt hoa/thường
        });

        if (!category) {
            return res.status(404).json({ message: `Không tìm thấy thể loại ${name}` });
        }

        console.log('Fetched category:', category);
        res.json(category); // Trả về object thể loại duy nhất
    } catch (error) {
        console.error('Error fetching category by name:', error.message);
        res.status(500).json({ message: 'Lỗi khi lấy thể loại theo tên' });
    }
});

module.exports = router;