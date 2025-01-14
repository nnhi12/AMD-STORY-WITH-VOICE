const express = require('express');
const router = express.Router();

const accountModel = require('../models/Account.js');
const userModel = require('../models/User.js');
const chapterModel = require('../models/Chapter.js');
const commentModel = require('../models/Comment.js');

router.post('/stories/:storyId/chapters/:chapterId/comments', async (req, res) => {
    try {
        const { content, accountId } = req.body;

        // Find the user by accountId
        const user = await userModel.findOne({ account: accountId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the chapter by chapterId
        const chapter = await chapterModel.findById(req.params.chapterId);
        if (!chapter) {
            return res.status(404).send('Chapter not found');
        }

        // Create and save the new comment
        const newComment = await new commentModel({
            message: content,
            created_at: new Date(),
        }).save();

        // Update user by pushing the new comment's ID into their comments array
        await userModel.findByIdAndUpdate(user._id, { $push: { comments: newComment._id } });

        // Add the new comment's ID to the chapter's comments array and save
        await chapterModel.findByIdAndUpdate(
            chapter._id,
            { $push: { comments: newComment._id } },
            { new: true }  // Option to return the updated document
        );

        res.status(200).json({ message: 'Comment added successfully', comment: newComment });
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).send('Server error');
    }
});

router.get('/stories/:storyId/chapters/:chapterId/comments', async (req, res) => {
    try {
        // Find the chapter by chapterId and populate the comments field
        const chapter = await chapterModel.findById(req.params.chapterId).populate('comments');

        if (!chapter) {
            return res.status(404).send('Chapter not found');
        }

        const comments = chapter.comments;
        const commentsWithUserInfo = await Promise.all(comments.map(async (comment) => {
            const user = await userModel.findOne({ comments: comment._id });
            const account = await accountModel.findOne({ _id: user.account }); // Tìm người dùng theo userId trong bình luận
            if (user) {
                // Convert image Buffer to base64 (nếu có hình ảnh)
                const imageBase64 = user.image ? `data:image/jpeg;base64,${user.image.toString('base64')}` : null;

                return {
                    content: comment.content,
                    message: comment.message,
                    created_at: comment.created_at,
                    user: { // Lấy username
                        username: account.username,
                        image: imageBase64,      // Lấy hình ảnh (nếu có)
                    }
                };
            } else {
                return {
                    content: comment.content,
                    message: comment.message,
                    created_at: comment.created_at,
                    user: {
                        username: 'Unknown',
                        image: null
                    }
                };
            }
        }));

        res.status(200).json({ comments: commentsWithUserInfo });
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
