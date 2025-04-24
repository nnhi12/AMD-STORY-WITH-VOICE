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
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const user = await User.findOne({ account: accountId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cập nhật thông tin tài khoản (nếu có password)
    if (password) {
      await account.save();
    }

    // Cập nhật thông tin người dùng
    user.fullname = fullname || user.fullname;
    user.email = email || user.email;
    user.age = age || user.age;
    user.gender = gender || user.gender;
    user.preferred_categories = preferred_categories
      ? JSON.parse(preferred_categories)
      : user.preferred_categories;
    if (image) {
      user.image = image;
    }

    await user.save();

    res.json({
      message: 'User information updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Error updating user info:', error);
    res.status(500).json({ message: 'An error occurred updating user info.' });
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