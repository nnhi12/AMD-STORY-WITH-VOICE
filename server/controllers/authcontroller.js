const express = require('express');
const router = express.Router();

const accountModel = require('../models/Account.js');
const userModel = require('../models/User.js');
const subscriptionModel = require('../models/Subcription.js');

router.post("/login", async (req, res) => {
    // Lấy tên đăng nhập và mật khẩu từ yêu cầu
    const { username, password } = req.body;

    try {
        // Tìm tài khoản bằng tên đăng nhập và mật khẩu
        const account = await accountModel.findOne({ username: username, password: password });

        // const email = await userModel.findOne({email: email, accountaccount});

        // const accountEmail = await accountModel.findOne()

        // Nếu không tìm thấy tài khoản, trả về lỗi
        if (!account) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        // Tìm thông tin người dùng dựa trên ID tài khoản
        const user = await userModel.findOne({ account: account._id });

        // Nếu không tìm thấy người dùng, trả về lỗi (nếu cần)
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Đăng nhập thành công, trả về thông tin tài khoản và người dùng
        res.json({ account: account, user: user });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "An error occurred during login. Please try again later." });
    }
});


router.post('/register', async (req, res) => {
    try {
        const { username, password, email, age, gender, preferred_categories } = req.body;

        // Kiểm tra xem username đã tồn tại chưa
        const existingAccount = await accountModel.findOne({ username });
        if (existingAccount) {
            return res.status(400).json({ message: 'Username already exists. Please choose a different username.' });
        }

        // Kiểm tra xem email đã tồn tại chưa
        const existingEmail = await userModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already exists. Please use a different email.' });
        }

        // Kiểm tra age là số hợp lệ
        if (typeof age !== 'number' || age < 0) {
            return res.status(400).json({ message: 'Invalid age provided.' });
        }

        // Kiểm tra gender hợp lệ
        if (!['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({ message: 'Invalid gender provided.' });
        }

        // Kiểm tra preferred_categories là mảng hợp lệ
        if (preferred_categories && !Array.isArray(preferred_categories)) {
            return res.status(400).json({ message: 'Preferred categories must be an array.' });
        }

        // Tạo tài khoản mới
        const account = await accountModel.create({
            username,
            password,
            role: 'user',
            status: false, // Đặt status là true để tài khoản hoạt động ngay
        });

        // Tạo user mới
        const user = await userModel.create({
            account: account._id,
            fullname: '',
            email,
            age,
            gender,
            preferred_categories: preferred_categories || [], // Lưu danh sách thể loại
        });

        const subscription = await subscriptionModel.create({
            account: account._id,
            start_date: null,
            expired_date: null,
        });

        res.status(201).json({
            message: 'Registration successful.',
            account,
            user,
            subscription,
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'An error occurred during registration. Please try again later.' });
    }
});

router.post("/reset-password", async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        // Kiểm tra xem email có tồn tại trong User không
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email không tồn tại" });
        }

        // Kiểm tra tài khoản tương ứng
        const account = await accountModel.findOne({ _id: user.account });
        if (!account) {
            return res.status(404).json({ message: "Tài khoản không tồn tại cho email này" });
        }

        // Cập nhật mật khẩu mới cho tài khoản
        account.password = newPassword; // Cập nhật mật khẩu mới mà không mã hóa
        await account.save();

        res.status(200).json({ message: "Mật khẩu đã được thay đổi thành công!" });
    } catch (error) {
        console.error("Lỗi khi thay đổi mật khẩu:", error);
        res.status(500).json({ message: "Lỗi trong quá trình thay đổi mật khẩu. Vui lòng thử lại." });
    }
});

module.exports = router;