const express = require('express');
const router = express.Router();

const storyModel = require('../models/Story.js');
const categoryModel = require('../models/Category.js');

router.get('/categories', async (req, res) => {
    try {
        const categories = await categoryModel.find({}, 'name'); // Fetch only category names
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
});


//the loai
router.get('/categories/:categoryId/stories', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const stories = await storyModel.find({
            categories: categoryId,
            $or: [
                { date_closed: { $gt: new Date() } }, // Kiểm tra nếu date_closed lớn hơn hoặc bằng ngày hiện tại
                { date_closed: { $eq: null } } // Kiểm tra nếu date_closed là null
            ]
        });
        const modifiedStories = stories.map(story => ({
            ...story._doc,
            image: story.image ? story.image.toString('base64') : null,
        }));

        res.json(modifiedStories);
    } catch (err) {
        console.error('Error fetching stories for category:', err.message);
        res.status(500).send(`Server error: ${err.message}`);
    }
});

module.exports = router;