const express = require('express');
const router = express.Router();

const storyModel = require('../models/Story.js');

router.get("/story-by-voice", async (req, res) => {
  const query = req.query.name; // Lấy từ khóa tìm kiếm từ query string

  if (!query) {
      return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });
  }

  try {
      // Tìm kiếm truyện có tên chứa từ khóa, không phân biệt chữ hoa, chữ thường
      const stories = await storyModel.find({
          name: { $regex: query, $options: 'i' },
          $or: [
              { date_closed: { $gt: new Date() } }, // Truyện chưa đóng
              { date_closed: { $eq: null } } // Truyện không có ngày đóng
          ]
      }).sort({ views: -1 }); // Sắp xếp theo lượt xem giảm dần

      if (stories.length === 0) {
          return res.status(404).json({ message: "Không tìm thấy truyện" });
      }

      // Chuyển đổi ảnh sang base64 (nếu có)
      const modifiedStories = stories.map(story => ({
          id: story._id,
          name: story.name,
          image: story.image ? story.image.toString('base64') : null
      }));

      res.json(modifiedStories);
  } catch (error) {
      console.error("Lỗi khi tìm kiếm truyện:", error);
      res.status(500).json({ message: "Lỗi server" });
  }
});


  module.exports = router;