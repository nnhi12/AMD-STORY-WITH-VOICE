const express = require('express');
const router = express.Router();

const accountModel = require('../models/Account.js');
const userModel = require('../models/User.js');

router.post("/login", async (req, res) => {
    // Lấy tên đăng nhập và mật khẩu từ yêu cầu
    const { username, password } = req.body;

    try {
        // Tìm tài khoản bằng tên đăng nhập và mật khẩu
        const account = await accountModel.findOne({ username: username, password: password });

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


router.post("/register", async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Kiểm tra xem username đã tồn tại chưa
        const existingAccount = await accountModel.findOne({ username });
        if (existingAccount) {
            return res.status(400).json({ message: "Username already exists. Please choose a different username." });
        }

        // Kiểm tra xem email đã tồn tại chưa
        const existingEmail = await userModel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists. Please use a different email." });
        }

        // Nếu username và email chưa tồn tại, tiến hành tạo tài khoản và user mới
        const account = await accountModel.create({
            username,
            password,
            role: 'user',
            status: false,
        });

        const user = await userModel.create({
            account: account._id,
            fullname: "",
            email,
        });

        res.json({ account, user });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "An error occurred during registration. Please try again later." });
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