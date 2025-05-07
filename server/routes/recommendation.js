const express = require('express');
const router = express.Router();
const { contentBasedRecommend } = require('../recommendation/contentBased');
const { collaborativeRecommend } = require('../recommendation/collaborative');
const { hybridRecommend } = require('../recommendation/hybrid');
const { getCachedRecommendations, saveRecommendationsToCache, clearCacheForUser } = require('../recommendation/cache');
const categoryModel = require('../models/Category');
const storyModel = require('../models/Story');
const userModel = require('../models/User');

// Hàm hỗ trợ để lấy danh sách age_range phù hợp dựa trên tuổi của user
function getSuitableAgeRanges(userAge) {
    const ageRanges = ['<13', '13-17', '18+', '21+'];
    if (userAge < 13) return ['<13'];
    if (userAge <= 17) return ['<13', '13-17'];
    if (userAge <= 20) return ['<13', '13-17', '18+'];
    return ageRanges; // age >= 21, phù hợp với tất cả
}

async function getRecommendations(userId, method, forceRefresh = false) {
    try {
        console.log(`Fetching ${method} recommendations for user: ${userId}, refresh: ${forceRefresh}`);
        
        // Lấy thông tin user để xác định suitableAgeRanges
        const user = await userModel.findById(userId);
        if (!user) {
            throw new Error('Không tìm thấy người dùng');
        }
        const suitableAgeRanges = getSuitableAgeRanges(user.age);
        console.log('User age:', user.age, 'Suitable age ranges:', suitableAgeRanges);

        // Kiểm tra cache
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

            // Lọc truyện theo suitableAgeRanges
            recommendedStories = recommendedStories.filter(story => 
                suitableAgeRanges.includes(story.age_range)
            );

            if (recommendedStories.length > 0) {
                await saveRecommendationsToCache(userId, method, recommendedStories);
            } else {
                console.log(`No recommendations generated for ${method} after age filtering`);
            }
        } else {
            // Lọc lại cache theo suitableAgeRanges (đề phòng cache cũ)
            recommendedStories = recommendedStories.filter(story => 
                suitableAgeRanges.includes(story.age_range)
            );
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

router.get('/contentBased/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'UserID là bắt buộc để lấy gợi ý' });
        }
        const forceRefresh = req.query.refresh === 'true';
        const stories = await getRecommendations(userId, 'content-based', forceRefresh);
        console.log('Content-based recommendations:', stories);
        res.json(stories);
    } catch (error) {
        console.error('Error in /content-based:', error.message);
        res.status(error.message === 'Không tìm thấy người dùng' ? 404 : 500).json({ 
            message: error.message === 'Không tìm thấy người dùng' 
                ? 'Không tìm thấy người dùng' 
                : 'Lỗi khi lấy gợi ý dựa trên nội dung', 
            error: error.message 
        });
    }
});

router.get('/collaborative/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'UserID là bắt buộc để lấy gợi ý' });
        }
        const forceRefresh = req.query.refresh === 'true';
        const stories = await getRecommendations(userId, 'collaborative', forceRefresh);
        console.log('Collaborative recommendations:', stories);
        res.json(stories);
    } catch (error) {
        console.error('Error in /collaborative:', error.message);
        res.status(error.message === 'Không tìm thấy người dùng' ? 404 : 500).json({ 
            message: error.message === 'Không tìm thấy người dùng' 
                ? 'Không tìm thấy người dùng' 
                : 'Lỗi khi lấy gợi ý dựa trên người dùng tương tự', 
            error: error.message 
        });
    }
});

router.get('/hybrid/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'UserID là bắt buộc để lấy gợi ý' });
        }
        const forceRefresh = req.query.refresh === 'true';
        const stories = await getRecommendations(userId, 'hybrid', forceRefresh);
        console.log('Hybrid recommendations:', stories);
        res.json(stories);
    } catch (error) {
        console.error('Error in /hybrid:', error.message);
        res.status(error.message === 'Không tìm thấy người dùng' ? 404 : 500).json({ 
            message: error.message === 'Không tìm thấy người dùng' 
                ? 'Không tìm thấy người dùng' 
                : 'Lỗi khi lấy gợi ý kết hợp', 
            error: error.message 
        });
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
        res.status(500).json({ message: 'Lỗi khi lấy danh mục', error: error.message });
    }
});

router.get('/by-category/:category', async (req, res) => {
    try {
      const category = req.params.category;
      const topStories = await storyModel
        .find({ categories: category })
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
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

router.get('/by-gender/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('Fetching stories by gender for user:', userId);

        if (!userId) {
            return res.status(401).json({ message: 'UserID là bắt buộc để lấy truyện theo giới tính' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const suitableAgeRanges = getSuitableAgeRanges(user.age);
        console.log('User age:', user.age, 'Suitable age ranges:', suitableAgeRanges);

        const genderPreference = user.gender === 'male' ? 'male' : user.gender === 'female' ? 'female' : 'both';
        const stories = await storyModel
            .find({ 
                gender_preference: { $in: [genderPreference, 'both'] },
                age_range: { $in: suitableAgeRanges }
            })
            .sort({ view: -1 })
            .limit(5);

        const storiesWithBase64 = stories.map(story => {
            const storyObj = story.toObject();
            if (storyObj.image) {
                storyObj.image = storyObj.image.toString('base64');
            }
            return storyObj;
        });

        console.log('Stories by gender:', storiesWithBase64);
        res.json(storiesWithBase64);
    } catch (error) {
        console.error('Error in /by-gender:', error.message);
        res.status(500).json({ message: 'Lỗi khi lấy truyện theo giới tính', error: error.message });
    }
});

module.exports = router;