const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const Subscription = require('../models/Subcription');

// Cập nhật trạng thái VIP
router.post('/update-status', async (req, res) => {
    const { accountId, checkOnly } = req.body; // Thêm checkOnly để kiểm tra trạng thái

    try {
        // Kiểm tra tài khoản
        const account = await Account.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'Tài khoản không tồn tại.' });
        }

        // Tìm hoặc tạo subscription
        let subscription = await Subscription.findOne({ account: accountId });
        const currentDate = new Date();

        if (checkOnly) {
            // Chỉ kiểm tra trạng thái VIP
            const isVip = subscription && subscription.expired_date > currentDate;
            return res.status(200).json({
                isVip,
                startDate: subscription ? subscription.start_date : null,
                endDate: subscription ? subscription.expired_date : null,
            });
        }

        // Đặt ngày bắt đầu và ngày kết thúc cho VIP
        const endDate = new Date(currentDate);
        endDate.setDate(currentDate.getDate() + 30); // VIP kéo dài 30 ngày

        if (!subscription) {
            // Tạo subscription mới
            subscription = await Subscription.create({
                account: accountId,
                start_date: currentDate,
                expired_date: endDate,
            });
            account.status = true; // Cập nhật trạng thái tài khoản thành VIP
        } else if (subscription.expired_date < currentDate) {
            // Cập nhật subscription nếu đã hết hạn
            subscription.start_date = currentDate;
            subscription.expired_date = endDate;
            await subscription.save();
            account.status = true;
        } else {
            // Subscription còn hiệu lực
            return res.status(200).json({
                message: 'Tài khoản đã là VIP.',
                newStatus: account.status,
                startDate: subscription.start_date,
                endDate: subscription.expired_date,
            });
        }

        // Lưu thay đổi trạng thái tài khoản
        await account.save();

        return res.status(200).json({
            message: 'Trạng thái tài khoản đã được cập nhật thành công.',
            newStatus: account.status,
            startDate: subscription.start_date,
            endDate: subscription.expired_date,
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật trạng thái.', error: error.message });
    }
});

module.exports = router;