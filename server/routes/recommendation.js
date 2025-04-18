const express = require('express');
const router = express.Router();
const { contentBasedRecommend } = require('../recommendation/contentBased');
const { collaborativeRecommend } = require('../recommendation/collaborative');
const { hybridRecommend } = require('../recommendation/hybrid');
const { getCachedRecommendations, saveRecommendationsToCache, clearCacheForUser } = require('../recommendation/cache');
const categoryModel = require('../models/Category');
const storyModel = require('../models/Story');
const userModel = require('../models/User');

async function getRecommendations(userId, method, forceRefresh = false) {
    try {
        console.log(`Fetching ${method} recommendations for user: ${userId}, refresh: ${forceRefresh}`);
        if (forceRefresh) {
            await clearCacheForUser(userId, method);
        }

        let recommendedStories = await getCachedRecommendations(userId, method);
        if (!recommendedStories) {
            console.log(`No cache found, computing ${method} recommendations`);
            if (method === 'content-based') {
                recommendedStories = await contentBasedRecommend(userId);
            } else if (method === 'collaborative') {
                recommendedStories = await collaborativeRecommend(userId);
            } else if (method === 'hybrid') {
                recommendedStories = await hybridRecommend(userId);
            } else {
                throw new Error(`Invalid method: ${method}`);
            }
            if (recommendedStories.length > 0) {
                await saveRecommendationsToCache(userId, method, recommendedStories);
            } else {
                console.log(`No recommendations generated for ${method}`);
            }
        }
        return recommendedStories.map(story => {
            const storyObj = story.toObject();
            if (storyObj.image) {
                storyObj.image = storyObj.image.toString('base64');
            }
            return storyObj;
        });
    } catch (error) {
        console.error(`Error in getRecommendations (${method}):`, error.message);
        throw error;
    }
}

router.get('/content-based/:userId', async (req, res) => {
    try {
        const forceRefresh = req.query.refresh === 'true';
        const stories = await getRecommendations(req.params.userId, 'content-based', forceRefresh);
        res.json(stories);
    } catch (error) {
        console.error('Error in /content-based:', error.message);
        res.status(500).json({ message: 'Lỗi khi lấy gợi ý dựa trên nội dung', error: error.message });
    }
});

router.get('/collaborative/:userId', async (req, res) => {
    try {
        const forceRefresh = req.query.refresh === 'true';
        const stories = await getRecommendations(req.params.userId, 'collaborative', forceRefresh);
        res.json(stories);
    } catch (error) {
        console.error('Error in /collaborative:', error.message);
        res.status(500).json({ message: 'Lỗi khi lấy gợi ý dựa trên người dùng tương tự', error: error.message });
    }
});

router.get('/hybrid/:userId', async (req, res) => {
    try {
        const forceRefresh = req.query.refresh === 'true';
        const stories = await getRecommendations(req.params.userId, 'hybrid', forceRefresh);
        res.json(stories);
    } catch (error) {
        console.error('Error in /hybrid:', error.message);
        res.status(500).json({ message: 'Lỗi khi lấy gợi ý kết hợp', error: error.message });
    }
});

router.get('/category/:categoryId', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        console.log('Fetching category:', categoryId);

        const category = await categoryModel.findById(categoryId);
        if (!category) {
            console.log('Category not found:', categoryId);
            return res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }
        res.json(category);
    } catch (error) {
        console.error('Error in /category:', error.message);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.get('/by-category/:category', async (req, res) => {
    try {
        const category = req.params.category;
        console.log('Fetching stories for category:', category);
        const topStories = await storyModel
            .find({ categories: category })
            .sort({ view: -1 })
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
        console.error('Error in /by-category:', error.message);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.get('/by-age/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('Fetching stories by age for user:', userId);
        const user = await userModel.findById(userId);
        if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

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
        console.error('Error in /by-age:', error.message);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.get('/by-gender/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('Fetching stories by gender for user:', userId);
        const user = await userModel.findById(userId);
        if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        const genderPreference = user.gender === 'male' ? 'male' : user.gender === 'female' ? 'female' : 'both';
        const stories = await storyModel
            .find({ gender_preference: { $in: [genderPreference, 'both'] } })
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
        console.error('Error in /by-gender:', error.message);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

module.exports = router;