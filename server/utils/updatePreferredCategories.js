const mongoose = require('mongoose');
const userModel = require('../models/User'); // Đường dẫn đến userModel của bạn

// Danh sách _id của các thể loại
const categoryIds = [
  "6740beaedc0bae493a7974e8",
  "6749483145e61a10d1b7e910",
  "6749484a45e61a10d1b7e913",
  "6749485945e61a10d1b7e916",
  "67fe68a99b3a7e6b6581bcbd",
  "67fe76b91266b869eb25f9bf",
  "67fe7ca51266b869eb25fa41"
];

// Hàm chọn ngẫu nhiên 2-3 phần tử từ mảng
function getRandomCategories() {
  const count = Math.floor(Math.random() * 2) + 2; // Random 2 hoặc 3
  const shuffled = categoryIds.sort(() => 0.5 - Math.random()); // Xáo trộn mảng
  return shuffled.slice(0, count); // Lấy count phần tử đầu
}

// Hàm cập nhật preferred_categories cho tất cả người dùng
async function updateUserPreferredCategories() {
  try {
    // Kết nối MongoDB
    await mongoose.connect('mongodb+srv://reading_story_db:reading_story_db@readingstory.yg6b6.mongodb.net/READING_STORY', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Đã kết nối MongoDB');

    // Lấy tất cả người dùng
    const users = await userModel.find({});

    if (users.length === 0) {
      console.log('Không tìm thấy người dùng nào');
      return;
    }

    // Cập nhật cho từng người dùng
    for (const user of users) {
      const randomCategories = getRandomCategories();
      // Chuyển sang ObjectId
      const preferredCategories = randomCategories.map(id => new mongoose.Types.ObjectId(id));
      
      // Cập nhật preferred_categories
      await userModel.updateOne(
        { _id: user._id },
        { $set: { preferred_categories: preferredCategories } }
      );
      console.log(`Đã cập nhật preferred_categories cho user ${user.fullname || user.account}:`, randomCategories);
    }

    console.log('Cập nhật hoàn tất');
  } catch (error) {
    console.error('Lỗi khi cập nhật preferred_categories:', error);
  } finally {
    // Ngắt kết nối
    await mongoose.disconnect();
    console.log('Đã ngắt kết nối MongoDB');
  }
}

// Chạy hàm
updateUserPreferredCategories();