const express = require('express');
const router = express.Router();

const accountModel = require('../models/Account.js');

//dang ky vip
router.post('/update-status', async (req, res) => {
    const accountId = req.body.accountId; // Lấy ID tài khoản từ body request

    try {
        // Tìm tài khoản theo ID
        const account = await accountModel.findById(accountId);

        if (!account) {
            return res.status(404).json({ message: 'Tài khoản không tồn tại.' });
        }

        // Cập nhật status
        const updatedStatus = !account.status; // Đổi trạng thái
        account.status = updatedStatus;

        // Cập nhật start_date và end_date nếu tài khoản VIP được kích hoạt
        const currentDate = new Date();
        const endDate = new Date();
        endDate.setDate(currentDate.getDate() + 30);
        if (updatedStatus) {
            account.start_date = currentDate; // Ngày bắt đầu là ngày hiện tại
            account.end_date = endDate; // Ngày kết thúc là 30 ngày sau
        } else {
            // Nếu hủy VIP, có thể reset ngày (hoặc giữ nguyên tùy theo logic của bạn)
            account.start_date = null;
            account.end_date = null;
        }

        // Lưu thay đổi
        await account.save();

        return res.status(200).json({
            message: `Trạng thái tài khoản đã được cập nhật thành công.`,
            newStatus: updatedStatus,
            startDate: account.start_date,
            endDate: account.end_date
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật trạng thái.' });
    }
});

module.exports = router;