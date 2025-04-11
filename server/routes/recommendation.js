const express = require('express');
const router = express.Router();
const { getUserStoryMatrix } = require('../recommendation/matrix');
const { computeSimilarityMatrix } = require('../recommendation/similarity');
const { recommendStories } = require('../recommendation/recommender');
const userModel = require('../models/User.js');
const storyModel = require('../models/Story.js');
const categoryModel = require('../models/Category.js')

router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const matrix = await getUserStoryMatrix();
    const similarityMatrix = computeSimilarityMatrix(matrix);
    const recommendedStories = await recommendStories(userId, similarityMatrix, matrix);

    // Chuyển đổi Buffer sang Base64 cho trường image
    const storiesWithBase64 = recommendedStories.map(story => {
      const storyObj = story.toObject(); // Chuyển Mongoose document thành plain JS object
      if (storyObj.image) {
        storyObj.image = storyObj.image.toString('base64'); // Chuyển Buffer thành Base64
      }
      return storyObj;
    });

    res.json(storiesWithBase64);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/category/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    console.log('Bước 1: Đang xử lý /category cho categoryId:', categoryId);

    const category = await categoryModel.findById(categoryId);
    if (!category) {
      console.log('Không tìm thấy danh mục:', categoryId);
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    console.log('Bước 2: Danh mục tìm thấy:', category);

    res.json(category);
  } catch (error) {
    console.error('Lỗi trong /category:', error.stack);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.get('/by-category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const topStories = await storyModel
      .find({ categories: category})
      .sort({ view: -1 }) // Sắp xếp theo lượt xem giảm dần
      .limit(5);

    const storiesWithBase64 = topStories.map(story => {
      const storyObj = story.toObject();
      if (storyObj.image) {
        storyObj.image = storyObj.image.toString('base64');
      }
      return storyObj;
    });

    res.json(storiesWithBase64);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Route mới: Gợi ý truyện hợp với độ tuổi
router.get('/by-age/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Xác định độ tuổi phù hợp
    let ageRange;
    if (user.age < 13) {
      ageRange = '<13';
    } else if (user.age >= 13 && user.age <= 17) {
      ageRange = '13-17';
    } else if (user.age >= 18 && user.age <= 20) {
      ageRange = '18+';
    } else {
      ageRange = '21+';
    }

    const stories = await storyModel
      .find({ age_range: ageRange})
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
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Route mới: Gợi ý truyện theo giới tính
router.get('/by-gender/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const genderPreference = user.gender === 'male' ? 'male' : user.gender === 'female' ? 'female' : 'both';
    const stories = await storyModel
      .find({ gender_preference: { $in: [genderPreference, 'both'] }})
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
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;