const express = require('express');
const router = express.Router();
const multer = require('multer');

const Account = require('../models/Account.js');
const User = require('../models/User.js');
const Subscription = require('../models/Subcription.js');

const upload = multer();

// Lấy thông tin người dùng
router.get('/userinfo/:accountId', async (req, res) => {
  const accountId = req.params.accountId;
  try {
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const user = await User.findOne({ account: accountId }).populate('preferred_categories', 'name');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      username: account.username,
      email: user.email,
      age: user.age,
      gender: user.gender,
      fullname: user.fullname,
      image: user.image ? user.image.toString('base64') : null,
      preferred_categories: user.preferred_categories.map((cat) => cat._id), // Chỉ gửi ID
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'An error occurred fetching user info.' });
  }
});

// Cập nhật thông tin người dùng
router.put('/userinfo/:accountId', upload.single('image'), async (req, res) => {
  const accountId = req.params.accountId;
  const { fullname, email, gender, password, age, preferred_categories } = req.body;
  const image = req.file ? req.file.buffer : undefined;

  try {
    // Kiểm tra accountId
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Tìm user
    const user = await User.findOne({ account: accountId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Kiểm tra dữ liệu đầu vào
    if (!fullname && !email && !age && !gender && !preferred_categories && !image && !password) {
      return res.status(400).json({ message: 'Cần ít nhất một trường để cập nhật' });
    }

    // Cập nhật thông tin tài khoản (nếu có password)
    if (password) {
      account.password = await bcrypt.hash(password, 10);
      await account.save();
    }

    // Xử lý preferred_categories
    let categories = user.preferred_categories;
    if (preferred_categories) {
      try {
        categories = JSON.parse(preferred_categories);
        if (!Array.isArray(categories)) {
          return res.status(400).json({ message: 'preferred_categories phải là mảng' });
        }
        categories = categories.filter((id) => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/));
        if (categories.length === 0 && preferred_categories !== '[]') {
          return res.status(400).json({ message: 'Không có ID thể loại hợp lệ trong preferred_categories' });
        }
      } catch (error) {
        console.error('Lỗi khi phân tích preferred_categories:', error.message);
        return res.status(400).json({ message: 'preferred_categories không hợp lệ', error: error.message });
      }
    }

    // Cập nhật thông tin người dùng
    user.fullname = fullname || user.fullname || '';
    user.email = email || user.email || '';
    user.age = age ? Number(age) : user.age || 0;
    user.gender = gender || user.gender || 'other';
    user.preferred_categories = categories;
    if (image) {
      user.image = image;
    }

    await user.save();

    console.log('Dữ liệu nhận được:', req.body);
    console.log('preferred_categories hợp lệ:', categories);
    console.log('Cập nhật người dùng thành công:', user);

    res.json({
      message: 'User information updated successfully',
      data: {
        ...user.toObject(),
        image: user.image ? user.image.toString('base64') : null,
      },
    });
  } catch (error) {
    console.error('Error updating user info:', error);
    res.status(500).json({ message: 'An error occurred updating user info', error: error.message });
  }
});

// Kiểm tra trạng thái tài khoản
router.get('/account-status', async (req, res) => {
  const accountId = req.query.accountId;

  try {
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại.' });
    }

    // Kiểm tra thông tin đăng ký từ model Subscription
    const subscription = await Subscription.findOne({ account: accountId });

    let subscriptionStatus = false;
    let startDate = null;
    let endDate = null;

    if (subscription) {
      const currentDate = new Date();
      subscriptionStatus = subscription.expired_date > currentDate;
      startDate = subscription.start_date;
      endDate = subscription.expired_date;

      // Cập nhật trạng thái tài khoản nếu đăng ký đã hết hạn
      if (!subscriptionStatus && account.status) {
        account.status = false;
        await account.save();
      }
    }

    return res.status(200).json({
      status: account.status,
      subscription: {
        isActive: subscriptionStatus,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy trạng thái:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy trạng thái tài khoản.' });
  }
});

// Kiểm tra trạng thái VIP của tài khoản
router.post('/check-status', async (req, res) => {
  const { accountId } = req.body;

  try {
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại.' });
    }

    const subscription = await Subscription.findOne({ account: accountId });

    let subscriptionStatus = false;
    let startDate = null;
    let endDate = null;

    if (subscription) {
      const currentDate = new Date();
      subscriptionStatus = subscription.expired_date > currentDate;
      startDate = subscription.start_date;
      endDate = subscription.expired_date;

      // Cập nhật trạng thái tài khoản nếu đăng ký đã hết hạn
      if (!subscriptionStatus && account.status) {
        account.status = false;
        await account.save();
      }
    }

    res.status(200).json({
      message: 'Kiểm tra trạng thái tài khoản thành công.',
      status: account.status,
      subscription: {
        isActive: subscriptionStatus,
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi kiểm tra trạng thái tài khoản.' });
  }
});

module.exports = router;