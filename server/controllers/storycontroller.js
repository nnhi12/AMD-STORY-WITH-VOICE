const express = require('express');
const router = express.Router();

const userModel = require('../models/User.js');
const accountModel = require('../models/Account.js');
const storyModel = require('../models/Story.js');
const authorModel = require('../models/Author.js');
const ratingModel = require('../models/Rating.js');

// Hàm hỗ trợ để lấy danh sách age_range phù hợp dựa trên tuổi của user
function getSuitableAgeRanges(userAge) {
    const ageRanges = ['<13', '13-17', '18+', '21+'];
    if (userAge < 13) return ['<13'];
    if (userAge <= 17) return ['<13', '13-17'];
    if (userAge <= 20) return ['<13', '13-17', '18+'];
    return ageRanges; // age >= 21, phù hợp với tất cả
}

router.get("/stories", async (req, res) => {
    try {
        const { minChapters, maxChapters, userID } = req.query;

        // Lấy thông tin user nếu có userID
        let suitableAgeRanges = ['<13', '13-17', '18+', '21+']; // Mặc định cho phép tất cả nếu không có user
        if (userID) {
            const user = await userModel.findById(userID);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            suitableAgeRanges = getSuitableAgeRanges(user.age);
        }

        // Xây dựng bộ lọc
        const filter = { age_range: { $in: suitableAgeRanges } };
        if (minChapters) filter.chapterCount = { $gte: parseInt(minChapters) };
        if (maxChapters) filter.chapterCount = { ...filter.chapterCount, $lte: parseInt(maxChapters) };

        // Lấy ngày hiện tại
        const currentDate = new Date();

        // Tính số lượng chapters và kiểm tra ngày đóng của truyện
        const stories = await storyModel.aggregate([
            {
                $lookup: {
                    from: 'chapters',
                    localField: 'chapters',
                    foreignField: '_id',
                    as: 'chapterDetails'
                }
            },
            {
                $addFields: {
                    chapterCount: { $size: '$chapterDetails' },
                    disabled: {
                        $cond: {
                            if: { $eq: ['$date_closed', null] },
                            then: false,
                            else: { $gte: [currentDate, '$date_closed'] }
                        }
                    }
                }
            },
            {
                $match: filter
            }
        ]);

        // Chuyển đổi Buffer hình ảnh sang Base64
        const modifiedStories = stories.map(story => ({
            ...story,
            image: story.image ? story.image.toString('base64') : null,
        }));

        res.json(modifiedStories);
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).send('Error fetching stories');
    }
});

router.get("/searchstory", async (req, res) => {
    const { name, userID } = req.query;

    try {
        // Lấy thông tin user nếu có userID
        let suitableAgeRanges = ['<13', '13-17', '18+', '21+'];
        if (userID) {
            const user = await userModel.findById(userID);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            suitableAgeRanges = getSuitableAgeRanges(user.age);
        }

        // Tìm kiếm truyện theo tên và độ tuổi phù hợp
        const stories = await storyModel.find({
            name: { $regex: name, $options: 'i' },
            age_range: { $in: suitableAgeRanges },
            $or: [
                { date_closed: { $gt: new Date() } },
                { date_closed: { $eq: null } }
            ]
        });

        const modifiedStories = stories.map(story => ({
            ...story._doc,
            image: story.image ? story.image.toString('base64') : null,
        }));

        res.json(modifiedStories);
    } catch (error) {
        console.error('Error searching stories:', error);
        res.status(500).send('Error searching stories');
    }
});

router.get('/stories/:storyId', async (req, res) => {
    try {
        const { userID } = req.query;

        // Lấy thông tin user nếu có userID
        let suitableAgeRanges = ['<13', '13-17', '18+', '21+'];
        if (userID) {
            const user = await userModel.findById(userID);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            suitableAgeRanges = getSuitableAgeRanges(user.age);
        }

        // Tìm truyện và kiểm tra độ tuổi phù hợp
        const story = await storyModel.findOne({
            _id: req.params.storyId,
            age_range: { $in: suitableAgeRanges }
        });
        if (!story) {
            return res.status(404).send('Story not found or not suitable for your age');
        }

        const author = await authorModel.findOne({ stories: story._id });

        const modifiedStory = {
            ...story._doc,
            image: story.image ? story.image.toString('base64') : null,
            author: author ? author.name : null
        };
        res.json(modifiedStory);
    } catch (err) {
        console.error('Error fetching story:', err);
        res.status(500).send('Server error');
    }
});

router.get('/stories/:storyId/chapters', async (req, res) => {
    try {
        const { userID } = req.query;

        // Lấy thông tin user nếu có userID
        let suitableAgeRanges = ['<13', '13-17', '18+', '21+'];
        if (userID) {
            const user = await userModel.findById(userID);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            suitableAgeRanges = getSuitableAgeRanges(user.age);
        }

        // Tìm truyện và kiểm tra độ tuổi phù hợp
        const story = await storyModel.findOne({
            _id: req.params.storyId,
            age_range: { $in: suitableAgeRanges }
        }).populate('chapters');
        if (!story) {
            console.error('Story not found or not suitable for your age:', req.params.storyId);
            return res.status(404).send('Story not found or not suitable for your age');
        }
        res.json(story.chapters);
    } catch (err) {
        console.error('Error fetching chapters:', err);
        res.status(500).send('Server error');
    }
});

router.get('/stories/:storyId/chapters/:chapterId', async (req, res) => {
    try {
        const { userID } = req.query;

        // Lấy thông tin user nếu có userID
        let suitableAgeRanges = ['<13', '13-17', '18+', '21+'];
        if (userID) {
            const user = await userModel.findById(userID);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            suitableAgeRanges = getSuitableAgeRanges(user.age);
        }

        // Tìm truyện và kiểm tra độ tuổi phù hợp
        const story = await storyModel.findOne({
            _id: req.params.storyId,
            age_range: { $in: suitableAgeRanges }
        }).populate('chapters');
        if (!story) {
            console.error('Story not found or not suitable for your age:', req.params.storyId);
            return res.status(404).send('Story not found or not suitable for your age');
        }

        // Kiểm tra nếu chapters là một mảng và tìm chapter
        const chapter = story.chapters.find(chap => chap._id.toString() === req.params.chapterId);
        if (!chapter) {
            console.error('Chapter not found:', req.params.chapterId);
            return res.status(404).send('Chapter not found');
        }

        // Tìm vị trí của chapter trong mảng
        const chapterIndex = story.chapters.findIndex(chap => chap._id.toString() === req.params.chapterId);

        // Lấy chương trước và sau
        const previousChapter = chapterIndex > 0 ? story.chapters[chapterIndex - 1] : null;
        const nextChapter = chapterIndex < story.chapters.length - 1 ? story.chapters[chapterIndex + 1] : null;

        res.json({
            chapter,
            previousId: previousChapter ? previousChapter._id : null,
            nextId: nextChapter ? nextChapter._id : null,
        });
    } catch (err) {
        console.error('Error fetching chapter:', err);
        res.status(500).send('Server error');
    }
});

router.get('/stories/:storyId/first', async (req, res) => {
    try {
        const { accountId } = req.query;

        // Lấy thông tin user nếu có userID
        let user = null;
        let suitableAgeRanges = ['<13', '13-17', '18+', '21+'];
        if (accountId) {
            user = await accountModel.findById(accountId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            suitableAgeRanges = getSuitableAgeRanges(user.age);
        }

        // Tìm truyện và kiểm tra độ tuổi phù hợp
        const story = await storyModel.findOne({
            _id: req.params.storyId,
            age_range: { $in: suitableAgeRanges }
        }).populate('chapters');
        if (!story) {
            return res.status(404).send('Story not found or not suitable for your age');
        }

        if (!story.chapters || story.chapters.length === 0) {
            return res.status(404).send('No chapters found for this story');
        }

        const firstChapter = story.chapters[0];
        if (!firstChapter) {
            return res.status(404).send('First chapter not found');
        }

        let enableChapter = false;
        if (!user && firstChapter.status === false) {
            enableChapter = true;
        } else if (!user && firstChapter.status === true) {
            enableChapter = false;
        } else if (user.status === false && firstChapter.status === false) {
            enableChapter = true;
        } else if (user.status === true && firstChapter.status === false) {
            enableChapter = true;
        } else if (user.status === false && firstChapter.status === true) {
            enableChapter = false;
        } else if (user.status === true && firstChapter.status === true) {
            enableChapter = true;
        }

        res.json({
            firstChapter: firstChapter,
            enableChapter: enableChapter
        });
    } catch (err) {
        console.error('Error fetching first chapter:', err);
        res.status(500).send('Server error');
    }
});

router.get('/stories/:storyId/latest', async (req, res) => {
    try {
        const { accountId } = req.query;

        // Lấy thông tin user nếu có userID
        let user = null;
        let suitableAgeRanges = ['<13', '13-17', '18+', '21+'];
        if (accountId) {
            user = await accountModel.findById(accountId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            suitableAgeRanges = getSuitableAgeRanges(user.age);
        }

        // Tìm truyện và kiểm tra độ tuổi phù hợp
        const story = await storyModel.findOne({
            _id: req.params.storyId,
            age_range: { $in: suitableAgeRanges }
        }).populate('chapters');
        if (!story) {
            return res.status(404).send('Story not found or not suitable for your age');
        }

        if (!story.chapters || story.chapters.length === 0) {
            return res.status(404).send('No chapters found for this story');
        }

        const latestChapter = story.chapters[story.chapters.length - 1];
        if (!latestChapter) {
            return res.status(404).send('Latest chapter not found');
        }

        let enableChapter = false;
        if (!user && latestChapter.status === false) {
            enableChapter = true;
        } else if (!user && latestChapter.status === true) {
            enableChapter = false;
        } else if (user.status === false && latestChapter.status === false) {
            enableChapter = true;
        } else if (user.status === true && latestChapter.status === false) {
            enableChapter = true;
        } else if (user.status === false && latestChapter.status === true) {
            enableChapter = false;
        } else if (user.status === true && latestChapter.status === true) {
            enableChapter = true;
        }

        res.json({
            latestChapter: latestChapter,
            enableChapter: enableChapter
        });
    } catch (err) {
        console.error('Error fetching latest chapter:', err);
        res.status(500).send('Server error');
    }
});

router.get('/stories/:storyId/rating', async (req, res) => {
    try {
        const storyId = req.params.storyId;
        const ratings = await ratingModel.find({ story_id: storyId });

        if (ratings.length === 0) {
            return res.json({ averageRating: 0, totalRatings: 0 });
        }

        const totalRatings = ratings.length;
        const sumRatings = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        const averageRating = (sumRatings / totalRatings).toFixed(1);

        res.json({ averageRating, totalRatings });
    } catch (error) {
        console.error('Error fetching story rating:', error);
        res.status(500).send('Server error');
    }
});

router.post('/stories/:storyId/rating', async (req, res) => {
    try {
        const { user, rating } = req.body;
        const storyId = req.params.storyId;

        let existingRating = await ratingModel.findOne({ user_id: user, story_id: storyId });

        if (existingRating) {
            existingRating.rating = rating;
            existingRating.created_at = new Date();
            await existingRating.save();
        } else {
            const newRating = new ratingModel({
                user_id: user,
                story_id: storyId,
                rating: rating,
                created_at: new Date(),
            });
            await newRating.save();
        }

        res.status(200).send('Rating submitted successfully');
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).send('Server error');
    }
});

module.exports = router;