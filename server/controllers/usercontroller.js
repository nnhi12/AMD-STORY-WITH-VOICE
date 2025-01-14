const express = require('express');
const router = express.Router();

const multer = require("multer");

const accountModel = require('../models/Account.js');
const userModel = require('../models/User.js');


const upload = multer();

router.get("/userinfo/:accountId", async (req, res) => {
    const accountId = req.params.accountId;
    try {
        const account = await accountModel.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        const user = await userModel.findOne({ account: accountId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            username: account.username,
            password: account.password, // Nếu mật khẩu không được mã hóa
            email: user.email,
            age: user.age,
            fullname: user.fullname,
            image: user.image ? user.image.toString('base64') : null, // Trả về hình ảnh ở dạng Base64
        });
    } catch (error) {
        console.error("Error fetching user info:", error);
        res.status(500).json({ message: "An error occurred fetching user info." });
    }
});

router.put("/userinfo/:accountId", upload.single("image"), async (req, res) => {
    const accountId = req.params.accountId;
    const { fullname, email, password, age } = req.body;
    const image = req.file ? req.file.buffer : undefined; // Lưu trực tiếp dưới dạng Buffer

    try {
        const account = await accountModel.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        const user = await userModel.findOneAndUpdate(
            { account: accountId },
            { fullname, email, password, age, image }, // Lưu Buffer vào cơ sở dữ liệu
            { new: true }
        );

        if (user) {
            res.json({
                message: "User information updated successfully",
                data: user,
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Error updating user info:", error);
        res.status(500).json({ message: "An error occurred updating user info." });
    }
});

router.get('/account-status', async (req, res) => {
    const accountId = req.query.accountId; // Lấy ID tài khoản từ query params

    try {
        // Tìm tài khoản theo ID
        const account = await accountModel.findById(accountId);

        if (!account) {
            return res.status(404).json({ message: 'Tài khoản không tồn tại.' });
        }

        return res.status(200).json({
            status: account.status
        });
    } catch (error) {
        console.error('Lỗi khi lấy trạng thái:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy trạng thái tài khoản.' });
    }
});

//check thoi gian VIP cua tai khoan
router.post('/check-status', async (req, res) => {
    const { accountId } = req.body; // Lấy accountId từ body request

    try {
        const account = await accountModel.findById(accountId);

        if (!account) {
            return res.status(404).json({ message: 'Tài khoản không tồn tại.' });
        }

        const currentDate = new Date();

        const end_date = account.end_date; 
        // Kiểm tra và cập nhật trạng thái tài khoản nếu hết hạn
        if (account.end_date && currentDate >= account.end_date) {
            account.status = false;
            account.start_date = null;
            account.end_date = null;
            await account.save();
        }

        res.status(200).json({
            message: 'Kiểm tra trạng thái tài khoản thành công.',
            status: account.status,
            startDate: account.start_date,
            endDate: account.end_date,
            end_date: end_date
        });
    } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi kiểm tra trạng thái tài khoản.' });
    }
});

module.exports = router;