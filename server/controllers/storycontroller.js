const express = require('express');
const router = express.Router();

const accountModel = require('../models/Account.js');
const storyModel = require('../models/Story.js');
const authorModel = require('../models/Author.js');

router.get("/stories", async (req, res) => {
    try {
        const { minChapters, maxChapters } = req.query;

        // Xây dựng bộ lọc
        const filter = {};
        if (minChapters) filter.chapterCount = { $gte: parseInt(minChapters) };
        if (maxChapters) filter.chapterCount = { ...filter.chapterCount, $lte: parseInt(maxChapters) };

        // Lấy ngày hiện tại
        const currentDate = new Date();

        // Tính số lượng chapters và kiểm tra ngày đóng của truyện
        const stories = await storyModel.aggregate([
            {
                $lookup: {
                    from: 'chapters', // Collection chứa chapters
                    localField: 'chapters', // Liên kết giữa story và chapter
                    foreignField: '_id',
                    as: 'chapterDetails'
                }
            },
            {
                $addFields: {
                    chapterCount: { $size: '$chapterDetails' }, // Thêm trường chapterCount
                    disabled: {
                        $cond: {
                            if: { $eq: ['$date_closed', null] }, // Kiểm tra nếu date_closed là null
                            then: false, // Nếu null, không disabled
                            else: { $gte: [currentDate, '$date_closed'] } // Nếu không null, so sánh với ngày hiện tại
                        }
                    } // Kiểm tra ngày đóng truyện
                }
            },
            {
                $match: filter // Lọc theo chapterCount
            }
        ]);

        // Chuyển đổi Buffer hình ảnh sang Base64
        const modifiedStories = stories.map(story => ({
            ...story,
            image: story.image ? story.image.toString('base64') : null, // Chuyển đổi hình ảnh
        }));

        res.json(modifiedStories);
    } catch (error) {
        console.error('Error fetching stories:', error);
        res.status(500).send('Error fetching stories');
    }
});



router.get("/searchstory", async (req, res) => {
    const query = req.query.name; // Lấy từ khóa tìm kiếm từ query string

    try {
        // Tìm kiếm các truyện có tên chứa từ khóa tìm kiếm, không phân biệt chữ hoa, chữ thường
        const stories = await storyModel.find({
            name: { $regex: query, $options: 'i' },
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
    } catch (error) {
        console.error('Error searching stories:', error);
        res.status(500).send('Error searching stories');
    }
}
);

router.get('/stories/:storyId', async (req, res) => {
    try {
        const story = await storyModel.findById(req.params.storyId);
        if (!story) {
            return res.status(404).send('Story not found');
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
        const story = await storyModel.findById(req.params.storyId).populate('chapters');
        if (!story) {
            console.error('Story not found:', req.params.storyId);
            return res.status(404).send('Story not found');
        }
        console.log('Found story:', story);
        res.json(story.chapters);
    } catch (err) {
        console.error('Error fetching chapters:', err);
        res.status(500).send('Server error');
    }
});


router.get('/stories/:storyId/chapters/:chapterId', async (req, res) => {
    try {
        // Tìm câu chuyện theo storyId
        const story = await storyModel.findById(req.params.storyId).populate('chapters');
        if (!story) {
            console.error('Story not found:', req.params.storyId);
            return res.status(404).send('Story not found');
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

        console.log('Found chapter:', chapter);
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

        let account = null;
        if (accountId) {
            account = await accountModel.findById(accountId);
            if (!account) {
                return res.status(404).json({ message: "Account not found" });
            }
        }

        const story = await storyModel.findById(req.params.storyId).populate('chapters');

        if (!story) {
            return res.status(404).send('Story not found');
        }

        if (!story.chapters || story.chapters.length === 0) {
            return res.status(404).send('No chapters found for this story');
        }

        const firstChapter = story.chapters[0];
        if (!firstChapter) {
            return res.status(404).send('First chapter not found');
        }

        let enableChapter = false;
        if (!account && firstChapter.status === false) {
            enableChapter = true; // Disabled if account._id is null
        } else if (!account && firstChapter.status === true) {
            enableChapter = false; // Both account and chapter are disabled
        } else if (account.status === false && firstChapter.status === false) {
            enableChapter = true; // Both account and chapter are disabled
        } else if (account.status === true && firstChapter.status === false) {
            enableChapter = true; // Account enabled, chapter disabled
        } else if (account.status === false && firstChapter.status === true) {
            enableChapter = false; // Account disabled, chapter enabled
        } else if (account.status === true && firstChapter.status === true) {
            enableChapter = true; // Both account and chapter are enabled
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

        let account = null;
        if (accountId) {
            account = await accountModel.findById(accountId);
            if (!account) {
                return res.status(404).json({ message: "Account not found" });
            }
        }

        const story = await storyModel.findById(req.params.storyId).populate('chapters');

        if (!story) {
            return res.status(404).send('Story not found');
        }

        if (!story.chapters || story.chapters.length === 0) {
            return res.status(404).send('No chapters found for this story');
        }

        const latestChapter = story.chapters[story.chapters.length - 1];
        if (!latestChapter) {
            return res.status(404).send('Latest chapter not found');
        }

        let enableChapter = false;
        if (!account && latestChapter.status === false) {
            enableChapter = true; // Disabled if account._id is null
        } else if (!account && latestChapter.status === true) {
            enableChapter = false; // Both account and chapter are disabled
        } else if (account.status === false && latestChapter.status === false) {
            enableChapter = true; // Both account and chapter are disabled
        } else if (account.status === true && latestChapter.status === false) {
            enableChapter = true; // Account enabled, chapter disabled
        } else if (account.status === false && latestChapter.status === true) {
            enableChapter = false; // Account disabled, chapter enabled
        } else if (account.status === true && latestChapter.status === true) {
            enableChapter = true; // Both account and chapter are enabled
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


module.exports = router;